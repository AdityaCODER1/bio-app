import { GoogleGenAI, Type } from '@google/genai';
import {
  GEMINI_MODEL_PRESETS,
  MCQ_STYLE_META,
  type ChatMessage,
  type GeneratedMcqDraft,
  type GeminiModelId,
  type McqStyle,
} from '../types/study';

export interface LineContextPayload {
  chapterTitle: string;
  sectionTitle: string;
  ncertPage: number;
  lineNumber?: number;
  targetText: string;
  surroundingText: string;
  userNotes?: string[];
  isDiagram?: boolean;
  diagramFigureNumber?: string;
}

export function isGemini4Model(modelId: string): boolean {
  return modelId.trim().toLowerCase().startsWith('gemini-4');
}

export function resolveModelPreset(modelId: string) {
  return GEMINI_MODEL_PRESETS.find((preset) => preset.id === modelId);
}

/**
 * Builds a model-safe config payload for Google GenAI SDK.
 * Per Gemini 4 API docs, gemini-4-* models reject temperature/topP/topK and 'minimal' thinkingLevel.
 */
export function buildGenerationConfig(
  modelId: GeminiModelId,
  options: {
    systemInstruction: string;
    jsonSchema?: Record<string, unknown>;
    temperature?: number;
    maxOutputTokens?: number;
  },
): Record<string, unknown> {
  const isG4 = isGemini4Model(modelId);
  const preset = resolveModelPreset(modelId);

  const config: Record<string, unknown> = {
    systemInstruction: options.systemInstruction,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
  };

  if (options.jsonSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = options.jsonSchema;
  }

  if (!isG4 && (preset?.supportsSamplingParams ?? true) && options.temperature !== undefined) {
    config.temperature = options.temperature;
  }

  // Only pass safe thinkingLevel when supported
  if (isG4) {
    config.thinkingConfig = { thinkingLevel: 'medium' };
  }

  return config;
}

const TUTOR_SYSTEM_PROMPT = `You are an elite NCERT Biology & NEET-UG mentor inside a line-by-line desktop study app.
Your primary rule is strict NCERT fidelity:
1. Clearly separate **Verbatim NCERT Fact** from **Conceptual Clarity / Deeper Mechanism** so the student never confuses outside knowledge with exact NCERT wording.
2. Call out high-yield NEET traps (words like "only", "almost all", "except", "most", "typically", singular/plural or prokaryotic/eukaryotic boundaries).
3. Keep answers crisp, structured with clean bullet points, and directly anchored to the selected line or diagram.
4. When the student asks for a mnemonic or memory hook, make it short and vivid.`;

const MCQ_SYSTEM_PROMPT = `You are a strict NTA NEET-UG Biology question setter creating precision MCQs directly from a specific NCERT Biology line or diagram.
Rules:
- Every factual claim in the correct answer and explanation MUST strictly match NCERT Biology wording.
- Make distractors biologically plausible (common student confusions, swapped terms, reversed qualifiers) — never absurd or obvious.
- Provide exact 4 options.
- Include 'ncertProof' quoting or citing the exact NCERT anchor fact.
- Match the requested MCQ style strictly:
  * single_correct: standard 4-option question; leave assertion/reason/statement1/statement2 empty strings.
  * assertion_reason: populate 'assertion' and 'reason' clearly; options MUST follow the 4 standard NEET Assertion-Reason choices.
  * statement_pair: populate 'statement1' and 'statement2'; options MUST be:
      (A) Both Statement I and Statement II are correct
      (B) Both Statement I and Statement II are incorrect
      (C) Statement I is correct but Statement II is incorrect
      (D) Statement I is incorrect but Statement II is correct
  * word_trap: craft a tricky question focusing on exact NCERT qualifiers, exceptions, numbers, or subtle wording in the target line.`;

export const MCQ_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mcqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          assertion: { type: Type.STRING },
          reason: { type: Type.STRING },
          statement1: { type: Type.STRING },
          statement2: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          ncertProof: { type: Type.STRING },
        },
        required: ['question', 'options', 'correctIndex', 'explanation', 'ncertProof'],
      },
    },
  },
  required: ['mcqs'],
};

function formatContextBlock(ctx: LineContextPayload): string {
  const header = ctx.isDiagram
    ? `Target NCERT Diagram: ${ctx.diagramFigureNumber} (NCERT Page ${ctx.ncertPage})`
    : `Target NCERT Line #${ctx.lineNumber ?? '-'} (NCERT Page ${ctx.ncertPage})`;

  const notesSection =
    ctx.userNotes && ctx.userNotes.length > 0
      ? `\nStudent's existing notes on this item:\n${ctx.userNotes.map((n) => `- ${n}`).join('\n')}`
      : '';

  return [
    `Chapter: ${ctx.chapterTitle}`,
    `Section: ${ctx.sectionTitle}`,
    header,
    `Exact Target Content: "${ctx.targetText}"`,
    `Surrounding Paragraph / Diagram Context:\n${ctx.surroundingText}`,
    notesSection,
  ]
    .filter(Boolean)
    .join('\n');
}

