import type { ChatMessage } from '../types/study';

/**
 * Copies plain text to the system clipboard with an execCommand fallback for non-secure contexts.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy textarea fallback
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Formats a paired user query + Gemini answer for clean clipboard pasting into notes/docs.
 */
export function formatQaPairForCopy(question: string, answer: string): string {
  return `**Q:** ${question.trim()}\n\n**A:** ${answer.trim()}`;
}

/**
 * Formats an entire Ask Gemini thread anchored to a specific NCERT line or diagram.
 */
export function formatThreadForCopy(targetTitle: string, messages: ChatMessage[]): string {
  const header = `### ${targetTitle.trim()}`;
  const body = messages
    .map((msg) => {
      const label = msg.role === 'user' ? '**Q:**' : '**A:**';
      return `${label} ${msg.content.trim()}`;
    })
    .join('\n\n---\n\n');

  return body ? `${header}\n\n${body}` : header;
}
