export type GeminiModelId =
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.5-flash'
  | 'gemini-3.8-flash'
  | 'gemini-4-hydrogen'
  | (string & {});

export interface GeminiModelPreset {
  id: GeminiModelId;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  family: 'gemini-3' | 'gemini-4';
  defaultThinkingLevel: 'minimal' | 'low' | 'medium' | 'high';
  supportsSamplingParams: boolean;
}

export const GEMINI_MODEL_PRESETS: GeminiModelPreset[] = [
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash-Lite',
    shortLabel: '3.1 Flash-Lite',
    badge: 'Ultra Fast',
    description: 'Lowest latency & cost for rapid line-by-line doubts and quick MCQs',
    family: 'gemini-3',
    defaultThinkingLevel: 'minimal',
    supportsSamplingParams: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    shortLabel: '3.5 Flash-Lite',
    badge: 'Fast · 3.5',
    description: 'Fastest 3.5-series model with strong structured MCQ formatting',
    family: 'gemini-3',
    defaultThinkingLevel: 'low',
    supportsSamplingParams: true,
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    shortLabel: '3.5 Flash',
    badge: 'Balanced',
    description: 'Balanced NCERT reasoning, concept breakdowns, and NEET traps',
    family: 'gemini-3',
    defaultThinkingLevel: 'medium',
    supportsSamplingParams: true,
  },
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    shortLabel: '3.8 Flash',
    badge: 'Deep 3.8',
    description: 'High-intelligence Flash model for tricky Assertion-Reason & cross-chapter links',
    family: 'gemini-3',
    defaultThinkingLevel: 'medium',
    supportsSamplingParams: true,
  },
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    shortLabel: '4 Hydrogen',
    badge: 'Gemini 4',
    description: 'Latest Gemini 4 model for deep NCERT synthesis & hardest NEET statement traps',
    family: 'gemini-4',
    defaultThinkingLevel: 'medium',
    supportsSamplingParams: false,
  },
];

export type MasteryStatus = 'unread' | 'review' | 'mastered';

export type LineHighlightTier = 'important' | 'volatile' | 'trap' | 'pyq';

export const LINE_HIGHLIGHT_ORDER: LineHighlightTier[] = [
  'important',
  'volatile',
  'trap',
  'pyq',
];

export const LINE_HIGHLIGHT_META: Record<
  LineHighlightTier,
  {
    label: string;
    shortLabel: string;
    shortcutKey: '1' | '2' | '3' | '4';
    description: string;
    priority: number;
  }
> = {
  important: {
    label: 'Important',
    shortLabel: 'Important',
    shortcutKey: '1',
    description: 'Core NCERT sentence worth skimming before exams',
    priority: 1,
  },
  volatile: {
    label: 'Volatile',
    shortLabel: 'Volatile',
    shortcutKey: '2',
    description: 'Hard to remember — numbers, dates, examples, or terms that slip easily',
    priority: 3,
  },
  trap: {
    label: 'Critical / Trap',
    shortLabel: 'Trap',
    shortcutKey: '3',
    description: 'Subtle NCERT word-trap, exception, or mock-test mistake',
    priority: 4,
  },
  pyq: {
    label: 'PYQ / Must-Know',
    shortLabel: 'PYQ',
    shortcutKey: '4',
    description: 'Frequently tested NEET PYQ statement',
    priority: 2,
  },
};

export type ClozeScope = 'all' | 'highlighted' | 'volatile_trap';

export type NoteTag = 'PYQ' | 'Trap' | 'Exception' | 'Mnemonic' | 'Concept';

export const NOTE_TAGS: NoteTag[] = ['PYQ', 'Trap', 'Exception', 'Mnemonic', 'Concept'];

export type McqStyle =
  | 'single_correct'
  | 'assertion_reason'
  | 'statement_pair'
  | 'word_trap';

export const MCQ_STYLE_META: Record<
  McqStyle,
  { label: string; shortLabel: string; description: string }
> = {
  single_correct: {
    label: 'Single Correct (NEET)',
    shortLabel: 'Single Correct',
    description: 'Classic 4-option NCERT conceptual or factual MCQ',
  },
  assertion_reason: {
    label: 'Assertion & Reason',
    shortLabel: 'Assertion–Reason',
    description: 'Tests causal reasoning between two NCERT statements',
  },
  statement_pair: {
    label: 'Statement I & Statement II',
    shortLabel: 'Statement I / II',
    description: 'Modern NTA NEET dual-statement correctness format',
  },
  word_trap: {
    label: 'NCERT Word-Trap',
    shortLabel: 'Word-Trap',
    description: 'Targets subtle qualifiers (only, almost all, except, always)',
  },
};

export interface NcertLine {
  id: string;
  lineNumber: number;
  text: string;
  pdfPage: number;
  ncertPage: number;
  clozeTerms: string[];
  isHighYield?: boolean;
}

export interface DiagramInfoPoint {
  id?: string;
  category: 'label' | 'fact' | 'inference';
  title: string;
  detail: string;
  isCustom?: boolean;
}

export interface ChapterDiagram {
  id: string;
  figureNumber: string;
  caption: string;
  imagePath: string;
  pdfPage: number;
  ncertPage: number;
  sectionId: string;
  infoList: DiagramInfoPoint[];
}

export interface NcertTableBlock {
  type: 'table';
  id: string;
  tableNumber: string;
  title: string;
  headers: string[];
  rows: string[][];
  footnote?: string;
  pdfPage: number;
  ncertPage: number;
}

export interface EquationBlock {
  type: 'equation';
  id: string;
  label?: string;
  equation: string;
  subtext?: string;
  pdfPage: number;
  ncertPage: number;
}

