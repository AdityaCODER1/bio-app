import type {
  ChapterData,
  ChapterDiagram,
  ChapterSection,
  MasteryStatus,
  NcertLine,
  StudyState,
  VaultItem,
} from '../types/study';

export interface FlattenedLineRef {
  line: NcertLine;
  section: ChapterSection;
  paragraphText: string;
}

export function getAllChapterLines(chapter: ChapterData): FlattenedLineRef[] {
  const result: FlattenedLineRef[] = [];
  for (const section of chapter.sections) {
    for (const block of section.blocks) {
      if (block.type === 'paragraph' || block.type === 'callout') {
        const paragraphText = block.lines.map((l) => l.text).join(' ');
        for (const line of block.lines) {
          result.push({ line, section, paragraphText });
        }
      }
    }
  }
  return result;
}

export function getResolvedVaultItems(chapter: ChapterData, state: StudyState): VaultItem[] {
  const deletedSet = new Set(state.deletedVaultIds);
  const baseItems: VaultItem[] = chapter.vault
    .filter((item) => !deletedSet.has(item.id))
    .map((item) => ({
      ...item,
      ...(state.editedVaultItems[item.id] ?? {}),
    }));

  const customItems = state.customVaultItems[chapter.id] ?? [];
  return [...baseItems, ...customItems];
}

export interface ChapterProgressStats {
  totalLines: number;
  masteredLines: number;
  reviewLines: number;
  unreadLines: number;
  customLineCount: number;
  unmasteredCustomLines: number;
  noteCount: number;
  unmasteredNotes: number;
  pinnedMcqCount: number;
  unmasteredMcqs: number;
  totalVaultItems: number;
  masteredVaultItems: number;
  masteryPercent: number;
  revisionQueueCount: number;
}

export function computeChapterStats(
  chapter: ChapterData,
  state: StudyState,
): ChapterProgressStats {
  const lines = getAllChapterLines(chapter);
  let masteredLines = 0;
  let reviewLines = 0;
  let unreadLines = 0;

  let customLineCount = 0;
  let unmasteredCustomLines = 0;
  let noteCount = 0;
  let unmasteredNotes = 0;
  let pinnedMcqCount = 0;
  let unmasteredMcqs = 0;

  const targetIds = new Set<string>();

  for (const { line } of lines) {
    targetIds.add(line.id);
    const status: MasteryStatus = state.lineMastery[line.id] ?? 'unread';
    if (status === 'mastered') masteredLines++;
    else if (status === 'review') reviewLines++;
    else unreadLines++;

    const cLines = state.customLines[line.id] ?? [];
    customLineCount += cLines.length;
    unmasteredCustomLines += cLines.filter((c) => c.status !== 'mastered').length;
  }

  for (const diag of chapter.diagrams) {
    targetIds.add(diag.id);
  }

  for (const tid of targetIds) {
    const notes = state.lineNotes[tid] ?? [];
    noteCount += notes.length;
    unmasteredNotes += notes.filter((n) => n.status !== 'mastered').length;

    const mcqs = state.pinnedMcqs[tid] ?? [];
    pinnedMcqCount += mcqs.length;
    unmasteredMcqs += mcqs.filter((m) => m.status !== 'mastered').length;
  }

  const resolvedVault = getResolvedVaultItems(chapter, state);
  const masteredVaultItems = resolvedVault.filter(
    (v) => (state.vaultMastery[v.id] ?? 'unread') === 'mastered',
  ).length;

  const denominator = lines.length + customLineCount;
  const numerator = masteredLines + (customLineCount - unmasteredCustomLines);
  const masteryPercent = denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);

  const revisionQueueCount =
    reviewLines + unmasteredCustomLines + unmasteredNotes + unmasteredMcqs;

  return {
    totalLines: lines.length,
    masteredLines,
    reviewLines,
    unreadLines,
    customLineCount,
    unmasteredCustomLines,
    noteCount,
    unmasteredNotes,
    pinnedMcqCount,
    unmasteredMcqs,
    totalVaultItems: resolvedVault.length,
    masteredVaultItems,
    masteryPercent,
    revisionQueueCount,
  };
}

export function findDiagramById(chapter: ChapterData, diagramId: string): ChapterDiagram | undefined {
  return chapter.diagrams.find((d) => d.id === diagramId);
}
