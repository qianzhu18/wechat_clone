import { create } from 'zustand';
import { AppState, MessageItem } from './types';

// Default initial state
const DEFAULT_CONFIG = {
  time: '14:30',
  battery: 95,
  signal: 'wifi' as const,
  chatTitle: '文件传输助手',
  isPrivacyMode: false,
  showFooter: false,
  footerQrCodeUrl: 'https://picsum.photos/200/200',
  footerText: '长按识别二维码',
  myAvatar: 'https://picsum.photos/100/100?random=1',
  otherAvatar: 'https://picsum.photos/100/100?random=2',
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