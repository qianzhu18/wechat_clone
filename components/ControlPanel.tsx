import React, { useState } from 'react';
import { useStore } from '../store';
import { generateScript } from '../services/geminiService';
import { fileToBase64, exportImage } from '../utils/imageUtils';
import { 
  Download, Wand2, Trash2, Image as ImageIcon, Camera,
  ArrowUp, ArrowDown, Settings, MessageSquare, AlertCircle, Link as LinkIcon, Clock
} from 'lucide-react';

interface ControlPanelProps {
  className?: string; // To handle mobile visibility
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ className }) => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<'script' | 'settings'>('script');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const newMessages = await generateScript(prompt, 6, {
        meRoleName: store.config.rightRoleLabel,
        otherRoleName: store.config.leftRoleLabel,
      });
      store.setMessages([...store.messages, ...newMessages]);
    } catch (err) {
      setError("生成失败，请重试");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportImage('preview-container', `wechat-mock-${Date.now()}.png`);
    } catch (e) {
      // Error handled in util
    }
  };

  const handleCleanExport = async () => {
    try {
      await exportImage('preview-container', `wechat-mock-clean-${Date.now()}.png`, {
        hideSelectors: ['.status-bar'],
      });
    } catch (e) {
      // Error handled in util
    }
  };

  const handleImageUpload = async (file: File, target: 'myAvatar' | 'otherAvatar' | 'footerQr' | 'msg' | 'linkThumb', msgId?: string) => {
    try {
      const base64 = await fileToBase64(file);
      if (target === 'myAvatar') store.setConfig({ myAvatar: base64 });
      else if (target === 'otherAvatar') store.setConfig({ otherAvatar: base64 });
      else if (target === 'footerQr') store.setConfig({ footerQrCodeUrl: base64 });
      else if (target === 'msg' && msgId) {
         store.updateMessage(msgId, { content: base64 }); // content holds image url for image type
      } else if (target === 'linkThumb' && msgId) {
         const msg = store.messages.find(m => m.id === msgId);
         if (msg && msg.linkData) {
            store.updateMessage(msgId, { linkData: { ...msg.linkData, thumbUrl: base64 }});
         }
      }
    } catch (e) {
      console.error("Image upload failed", e);
    }
  };

  const addNewMessage = (type: 'text' | 'system_time' | 'link_card' = 'text') => {
    store.addMessage({
      id: crypto.randomUUID(),
      role: 'me',
      type: type,
      content: type === 'system_time' ? '12:00' : (type === 'text' ? '新消息' : ''),
      linkData: type === 'link_card' ? { title: '标题', desc: '描述', thumbUrl: '' } : undefined
    });
  };

  return (
    <div className={`w-full md:w-[450px] bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
        <h1 className="font-bold text-xl text-gray-800 flex items-center gap-2">
          <MessageSquare className="text-wechat-green fill-current" />
          微信对话生成器
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCleanExport}
            className="bg-white border border-gray-200 hover:border-indigo-200 hover:text-indigo-700 px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors text-gray-700"
          >
            <Camera size={16} /> 纯净截图
          </button>
          <button 
            onClick={handleExport}
            className="bg-wechat-green hover:bg-[#85d65c] text-black px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download size={16} /> 导出图片
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button 
          onClick={() => setActiveTab('script')}
          className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'script' ? 'text-wechat-green border-b-2 border-wechat-green bg-green-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <MessageSquare size={16} /> 剧本编辑
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-wechat-green border-b-2 border-wechat-green bg-green-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Settings size={16} /> 全局设置
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* === SCRIPT EDITOR === */}
        {activeTab === 'script' && (
          <>
            {/* AI Generator */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
              <label className="block text-xs font-bold text-indigo-800 mb-2 uppercase tracking-wide">AI 自动生成</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入场景 (例如：微商催好评)"
                  className="flex-1 border border-indigo-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  onKeyDown={(e) => e.key === 'Enter' && handleAI()}
                />
                <button 
                  onClick={handleAI}
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center min-w-[40px]"
                >
                  {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Wand2 size={16} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-[11px] font-semibold text-indigo-900/80 block mb-1">右侧身份 (role=me)</label>
                  <input 
                    type="text"
                    value={store.config.rightRoleLabel}
                    onChange={(e) => store.setConfig({ rightRoleLabel: e.target.value })}
                    className="w-full text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="例如：商家/客服"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-indigo-900/80 block mb-1">左侧身份 (role=other)</label>
                  <input 
                    type="text"
                    value={store.config.leftRoleLabel}
                    onChange={(e) => store.setConfig({ leftRoleLabel: e.target.value })}
                    className="w-full text-sm border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="例如：客户/用户"
                  />
                </div>
              </div>
              <p className="text-[11px] text-indigo-800/80 mt-2">AI 会按上方身份自动映射左右气泡，避免把商家/客户说反。</p>
              {error && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
            </div>

            {/* Message List */}
            <div className="space-y-3 pb-20"> {/* pb for mobile safe area */}
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700 text-sm">对话列表</h3>
                <div className="flex gap-2">
                   <button onClick={() => addNewMessage('system_time')} className="text-xs text-gray-500 font-medium hover:bg-gray-100 px-2 py-1 rounded border flex items-center gap-1"><Clock size={12}/> 时间</button>
                   <button onClick={() => addNewMessage('text')} className="text-xs text-wechat-green font-bold hover:underline bg-green-50 px-2 py-1 rounded border border-green-200">+ 添加消息</button>
                </div>
              </div>
              
              <div className="space-y-2">
                {store.messages.map((msg, index) => (
                  <div key={msg.id} className="bg-white border border-gray-200 rounded-md p-3 shadow-sm hover:shadow-md transition-shadow group relative">
                     {/* Remove Button Absolute Top Right */}
                     <button 
                        onClick={() => store.removeMessage(msg.id)} 
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
                     >
                       <Trash2 size={14} />
                     </button>

                    <div className="flex items-start gap-3">
                      {/* Sort Controls */}
                      <div className="flex flex-col gap-1 mt-1 text-gray-300 shrink-0">
                         <button onClick={() => store.moveMessage(msg.id, 'up')} className="hover:text-gray-600 disabled:opacity-20" disabled={index === 0}><ArrowUp size={14} /></button>
                         <button onClick={() => store.moveMessage(msg.id, 'down')} className="hover:text-gray-600 disabled:opacity-20" disabled={index === store.messages.length - 1}><ArrowDown size={14} /></button>
                      </div>

                      <div className="flex-1 space-y-2 pr-6">
                         
                         {/* Header: Role/Type Selector */}
                         <div className="flex items-center gap-2">
                            {msg.type === 'system_time' ? (
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1"><Clock size={12}/> 系统时间</span>
                            ) : (
                                <select 
                                  value={msg.role} 
                                  onChange={(e) => store.updateMessage(msg.id, { role: e.target.value as any })}
                                  className={`text-xs font-bold border rounded px-1 py-0.5 ${msg.role === 'me' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                                >
                                  <option value="me">我</option>
                                  <option value="other">对方</option>
                                </select>
                            )}
                            
                            {/* Type Switcher */}
                            {msg.type !== 'system_time' && (
                                <select 
                                  value={msg.type}
                                  onChange={(e) => {
                                      const newType = e.target.value as any;
                                      const updates: any = { type: newType };
                                      if (newType === 'link_card' && !msg.linkData) {
                                          updates.linkData = { title: '标题', desc: '描述', thumbUrl: '' };
                                      }
                                      store.updateMessage(msg.id, updates);
                                  }}
                                  className="text-xs border-none bg-transparent text-gray-400 hover:text-gray-600 cursor-pointer focus:ring-0"
                                >
                                    <option value="text">文本</option>
                                    <option value="image">图片</option>
                                    <option value="link_card">卡片</option>
                                </select>
                            )}
                         </div>

                         {/* CONTENT EDITORS */}
                         
                         {/* 1. TEXT Editor */}
                         {(msg.type === 'text' || msg.type === 'system_time') && (
                           <textarea 
                             value={msg.content}
                             onChange={(e) => store.updateMessage(msg.id, { content: e.target.value })}
                             className={`w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:border-wechat-green ${msg.type === 'system_time' ? 'h-9 py-1.5' : 'min-h-[60px]'}`}
                             placeholder={msg.type === 'system_time' ? "时间 (如 14:00)" : "输入消息内容..."}
                           />
                         )}

                         {/* 2. IMAGE Editor */}
                         {msg.type === 'image' && (
                           <div className="w-full aspect-video bg-gray-50 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-gray-100 transition-colors">
                              {msg.content ? (
                                  <img src={msg.content} className="absolute inset-0 w-full h-full object-contain" alt="preview" />
                              ) : (
                                  <div className="text-gray-400 flex flex-col items-center">
                                      <ImageIcon size={20} />
                                      <span className="text-xs mt-1">上传图片</span>
                                  </div>
                              )}
                              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'msg', msg.id)} />
                           </div>
                         )}

                         {/* 3. LINK CARD Editor */}
                         {msg.type === 'link_card' && msg.linkData && (
                             <div className="space-y-2 bg-gray-50 p-2 rounded border border-gray-200">
                                 <input 
                                    type="text" 
                                    placeholder="标题"
                                    value={msg.linkData.title}
                                    onChange={(e) => store.updateMessage(msg.id, { linkData: { ...msg.linkData!, title: e.target.value } })}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                 />
                                 <input 
                                    type="text" 
                                    placeholder="描述"
                                    value={msg.linkData.desc}
                                    onChange={(e) => store.updateMessage(msg.id, { linkData: { ...msg.linkData!, desc: e.target.value } })}
                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                 />
                                 <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden shrink-0">
                                         {msg.linkData.thumbUrl && <img src={msg.linkData.thumbUrl} className="w-full h-full object-cover" alt="thumb" />}
                                     </div>
                                     <label className="text-xs text-blue-500 cursor-pointer hover:underline">
                                         上传缩略图
                                         <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'linkThumb', msg.id)} />
                                     </label>
                                 </div>
                             </div>
                         )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* === GLOBAL SETTINGS === */}
        {activeTab === 'settings' && (
          <div className="space-y-6 pb-20">
            
            {/* Status Bar Section */}
            <section className="space-y-3">
               <h3 className="font-bold text-gray-700 text-sm border-b pb-1">顶部状态栏</h3>
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-xs text-gray-500 block mb-1">时间</label>
                 <input 
                  type="text" 
                    value={store.config.time} 
                    onChange={(e) => store.setConfig({ time: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                   />
                 </div>
                 <div>
                   <label className="text-xs text-gray-500 block mb-1">电量 %</label>
                   <input 
                    type="number" 
                    value={store.config.battery} 
                    onChange={(e) => store.setConfig({ battery: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                   />
                 </div>
                 <div>
                   <label className="text-xs text-gray-500 block mb-1">信号</label>
                   <select 
                     value={store.config.signal}
                     onChange={(e) => store.setConfig({ signal: e.target.value as any })}
                     className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
                   >
                     <option value="wifi">WiFi</option>
                     <option value="4g">4G</option>
                     <option value="5g">5G</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs text-gray-500 block mb-1">聊天标题</label>
                 <input 
                   type="text" 
                   value={store.config.chatTitle} 
                   onChange={(e) => store.setConfig({ chatTitle: e.target.value })}
                   className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">左侧徽标</label>
                  <input 
                    type="text" 
                    value={store.config.navBadge || ''} 
                    onChange={(e) => store.setConfig({ navBadge: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                    placeholder="例如：6183 或留空"
                  />
                </div>
              </div>
            </section>

            {/* Avatars Section */}
            <section className="space-y-3">
               <h3 className="font-bold text-gray-700 text-sm border-b pb-1">头像设置</h3>
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs text-gray-500 block mb-1">我</label>
                   <div className="flex items-center gap-2">
                     <img src={store.config.myAvatar} className="w-10 h-10 rounded bg-gray-200 object-cover" alt="me" />
                     <label className="cursor-pointer bg-white border border-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-50">
                       更换
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'myAvatar')} />
                     </label>
                   </div>
                 </div>
                 <div className="flex-1">
                   <label className="text-xs text-gray-500 block mb-1">对方</label>
                   <div className="flex items-center gap-2">
                     <img src={store.config.otherAvatar} className="w-10 h-10 rounded bg-gray-200 object-cover" alt="other" />
                     <label className="cursor-pointer bg-white border border-gray-300 text-xs px-2 py-1 rounded hover:bg-gray-50">
                       更换
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'otherAvatar')} />
                     </label>
                   </div>
                 </div>
               </div>
            </section>

             {/* Features Section */}
             <section className="space-y-3">
               <h3 className="font-bold text-gray-700 text-sm border-b pb-1">功能开关</h3>
               
               <div className="flex items-center justify-between">
                 <span className="text-sm text-gray-700">隐私模式 (模糊)</span>
                 <button 
                  onClick={store.togglePrivacy}
                  className={`w-11 h-6 rounded-full transition-colors relative ${store.config.isPrivacyMode ? 'bg-wechat-green' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${store.config.isPrivacyMode ? 'left-6' : 'left-1'}`}></div>
                 </button>
               </div>

               <div className="flex items-center justify-between">
                 <span className="text-sm text-gray-700">底部营销栏</span>
                 <button 
                  onClick={() => store.setConfig({ showFooter: !store.config.showFooter })}
                  className={`w-11 h-6 rounded-full transition-colors relative ${store.config.showFooter ? 'bg-wechat-green' : 'bg-gray-300'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${store.config.showFooter ? 'left-6' : 'left-1'}`}></div>
                 </button>
               </div>
            </section>

            {/* Marketing Footer Details */}
            {store.config.showFooter && (
              <section className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200 animate-in fade-in slide-in-from-top-2">
                 <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">营销信息配置</h3>
                 <div>
                   <label className="text-xs text-gray-500 block mb-1">底部文案</label>
                   <input 
                    type="text" 
                    value={store.config.footerText} 
                    onChange={(e) => store.setConfig({ footerText: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                   />
                 </div>
                 <div>
                   <label className="text-xs text-gray-500 block mb-1">二维码</label>
                   <div className="flex items-center gap-3">
                     <img src={store.config.footerQrCodeUrl} className="w-16 h-16 object-cover border border-gray-300" alt="qr" />
                     <label className="cursor-pointer bg-white border border-gray-300 text-xs px-3 py-1.5 rounded hover:bg-gray-100 shadow-sm">
                       上传二维码
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'footerQr')} />
                     </label>
                   </div>
                 </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
