import { MessageItem, MessageRole } from '../types';

interface GenerateScriptOptions {
  meRoleName?: string;
  otherRoleName?: string;
}

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

const buildSystemInstruction = (meRoleName: string, otherRoleName: string) => `
你是微信对话脚本生成助手，必须输出可直接解析的 JSON 数组，每个元素形如 {"role":"me"|"other","content":"..."}。
严格的身份与左右映射：
- "me" = 右侧气泡 = 「${meRoleName}」
- "other" = 左侧气泡 = 「${otherRoleName}」
约束：
1) 第一句必须是 role "other"（左侧）开场，随后尽量轮流。
2) 只写对话正文，不要在 content 里加「${meRoleName}:」等前缀、不要系统时间、不要 Markdown/代码块。
示例：
[
  {"role":"other","content":"${otherRoleName}开场提问"},
  {"role":"me","content":"${meRoleName}回应"}
]
`;

const stripCodeFence = (text: string) => {
  if (!text) return text;
  const fenceMatch = text.match(/```(?:json)?\\n([\\s\\S]*?)\\n```/);
  return fenceMatch ? fenceMatch[1] : text;
};

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const cleanSpeakerPrefix = (content: string, meRoleName: string, otherRoleName: string) => {
  if (!content) return '';
  const names = [meRoleName, otherRoleName].filter(Boolean).map(escapeRegExp).join('|');
  if (!names) return content;
  return content.replace(new RegExp(`^\\s*(?:${names})[：:]\\s*`, 'u'), '').trim();
};

export const generateScript = async (prompt: string, count: number, options: GenerateScriptOptions = {}): Promise<MessageItem[]> => {
  if (!API_KEY) {
    throw new Error('AI API Key is missing. Set VITE_AI_API_KEY or API_KEY.');
  }

  const meRoleName = (options.meRoleName || '商家').trim();
  const otherRoleName = (options.otherRoleName || '客户').trim();

  const userPrompt = `场景：${prompt}。生成大约 ${count} 轮往来，首句必须由「${otherRoleName}」(role=other, 左侧) 开场，随后双方自然轮流，确保「${meRoleName}」始终 role=me (右侧)。不要系统时间，不要 Markdown，仅返回 JSON 数组（键只包含 role, content）。`;

  const response = await fetch(`${API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemInstruction(meRoleName, otherRoleName) },
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
    const normalized: MessageItem[] = [];

    const resolveRole = (item: any): MessageRole => {
      const rawRole = (item?.role || '').toString().toLowerCase();
      const roleHints: Record<string, MessageRole> = {
        me: 'me',
        self: 'me',
        right: 'me',
        seller: 'me',
        merchant: 'me',
        assistant: 'me',
        ai: 'me',
        other: 'other',
        left: 'other',
        buyer: 'other',
        customer: 'other',
        user: 'other',
        client: 'other'
      };
      if (roleHints[rawRole]) return roleHints[rawRole];

      const speaker = (item?.speaker || item?.name || '').toString().trim();
      if (speaker) {
        if (speaker.includes(meRoleName)) return 'me';
        if (speaker.includes(otherRoleName)) return 'other';
      }

      const side = (item?.side || item?.position || '').toString().toLowerCase();
      if (side === 'right') return 'me';
      if (side === 'left') return 'other';

      const rawContent = (item?.content || '') as string;
      if (typeof rawContent === 'string') {
        if (rawContent.startsWith(`${meRoleName}:`) || rawContent.startsWith(`${meRoleName}：`)) return 'me';
        if (rawContent.startsWith(`${otherRoleName}:`) || rawContent.startsWith(`${otherRoleName}：`)) return 'other';
      }

      if (!normalized.length) return 'other';
      return normalized[normalized.length - 1].role === 'me' ? 'other' : 'me';
    };

    const pushItem = (item: any) => {
      const role = resolveRole(item);
      const rawContent = typeof item === 'string' ? item : item?.content ?? '';
      const cleanedContent = cleanSpeakerPrefix(
        typeof rawContent === 'string' ? rawContent : String(rawContent || ''),
        meRoleName,
        otherRoleName
      );

      normalized.push({
        id: crypto.randomUUID(),
        role,
        type: 'text',
        content: cleanedContent,
      });
    };

    if (Array.isArray(parsed)) {
      parsed.forEach(pushItem);
    } else if (parsed && Array.isArray(parsed.messages)) {
      parsed.messages.forEach(pushItem);
    } else if (parsed && typeof parsed === 'object' && parsed.content) {
      pushItem(parsed);
    } else if (typeof parsed === 'string') {
      pushItem({ role: 'other', content: parsed });
    } else {
      throw new Error('AI response format not recognized.');
    }

    const isAlternating = normalized.every((msg, idx) => idx === 0 || msg.role !== normalized[idx - 1].role);
    if (isAlternating && normalized[0]?.role === 'me') {
      // 整段反了，翻转左右
      return normalized.map((msg) => ({ ...msg, role: msg.role === 'me' ? 'other' : 'me' }));
    }

    if (normalized[0] && normalized[0].role !== 'other') {
      normalized[0] = { ...normalized[0], role: 'other' };
    }

    return normalized;
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
