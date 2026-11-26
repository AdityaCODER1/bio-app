import type {
  CalloutBlock,
  ChapterData,
  ChapterSection,
  NcertLine,
  ParagraphBlock,
} from '../../types/study';

export interface RawLineInput {
  id?: string;
  text: string;
  pdfPage: number;
  ncertPage: number;
  clozeTerms?: string[];
  isHighYield?: boolean;
}

export class ChapterLineBuilder {
  private counter = 0;
  private readonly chapterId: string;

  constructor(chapterId: string) {
    this.chapterId = chapterId;
  }

  paragraph(
    blockId: string,
    rawLines: RawLineInput[],
    style: ParagraphBlock['style'] = 'normal',
  ): ParagraphBlock {
    const lines: NcertLine[] = rawLines.map((item, idx) => {
      this.counter += 1;
      return {
        id: item.id ?? `${this.chapterId}-${blockId}-l${idx + 1}`,
        lineNumber: this.counter,
        text: item.text,
        pdfPage: item.pdfPage,
        ncertPage: item.ncertPage,
        clozeTerms: item.clozeTerms ?? [],
        isHighYield: item.isHighYield,
      };
    });
    return {
      type: 'paragraph',
      id: `${this.chapterId}-${blockId}`,
      style,
      lines,
    };
  }

  callout(
    blockId: string,
    title: string,
    rawLines: RawLineInput[],
    pdfPage: number,
    ncertPage: number,
    badge?: string,
  ): CalloutBlock {
    const lines: NcertLine[] = rawLines.map((item, idx) => {
      this.counter += 1;
      return {
        id: item.id ?? `${this.chapterId}-${blockId}-l${idx + 1}`,
        lineNumber: this.counter,
        text: item.text,
        pdfPage: item.pdfPage,
        ncertPage: item.ncertPage,
        clozeTerms: item.clozeTerms ?? [],
        isHighYield: item.isHighYield,
      };
    });
    return {
      type: 'callout',
      id: `${this.chapterId}-${blockId}`,
      title,
      badge,
      lines,
      pdfPage,
      ncertPage,
    };
  }

  get totalLines(): number {
    return this.counter;
  }
}

export function countChapterLines(sections: ChapterSection[]): number {
  let count = 0;
  for (const s of sections) {
    for (const b of s.blocks) {
      if (b.type === 'paragraph' || b.type === 'callout') {
        count += b.lines.length;
      }
    }
  }
  return count;
}

export type ChapterRegistryItem = ChapterData;
