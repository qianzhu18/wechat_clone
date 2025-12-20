import { create } from 'zustand';
import { AppState, MessageItem } from './types';

// Default initial state
const DEFAULT_CONFIG = {
  time: '14:30',
  battery: 95,
  signal: 'wifi' as const,
  chatTitle: '文件传输助手',
  navBadge: '',
  rightRoleLabel: '商家',
  leftRoleLabel: '客户',
  isPrivacyMode: false,
  showFooter: false,
  // 使用内联 SVG，避免跨域图片导致导出失败
  footerQrCodeUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23f4f4f5"/><path d="M10 10h60v60H10zM130 10h60v60h-60zM10 130h60v60H10zM70 70h60v60H70zM130 130h60v60h-60z" fill="%23181818"/></svg>',
  footerText: '长按识别二维码',
  myAvatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="12" fill="%2395ec69"/><circle cx="50" cy="38" r="18" fill="%230a0a0a" opacity="0.12"/><rect x="25" y="62" width="50" height="22" rx="11" fill="%230a0a0a" opacity="0.12"/></svg>',
  otherAvatar: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23e5e7eb"/><circle cx="50" cy="38" r="18" fill="%230a0a0a" opacity="0.18"/><rect x="25" y="62" width="50" height="22" rx="11" fill="%230a0a0a" opacity="0.18"/></svg>',
};

const DEFAULT_MESSAGES: MessageItem[] = [
  { id: '1', role: 'me', type: 'system_time', content: '14:20' }, // Role ignored for system_time
  { id: '2', role: 'other', type: 'text', content: '亲，这款面膜现在的活动价是多少呀？' },
  { id: '3', role: 'me', type: 'text', content: '宝宝，现在活动价是 198 两盒哦，超级划算！' },
];

export const useStore = create<AppState>((set) => ({
  config: DEFAULT_CONFIG,
  messages: DEFAULT_MESSAGES,

  setConfig: (updates) => set((state) => ({ 
    config: { ...state.config, ...updates } 
  })),

  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),

  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((msg) => 
      msg.id === id ? { ...msg, ...updates } : msg
    )
  })),

  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter((msg) => msg.id !== id)
  })),

  setMessages: (msgs) => set({ messages: msgs }),

  togglePrivacy: () => set((state) => ({
    config: { ...state.config, isPrivacyMode: !state.config.isPrivacyMode }
  })),

  moveMessage: (id, direction) => set((state) => {
    const index = state.messages.findIndex(m => m.id === id);
    if (index === -1) return {};
    
    const newMessages = [...state.messages];
    if (direction === 'up' && index > 0) {
      [newMessages[index - 1], newMessages[index]] = [newMessages[index], newMessages[index - 1]];
    } else if (direction === 'down' && index < newMessages.length - 1) {
      [newMessages[index], newMessages[index + 1]] = [newMessages[index + 1], newMessages[index]];
    }
    
    return { messages: newMessages };
  }),
}));
