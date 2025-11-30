import { MessageItem } from '../types';

/**
 * AI 接口：参考“参考 API 调研.md”中的调用方式，走 baseUrl/chat/completions
 * 默认读取环境变量：
 *  - VITE_AI_BASE_URL（或 process.env.VITE_AI_BASE_URL）默认 https://api.siliconflow.cn/v1
 *  - VITE_AI_API_KEY（或 process.env.VITE_AI_API_KEY / API_KEY）
 *  - VITE_AI_MODEL（可选，默认 moonshotai/Kimi-K2-Instruct-0905）
 */
const API_BASE_URL =
  (import.meta as any).env?.VITE_AI_BASE_URL ||
  (typeof process !== 'undefined' ? (process.env.VITE_AI_BASE_URL || process.env.API_BASE_URL) : '') ||
  'https://api.siliconflow.cn/v1';

const API_KEY =
  (import.meta as any).env?.VITE_AI_API_KEY ||
  (typeof process !== 'undefined' ? (process.env.VITE_AI_API_KEY || process.env.API_KEY) : '') ||
  '';

const MODEL =
  (import.meta as any).env?.VITE_AI_MODEL ||
  (typeof process !== 'undefined' ? process.env.VITE_AI_MODEL : '') ||
  'moonshotai/Kimi-K2-Instruct-0905';

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
      temperature: 0.7
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

  // 尝试 JSON 解析，兼容多种返回结构
  const normalizeMessages = (parsed: any): MessageItem[] => {
    // 如果是数组
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        id: crypto.randomUUID(),
        role: item.role === 'other' ? 'other' : 'me',
        type: 'text',
        content: item.content || '',
      }));
    }
    // 如果是对象且包含 messages 数组
    if (parsed && Array.isArray(parsed.messages)) {
      return parsed.messages.map((item: any) => ({
        id: crypto.randomUUID(),
        role: item.role === 'other' ? 'other' : 'me',
        type: 'text',
        content: item.content || '',
      }));
    }
    // 如果是对象且有 role/content，视为单条
    if (parsed && typeof parsed === 'object' && parsed.content) {
      return [
        {
          id: crypto.randomUUID(),
          role: parsed.role === 'other' ? 'other' : 'me',
          type: 'text',
          content: parsed.content,
        },
      ];
    }
    // 如果是字符串，视为单条消息内容
    if (typeof parsed === 'string') {
      return [
        {
          id: crypto.randomUUID(),
          role: 'other',
          type: 'text',
          content: parsed,
        },
      ];
    }
    throw new Error('AI response format not recognized.');
  };

  try {
    const parsed = JSON.parse(cleaned);
    return normalizeMessages(parsed);
  } catch (e) {
    // 如果不是有效 JSON，直接作为单条文本
    console.warn('AI response JSON parse failed, fallback to raw text:', cleaned);
    return [
      {
        id: crypto.randomUUID(),
        role: 'other',
        type: 'text',
        content: cleaned,
      },
    ];
  }
};
