import { MessageItem } from '../types';

/**
 * AI 接口：参考“参考 API 调研.md”中的调用方式，走 baseUrl/chat/completions
 * 默认读取环境变量：
 *  - VITE_AI_BASE_URL（或 process.env.VITE_AI_BASE_URL）默认 https://www.qiangtu.com/v1
 *  - VITE_AI_API_KEY（或 process.env.VITE_AI_API_KEY / API_KEY）
 */
const API_BASE_URL =
  (import.meta as any).env?.VITE_AI_BASE_URL ||
  (typeof process !== 'undefined' ? (process.env.VITE_AI_BASE_URL || process.env.API_BASE_URL) : '') ||
  'https://www.qiangtu.com/v1';

const API_KEY =
  (import.meta as any).env?.VITE_AI_API_KEY ||
  (typeof process !== 'undefined' ? (process.env.VITE_AI_API_KEY || process.env.API_KEY) : '') ||
  '';

const MODEL = 'gpt-4o-mini';

const systemInstruction = `
You are a WeChat conversation generator.
Rules:
1) Language: Simplified Chinese with full-width punctuation（，。？！）.
2) Roles: only "me" (right bubble) and "other" (left bubble).
3) Tone: casual, friendly, supports emojis.
4) Output strictly JSON array, no code fences, no markdown.
   Example: [{"role":"me","content":"你好"}, {"role":"other","content":"在的"}]
5) Do NOT include system time messages.
`;

const stripCodeFence = (text: string) => {
  if (!text) return text;
  const fenceMatch = text.match(/```(?:json)?\\n([\\s\\S]*?)\\n```/);
  return fenceMatch ? fenceMatch[1] : text;
};

export const generateScript = async (prompt: string, count: number): Promise<MessageItem[]> => {
  if (!API_KEY) {
    throw new Error('AI API Key is missing. Set VITE_AI_API_KEY or API_KEY.');
  }

  const userPrompt = `Scenario: ${prompt}. Generate about ${count} turns as JSON array with role+content. Only return JSON array.`;

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const rawContent =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    '';

  const cleaned = stripCodeFence((rawContent || '').trim());
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
    // Some APIs wrap with {messages:[...]}
    if (parsed && Array.isArray(parsed.messages)) {
      parsed = parsed.messages;
    }
  } catch (e) {
    console.error('AI response JSON parse failed, raw content:', cleaned);
    throw new Error('AI response is not valid JSON.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('AI response JSON is not an array.');
  }

  return parsed.map((item: any) => ({
    id: crypto.randomUUID(),
    role: item.role === 'other' ? 'other' : 'me',
    type: 'text',
    content: item.content || '',
  }));
};
