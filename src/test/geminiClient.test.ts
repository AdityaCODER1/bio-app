import { describe, expect, it } from 'vitest';
import {
  buildGenerationConfig,
  isGemini4Model,
  MCQ_RESPONSE_SCHEMA,
} from '../services/geminiClient';
import { GEMINI_MODEL_PRESETS } from '../types/study';

describe('geminiClient model-aware configuration', () => {
  it('exposes all requested Gemini model presets', () => {
    const ids = GEMINI_MODEL_PRESETS.map((m) => m.id);
    expect(ids).toContain('gemini-3.1-flash-lite');
    expect(ids).toContain('gemini-3.5-flash-lite');
    expect(ids).toContain('gemini-3.5-flash');
    expect(ids).toContain('gemini-3.8-flash');
    expect(ids).toContain('gemini-4-hydrogen');
  });

  it('omits temperature and sets safe thinkingLevel for gemini-4-hydrogen', () => {
    expect(isGemini4Model('gemini-4-hydrogen')).toBe(true);
    const cfg = buildGenerationConfig('gemini-4-hydrogen', {
      systemInstruction: 'Test system prompt',
      temperature: 0.4,
      jsonSchema: MCQ_RESPONSE_SCHEMA,
    });

    expect(cfg).not.toHaveProperty('temperature');
    expect(cfg.responseMimeType).toBe('application/json');
    expect(cfg.responseSchema).toBe(MCQ_RESPONSE_SCHEMA);
    expect(cfg.thinkingConfig).toEqual({ thinkingLevel: 'medium' });
  });

  it('keeps temperature for gemini-3.1-flash-lite and gemini-3.8-flash', () => {
    const cfg31 = buildGenerationConfig('gemini-3.1-flash-lite', {
      systemInstruction: 'Tutor',
      temperature: 0.35,
    });
    expect(cfg31.temperature).toBe(0.35);
    expect(cfg31).not.toHaveProperty('thinkingConfig');

    const cfg38 = buildGenerationConfig('gemini-3.8-flash', {
      systemInstruction: 'Tutor',
      temperature: 0.3,
    });
    expect(cfg38.temperature).toBe(0.3);
  });
});