export interface ParagraphBlock {
  type: 'paragraph';
  id: string;
  style?: 'normal' | 'bullet-list' | 'numbered-list' | 'summary' | 'exercise';
  lines: NcertLine[];
}

export interface CalloutBlock {
  type: 'callout';
  id: string;
  title: string;
  badge?: string;
  lines: NcertLine[];
  pdfPage: number;
  ncertPage: number;
}

export interface DiagramAnchorBlock {
  type: 'diagram';
  diagramId: string;
}

export type ContentBlock =
  | ParagraphBlock
  | DiagramAnchorBlock
  | NcertTableBlock
  | EquationBlock
  | CalloutBlock;

export interface ChapterSection {
  id: string;
  number: string;
  title: string;
  level: 1 | 2 | 3;
  blocks: ContentBlock[];
}

export type VaultCategoryKey =
  | 'scientists_years'
  | 'numbers_dimensions'
  | 'examples_exceptions'
  | 'equations_tables'
  | 'word_traps';

export const VAULT_CATEGORY_META: Record<
  VaultCategoryKey,
  { label: string; shortLabel: string; description: string }
> = {
  scientists_years: {
    label: 'Scientists & Years',
    shortLabel: 'Scientists',
    description: 'Discoveries, landmark dates, and contributions cited in NCERT',
  },
  numbers_dimensions: {
    label: 'Numbers & Dimensions',
    shortLabel: 'Numbers',
    description: 'Exact sizes, percentages, molecular weights, timings, and counts',
  },
  examples_exceptions: {
    label: 'Examples & Exceptions',
    shortLabel: 'Examples',
    description: 'Organisms, molecules, and NCERT exception cases tested in NEET',
  },
  equations_tables: {
    label: 'Equations, Pathways & Tables',
    shortLabel: 'Equations & Tables',
    description: 'Reaction schemes, formula ratios, and high-yield table facts',
  },
  word_traps: {
    label: 'NCERT Word Traps',
    shortLabel: 'Word Traps',
    description: 'Subtle NCERT phrasing & boundary distinctions prone to careless errors',
  },
};

export interface VaultItem {
  id: string;
  category: VaultCategoryKey;
  prompt: string;
  detail: string;
  sourceLineId?: string;
  ncertPage?: number;
  isCustom?: boolean;
}

export interface ChapterData {
  id: string;
  chapterNumber: number;
  unitTitle: string;
  className: string;
  title: string;
  pdfFile: string;
  pdfPageCount: number;
  ncertPageRange: [number, number];
  edition: string;
  sections: ChapterSection[];
  diagrams: ChapterDiagram[];
  vault: VaultItem[];
}

export interface CustomUserLine {
  id: string;
  chapterId: string;
  parentLineId: string;
  text: string;
  tags: NoteTag[];
  clozeTerms: string[];
  status: MasteryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserNote {
  id: string;
  chapterId: string;
  targetId: string;
  targetType: 'line' | 'diagram';
  content: string;
  tags: NoteTag[];
  source: 'user' | 'gemini';
  modelUsed?: string;
  status: MasteryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedMcqDraft {
  style: McqStyle;
  question: string;
  assertion?: string;
  reason?: string;
  statement1?: string;
  statement2?: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  ncertProof: string;
}

export interface SavedMcq extends GeneratedMcqDraft {
  id: string;
  chapterId: string;
  targetId: string;
  targetType: 'line' | 'diagram';
  modelUsed?: string;
  status: MasteryStatus;
  attempts: number;
  correctAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  createdAt: string;
}

export interface StudyState {
  version: number;
  updatedAt: string;
  lineMastery: Record<string, MasteryStatus>;
  lineHighlights: Record<string, LineHighlightTier>;
  dismissedHighYieldIds: string[];
  customLines: Record<string, CustomUserLine[]>;
  lineNotes: Record<string, UserNote[]>;
  pinnedMcqs: Record<string, SavedMcq[]>;
  diagramMastery: Record<string, MasteryStatus>;
  diagramExtraInfo: Record<string, DiagramInfoPoint[]>;
  vaultMastery: Record<string, MasteryStatus>;
  customVaultItems: Record<string, VaultItem[]>;
  editedVaultItems: Record<string, Partial<VaultItem>>;
  deletedVaultIds: string[];
  aiThreads: Record<string, ChatMessage[]>;
}

export interface LocalAppConfig {
  apiKey: string;
  selectedModel: GeminiModelId;
  customModelId: string;
  useCustomModel: boolean;
  readerFont: 'serif' | 'sans';
  fontSize: 'compact' | 'comfortable' | 'large';
  clozeMode: boolean;
  clozeScope: ClozeScope;
  showPresetHighYield: boolean;
  showOnlyUnmastered: boolean;
  showPdfDarkFilter: boolean;
}

export type ActiveWorkspaceMode = 'read' | 'diagrams' | 'vault' | 'revise';
export type InspectorTab = 'ask' | 'mcq' | 'pdf';

export interface ActiveSelection {
  type: 'line' | 'diagram';
  chapterId: string;
  id: string;
}

export interface InventoryEntry {
  chapterId: string;
  chapterNumber: number;
  title: string;
  unitTitle: string;
  pdfFile: string;
  sha256: string;
  pageCount: number;
  ncertPageRange: [number, number];
  dataFile: string;
  diagramCount: number;
  lineCount: number;
  vaultCount: number;
  generatedAt: string;
}

export interface ChapterInventory {
  schemaVersion: number;
  updatedAt: string;
  chapters: InventoryEntry[];
}