function getClient(apiKey: string): GoogleGenAI {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error('Add your Gemini API key in Settings (⌘,) to query Gemini.');
  }
  return new GoogleGenAI({ apiKey: trimmed });
}

export async function askGeminiAboutTarget(params: {
  apiKey: string;
  modelId: GeminiModelId;
  context: LineContextPayload;
  history: ChatMessage[];
  question: string;
}): Promise<string> {
  const ai = getClient(params.apiKey);
  const contextText = formatContextBlock(params.context);

  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `Study Context:\n${contextText}\n\nKeep all answers anchored to this exact NCERT target unless asked to compare across chapters.`,
        },
      ],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'Understood. I have the exact NCERT target and surrounding context loaded. Ask me anything about this line.',
        },
      ],
    },
    ...params.history.slice(-8).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: params.question }],
    },
  ];

  const config = buildGenerationConfig(params.modelId, {
    systemInstruction: TUTOR_SYSTEM_PROMPT,
    temperature: 0.35,
    maxOutputTokens: 2048,
  });

  const response = await ai.models.generateContent({
    model: params.modelId,
    contents,
    config,
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error(`Model ${params.modelId} returned an empty response.`);
  }
  return text;
}

export async function generateLineMcqs(params: {
  apiKey: string;
  modelId: GeminiModelId;
  context: LineContextPayload;
  style: McqStyle;
  count: number;
  customFocus?: string;
}): Promise<GeneratedMcqDraft[]> {
  const ai = getClient(params.apiKey);
  const styleInfo = MCQ_STYLE_META[params.style];
  const safeCount = Math.min(Math.max(params.count, 1), 4);

  const prompt = [
    formatContextBlock(params.context),
    '',
    `Generate exactly ${safeCount} high-yield NEET Biology MCQ(s) strictly grounded in the target NCERT line/diagram above.`,
    `Requested Style: ${params.style} (${styleInfo.label} — ${styleInfo.description}).`,
    params.customFocus?.trim()
      ? `Extra student focus requirement: ${params.customFocus.trim()}`
      : '',
    'Ensure options array has EXACTLY 4 strings and correctIndex is 0, 1, 2, or 3.',
  ]
    .filter(Boolean)
    .join('\n');

  const config = buildGenerationConfig(params.modelId, {
    systemInstruction: MCQ_SYSTEM_PROMPT,
    jsonSchema: MCQ_RESPONSE_SCHEMA,
    temperature: 0.4,
    maxOutputTokens: 3072,
  });

  const response = await ai.models.generateContent({
    model: params.modelId,
    contents: prompt,
    config,
  });

  const rawText = response.text?.trim();
  if (!rawText) {
    throw new Error(`Model ${params.modelId} did not return MCQ JSON.`);
  }

  let parsed: { mcqs?: Array<Partial<GeneratedMcqDraft> & { options?: string[] }> };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    parsed = JSON.parse(cleaned);
  }

  if (!Array.isArray(parsed.mcqs) || parsed.mcqs.length === 0) {
    throw new Error('Could not parse generated MCQs from Gemini response.');
  }

  return parsed.mcqs.map((item) => {
    const rawOptions = Array.isArray(item.options) ? item.options.slice(0, 4) : [];
    while (rawOptions.length < 4) {
      rawOptions.push('None of the above');
    }
    const idx =
      typeof item.correctIndex === 'number' && item.correctIndex >= 0 && item.correctIndex <= 3
        ? item.correctIndex
        : 0;

    return {
      style: params.style,
      question: (item.question || 'Select the most accurate NCERT option:').trim(),
      assertion: item.assertion?.trim() || undefined,
      reason: item.reason?.trim() || undefined,
      statement1: item.statement1?.trim() || undefined,
      statement2: item.statement2?.trim() || undefined,
      options: [rawOptions[0], rawOptions[1], rawOptions[2], rawOptions[3]],
      correctIndex: idx,
      explanation: (item.explanation || 'Refer to the verbatim NCERT sentence.').trim(),
      ncertProof: (item.ncertProof || params.context.targetText).trim(),
    };
  });
}

export async function testGeminiConnection(
  apiKey: string,
  modelId: GeminiModelId,
): Promise<{ ok: boolean; latencyMs: number; reply: string }> {
  const ai = getClient(apiKey);
  const start = performance.now();
  const config = buildGenerationConfig(modelId, {
    systemInstruction: 'Reply concisely in under 8 words.',
    maxOutputTokens: 64,
  });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: 'Confirm readiness for NCERT Biology tutoring.',
    config,
  });

  return {
    ok: true,
    latencyMs: Math.round(performance.now() - start),
    reply: response.text?.trim() || 'Connected.',
  };
}
