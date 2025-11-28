export type MessageType = 'text' | 'image' | 'link_card' | 'system_time';
export type MessageRole = 'me' | 'other';

export interface MessageItem {
  id: string;
  type: MessageType;
  role: MessageRole; // meaningful only for text/image/link_card
  content: string; // text content or timestamp string or image base64
  
  // For Link Card
  linkData?: {
    title: string;
    desc: string;
    thumbUrl: string;
  };

  avatar?: string; // override default avatar
}

export interface GlobalConfig {
  // Top Bar
  time: string;
  battery: number;
  signal: 'wifi' | '5g' | '4g';
  chatTitle: string;
  bgImage?: string;
  
  // Settings
  isPrivacyMode: boolean;
  showFooter: boolean;
  
  // Marketing Footer
  footerQrCodeUrl: string;
  footerText: string;

  // Avatars
  myAvatar: string;
  otherAvatar: string;
}

export interface AppState {
  config: GlobalConfig;
  messages: MessageItem[];
  
  // Actions
  setConfig: (config: Partial<GlobalConfig>) => void;
  addMessage: (msg: MessageItem) => void;
  updateMessage: (id: string, updates: Partial<MessageItem>) => void;
  removeMessage: (id: string) => void;
  setMessages: (msgs: MessageItem[]) => void;
  togglePrivacy: () => void;
  moveMessage: (id: string, direction: 'up' | 'down') => void;
}