import type { ChapterData } from '../../types/study';
import { chapter08 } from './ch08-cell-unit-of-life';
import { chapter09 } from './ch09-biomolecules';
import { chapter10 } from './ch10-cell-cycle-division';
import { chapter11 } from './ch11-photosynthesis';
import { chapter12 } from './ch12-respiration-in-plants';
import { chapter13 } from './ch13-plant-growth-development';

export const CHAPTERS: ChapterData[] = [
  chapter08,
  chapter09,
  chapter10,
  chapter11,
  chapter12,
  chapter13,
];

export function getChapterById(chapterId: string): ChapterData {
  return CHAPTERS.find((c) => c.id === chapterId) ?? CHAPTERS[0];
}
