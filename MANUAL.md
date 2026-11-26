# Antigravity Chapter Ingestion Manual (`MANUAL.md`)

This manual instructs future **Antigravity** sessions on how to detect newly uploaded NCERT Biology chapter PDFs in this repository and generate complete, verbatim, production-ready chapter modules matching the exact architecture of Chapters 8, 9, and 10.

---

## 1. Check the Pre-Generated Inventory First

1. Read `src/data/chapters/inventory.json` to see all PDFs already generated (including `pdfFile`, `sha256`, `chapterId`, `lineCount`, `diagramCount`, and `vaultCount`).
2. List all `*.pdf` files at the repository root (`ls -la *.pdf`) OR run:
   ```bash
   npm run validate:chapters
   ```
   The validator automatically emits a `WARN: Unprocessed PDF detected in repo root: <filename>.pdf` for every new chapter PDF not yet generated.

---

## 2. Inspect & Extract PDF Pages + Cropped Diagrams

Ensure the local Python environment has `pymupdf` and `pillow`:
```bash
python3 -m venv .venv && .venv/bin/pip install pymupdf pillow
```

### Step 2a — Inspect the new PDF visually and geometrically
1. View every page of the new PDF using `view_file` (to read exact typography, subscripts, callout boxes, tables, and diagram boundaries).
2. Run the bounding-box inspector to get PDF point coordinates for every figure and table:
   ```bash
   .venv/bin/python3 scripts/extract_pdf_assets.py --inspect <new_chapter.pdf>
   ```

### Step 2b — Register diagram crops & run asset extraction
1. Add a new chapter entry (e.g., `"ch11"`) to `scripts/diagram_crops.json` listing:
   - `"pdf"`: exact root filename (e.g., `"b11photo.pdf"`)
   - `"diagrams"`: array of `{ "id": "fig-11-1", "page": <1-based PDF page>, "rect": [x0, y0, x1, y1] }`
2. Run asset extraction for the new chapter:
   ```bash
   .venv/bin/python3 scripts/extract_pdf_assets.py --chapter ch11
   ```
   This outputs:
   - Full high-DPI page renders to `public/pdf-pages/ch11/page-XX.webp` (used by **PDF Page Peek**).
   - Tightly trimmed, 3× retina cropped figures to `public/diagrams/ch11/<id>.png`.
3. **MANDATORY VISUAL CHECK**: Inspect every cropped PNG via `view_file` (or a contact sheet) to confirm ZERO clipped labels and ZERO bleed from adjacent paragraphs! Adjust `rect` in `scripts/diagram_crops.json` and re-run if any text edge bleeds.

---

## 3. Author the Verbatim Chapter Data Module

Create `src/data/chapters/chXX-<slug>.ts` exporting `chapterXX: ChapterData` using `ChapterLineBuilder` from `./helpers.ts`.

### Strict NCERT Authoring Rules
1. **100% Verbatim Text**:
   - Never summarize, paraphrase, or omit sentences from the NCERT chapter.
   - Split every paragraph into individual addressable sentences (each becomes an `NcertLine` with exact `pdfPage` and printed `ncertPage`).
   - Fix OCR artifacts (e.g., `mm` → `µm`, broken hyphens, stray page headers) by cross-checking the PDF page screenshots. Use clean Unicode subscripts/superscripts (`CO₂`, `H₂O`, `Na⁺/K⁺`, `PO₄³⁻`, `G₁`, `G₀`).
   - Include:
     - Unit introduction & Scientist biography page (if present at the start of the PDF) as `callout` blocks.
     - All numbered sections & subsections (`level: 1 | 2 | 3`).
     - All NCERT yellow/orange inquiry/numerical boxes as `callout` blocks.
     - All NCERT numbered tables as `table` blocks (`NcertTableBlock`).
     - All reaction / formula boxes as `equation` blocks (`EquationBlock`).
     - Full verbatim NCERT `Summary` (`style: 'summary'`) and `Exercises` (`style: 'exercise'`).
2. **Active Recall Cloze Terms (`clozeTerms`)**:
   - On important sentences, include 1–5 exact verbatim substrings in `clozeTerms` (scientists, dates, numbers, dimensions, examples, qualifiers like `only`, `except`, `almost all`) so Active Recall Cloze Mode masks high-yield terms cleanly.
   - Set `isHighYield: true` on classic NEET-tested lines.
3. **Side-by-Side Diagram Information Lists (`diagrams`)**:
   - Every cropped figure MUST have an entry in `diagrams` AND an inline `{ type: 'diagram', diagramId: '...' }` anchor inside the relevant section.
   - Populate `infoList` with structured items categorized as:
     - `'label'`: Every visible diagram label and its biological significance.
     - `'fact'`: Verbatim NCERT facts conveyed by the figure.
     - `'inference'`: Visual comparisons, subtle details present *only* in the diagram (e.g., `Km` in Fig 9.5c, disulphide bonds in Fig 9.3c), and classic NEET traps.
4. **End-of-Chapter Categorized Vault (`vault`)**:
   - Populate all 5 `VaultCategoryKey` buckets:
     - `scientists_years` — Discoveries, dates, named researchers.
     - `numbers_dimensions` — Exact sizes, percentages, durations, counts, thresholds.
     - `examples_exceptions` — Organisms, molecules, NCERT exceptions.
     - `equations_tables` — Reaction schemes, structural comparisons, condensed table facts.
     - `word_traps` — Subtle NCERT wording, qualifiers, and Summary-only facts.
   - Link every vault item to its `sourceLineId` and `ncertPage` whenever it comes from a specific line.

---

## 4. Register, Update Inventory & Verify

1. Import and append `chapterXX` in `src/data/chapters/index.ts` (keep chapters ordered by `chapterNumber`).
2. Add the new chapter's filename mapping (optional, auto-detected if named `chXX-*.ts`) and update `src/data/chapters/inventory.json`:
   ```bash
   npx tsx scripts/validate_chapters.ts --write-inventory
   ```
3. Run the full verification suite before committing/pushing:
   ```bash
   npm run validate:chapters && npm run test && npm run build
   ```
4. Confirm all checks pass with zero errors and zero unprocessed-PDF warnings.
5. Commit and push to `main` — `.github/workflows/deploy-pages.yml` automatically validates, tests, builds (`VITE_BASE_PATH=/bio-app/`), and publishes the updated chapters to `https://adityacoder1.github.io/bio-app/`.
