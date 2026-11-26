import type { ChapterData } from '../../types/study';
import { chapter08 } from './ch08-cell-unit-of-life';
import { chapter09 } from './ch09-biomolecules';
import { chapter10 } from './ch10-cell-cycle-division';

export const CHAPTERS: ChapterData[] = [chapter08, chapter09, chapter10];

export function getChapterById(chapterId: string): ChapterData {
  return CHAPTERS.find((c) => c.id === chapterId) ?? CHAPTERS[0];
}
