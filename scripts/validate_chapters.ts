import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS } from '../src/data/chapters/index.ts';
import type { ChapterInventory, InventoryEntry } from '../src/types/study.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const INVENTORY_PATH = path.join(REPO_ROOT, 'src', 'data', 'chapters', 'inventory.json');

const DATA_FILE_MAP: Record<string, string> = {
  ch08: 'src/data/chapters/ch08-cell-unit-of-life.ts',
  ch09: 'src/data/chapters/ch09-biomolecules.ts',
  ch10: 'src/data/chapters/ch10-cell-cycle-division.ts',
  ch11: 'src/data/chapters/ch11-photosynthesis.ts',
  ch12: 'src/data/chapters/ch12-respiration-in-plants.ts',
  ch13: 'src/data/chapters/ch13-plant-growth-development.ts',
};

function sha256File(filePath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function main() {
  const writeInventory = process.argv.includes('--write-inventory');
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries: InventoryEntry[] = [];

  const globalLineIds = new Set<string>();
  const globalDiagramIds = new Set<string>();
  const globalVaultIds = new Set<string>();
  const processedPdfs = new Set<string>();

  for (const chapter of CHAPTERS) {
    const pdfPath = path.join(REPO_ROOT, chapter.pdfFile);
    if (!fs.existsSync(pdfPath)) {
      errors.push(`[${chapter.id}] Source PDF missing at repo root: ${chapter.pdfFile}`);
      continue;
    }
    processedPdfs.add(chapter.pdfFile);

    const chapterLineIds = new Set<string>();
    let lineCount = 0;

    for (const section of chapter.sections) {
      for (const block of section.blocks) {
        if (block.type === 'paragraph' || block.type === 'callout') {
          for (const line of block.lines) {
            lineCount += 1;
            if (!line.text.trim()) {
              errors.push(`[${chapter.id}] Empty line text for ${line.id}`);
            }
            if (globalLineIds.has(line.id)) {
              errors.push(`[${chapter.id}] Duplicate line ID: ${line.id}`);
            }
            globalLineIds.add(line.id);
            chapterLineIds.add(line.id);

            if (line.pdfPage < 1 || line.pdfPage > chapter.pdfPageCount) {
              errors.push(
                `[${chapter.id}] Line ${line.id} has out-of-range pdfPage=${line.pdfPage} (max ${chapter.pdfPageCount})`,
              );
            }
          }
        } else if (block.type === 'diagram') {
          if (!chapter.diagrams.some((d) => d.id === block.diagramId)) {
            errors.push(`[${chapter.id}] Broken diagram anchor: ${block.diagramId}`);
          }
        }
      }
    }

    // Verify rendered PDF page images exist
    for (let p = 1; p <= chapter.pdfPageCount; p++) {
      const pageWebp = path.join(
        PUBLIC_DIR,
        'pdf-pages',
        chapter.id,
        `page-${String(p).padStart(2, '0')}.webp`,
      );
      if (!fs.existsSync(pageWebp)) {
        errors.push(`[${chapter.id}] Missing rendered PDF page asset: ${pageWebp}`);
      }
    }

    // Verify diagrams and side info lists
    for (const diag of chapter.diagrams) {
      if (globalDiagramIds.has(diag.id)) {
        errors.push(`[${chapter.id}] Duplicate diagram ID: ${diag.id}`);
      }
      globalDiagramIds.add(diag.id);
      const diskPath = path.join(PUBLIC_DIR, diag.imagePath.replace(/^\//, ''));
      if (!fs.existsSync(diskPath)) {
        errors.push(`[${chapter.id}] Missing cropped diagram image: ${diag.imagePath}`);
      }
      if (diag.infoList.length === 0) {
        errors.push(`[${chapter.id}] Diagram ${diag.id} has an empty side infoList`);
      }
    }

    // Verify vault items & optional sourceLineId links
    for (const v of chapter.vault) {
      if (globalVaultIds.has(v.id)) {
        errors.push(`[${chapter.id}] Duplicate vault ID: ${v.id}`);
      }
      globalVaultIds.add(v.id);
      if (v.sourceLineId && !chapterLineIds.has(v.sourceLineId)) {
        errors.push(`[${chapter.id}] Vault item ${v.id} references unknown sourceLineId: ${v.sourceLineId}`);
      }
    }

    const guessedDataFile =
      DATA_FILE_MAP[chapter.id] ||
      fs
        .readdirSync(path.join(REPO_ROOT, 'src', 'data', 'chapters'))
        .find((f) => f.startsWith(`${chapter.id}-`) && f.endsWith('.ts')) ||
      `src/data/chapters/${chapter.id}.ts`;

    entries.push({
      chapterId: chapter.id,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      unitTitle: chapter.unitTitle,
      pdfFile: chapter.pdfFile,
      sha256: sha256File(pdfPath),
      pageCount: chapter.pdfPageCount,
      ncertPageRange: chapter.ncertPageRange,
      dataFile: guessedDataFile.startsWith('src/')
        ? guessedDataFile
        : `src/data/chapters/${guessedDataFile}`,
      diagramCount: chapter.diagrams.length,
      lineCount,
      vaultCount: chapter.vault.length,
      generatedAt: new Date().toISOString(),
    });
  }

  // Detect any newly uploaded root PDFs not yet in inventory
  const rootPdfs = fs
    .readdirSync(REPO_ROOT)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .sort();
  for (const pdf of rootPdfs) {
    if (!processedPdfs.has(pdf)) {
      warnings.push(`Unprocessed PDF detected in repo root: ${pdf} — see MANUAL.md to generate.`);
    }
  }

  if (writeInventory) {
    const inventory: ChapterInventory = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      chapters: entries,
    };
    fs.writeFileSync(INVENTORY_PATH, `${JSON.stringify(inventory, null, 2)}\n`, 'utf-8');
    console.log(`Wrote inventory manifest -> ${path.relative(REPO_ROOT, INVENTORY_PATH)}`);
  } else if (!fs.existsSync(INVENTORY_PATH)) {
    errors.push('Missing src/data/chapters/inventory.json (run with --write-inventory).');
  } else {
    const existing = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8')) as ChapterInventory;
    const existingByPdf = new Map(existing.chapters.map((c) => [c.pdfFile, c]));
    for (const entry of entries) {
      const inv = existingByPdf.get(entry.pdfFile);
      if (!inv) {
        errors.push(`Chapter ${entry.chapterId} (${entry.pdfFile}) missing from inventory.json`);
      } else if (inv.sha256 !== entry.sha256) {
        warnings.push(`PDF hash changed for ${entry.pdfFile} — re-run extraction & update inventory.`);
      }
    }
  }

  console.log('\nChapter Validation Summary:');
  for (const e of entries) {
    console.log(
      `  • Ch ${e.chapterNumber} (${e.chapterId}) — ${e.title}: ${e.lineCount} lines, ${e.diagramCount} diagrams, ${e.vaultCount} vault items [${e.pdfFile}]`,
    );
  }

  for (const w of warnings) {
    console.warn(`WARN: ${w}`);
  }

  if (errors.length > 0) {
    console.error('\nValidation FAILED:');
    for (const err of errors) console.error(`  ✗ ${err}`);
    process.exit(1);
  }

  console.log('\nAll chapter datasets, diagram crops, PDF pages, and inventory checks PASSED.');
}

main();
