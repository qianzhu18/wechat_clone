import React from 'react';
import { useStore } from '../store';
import { Wifi, ChevronLeft, MoreHorizontal, PlusCircle, Mic, Smile } from 'lucide-react';

export const Preview: React.FC = () => {
  const { config, messages } = useStore();

  const getBatteryColor = (level: number) => {
    if (level <= 20) return 'bg-red-500';
    return 'bg-black';
  };

  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center p-0 md:p-8 overflow-hidden relative">
       {/* Device Frame */}
      <div 
        id="preview-container"
        className="bg-wechat-bg relative w-full h-full md:w-[375px] md:h-[812px] shadow-2xl overflow-hidden flex flex-col font-ios select-none"
      >
        {/* Status Bar */}
        <div className="h-[47px] bg-wechat-toolbar flex justify-between items-end px-6 pb-2 text-black z-20 shrink-0">
          <div className="font-semibold text-[15px] leading-none tracking-tight">{config.time}</div>
          <div className="flex items-center gap-1.5">
            {config.signal === 'wifi' && <Wifi size={18} className="text-black" strokeWidth={2.5} />}
            {config.signal !== 'wifi' && (
              <div className="flex items-end gap-[2px]">
                 <div className="w-[3px] h-1.5 bg-black rounded-[0.5px]"></div>
                 <div className="w-[3px] h-2.5 bg-black rounded-[0.5px]"></div>
                 <div className="w-[3px] h-3.5 bg-black rounded-[0.5px]"></div>
                 <div className="w-[3px] h-2.5 bg-gray-300 rounded-[0.5px]"></div>
              </div>
            )}
            {config.signal !== 'wifi' && <span className="text-[12px] font-bold ml-1">{config.signal.toUpperCase()}</span>}
            
            <div className="flex items-center ml-1">
               <div className="w-[22px] h-[11px] border border-gray-400 rounded-[3px] p-[1px] relative opacity-80">
                  <div 
                    className={`h-full rounded-[1px] ${getBatteryColor(config.battery)}`} 
                    style={{ width: `${config.battery}%` }} 
                  />
                  <div className="absolute -right-[3.5px] top-[3px] w-[2px] h-1 bg-gray-400 rounded-r-sm"></div>
               </div>
            </div>
          </div>
        </div>

        {/* WeChat Nav Bar */}
        <div className="h-[44px] bg-wechat-toolbar flex items-center px-3 border-b border-wechat-divider z-20 relative shrink-0">
          <div className="flex items-center justify-start w-16 shrink-0">
            <ChevronLeft size={24} className="text-black" strokeWidth={2} />
          </div>
          
          {/* Title with collapse protection */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-[75%] px-2">
            <div className="relative">
              <div className="font-medium text-[17px] leading-none text-center text-[#111111] overflow-hidden whitespace-nowrap text-ellipsis">
                {config.chatTitle}
              </div>
              {config.isPrivacyMode && (
                <div className="absolute inset-0 bg-white/85 pointer-events-none" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end w-16 shrink-0">
            <MoreHorizontal size={22} className="text-black" />
          </div>
        </div>

        {/* Chat Area */}
        <div id="chat-scroll-area" className="flex-1 bg-wechat-bg overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => {
            // System Time Message
            if (msg.type === 'system_time') {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="text-wechat-gray text-[12px] font-medium font-sans">{msg.content}</span>
                </div>
              );
            }

            const isMe = msg.role === 'me';
            const avatarSrc = isMe ? config.myAvatar : config.otherAvatar;

            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} gap-[10px] mb-2`}>
                {!isMe && (
                  <div className="relative w-[40px] h-[40px] rounded-[6px] flex-shrink-0 overflow-hidden">
                    <img 
                      src={avatarSrc} 
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                    {config.isPrivacyMode && <div className="absolute inset-0 bg-white/85 pointer-events-none"></div>}
                  </div>
                )}
                
                <div className={`max-w-[72%] relative`}>
                   
                   {/* TEXT Message */}
                   {msg.type === 'text' && (
                     <div 
                        className={`
                          relative px-3 py-2.5 rounded-[6px] text-[16px] leading-[1.4] tracking-[-0.3px] break-words
                          border shadow-[0_1px_1px_rgba(0,0,0,0.02)]
                          ${isMe 
                            ? 'bg-wechat-green border-wechat-green-border text-wechat-text' 
                            : 'bg-white border-wechat-bubble-white-border text-wechat-text'
                          }
                          /* Arrow pseudo-element */
                          before:content-[''] before:absolute before:top-[14px] before:w-0 before:h-0 before:border-[6px] before:border-transparent
                          ${isMe 
                             ? 'before:-right-[11px] before:border-l-wechat-green' 
                             : 'before:-left-[11px] before:border-r-white'
                          }
                        `}
                     >
                       {msg.content}
                     </div>
                   )}

                   {/* IMAGE Message */}
                   {msg.type === 'image' && (
                     <div className="rounded-[6px] overflow-hidden border border-gray-200">
                        <img src={msg.content} className="max-w-full block" alt="msg image" />
                     </div>
                   )}

                   {/* LINK CARD Message */}
                   {msg.type === 'link_card' && msg.linkData && (
                     <div className="w-[240px] bg-white rounded-[6px] p-3 border border-wechat-bubble-white-border shadow-sm flex gap-3">
                        <div className="flex-1 min-w-0">
                           <h4 className="text-[14px] leading-tight font-medium text-black line-clamp-2 mb-1">
                             {msg.linkData.title || 'Link Title'}
                           </h4>
                           <p className="text-[12px] text-gray-400 truncate">
                             {msg.linkData.desc || 'Description'}
                           </p>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 flex-shrink-0">
                          {msg.linkData.thumbUrl && (
                            <img src={msg.linkData.thumbUrl} className="w-full h-full object-cover" alt="thumb" />
                          )}
                        </div>
                     </div>
                   )}
                </div>

                {isMe && (
                  <div className="relative w-[40px] h-[40px] rounded-[6px] flex-shrink-0 overflow-hidden">
                    <img 
                      src={avatarSrc} 
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                    {config.isPrivacyMode && <div className="absolute inset-0 bg-white/85 pointer-events-none"></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* WeChat Input Bar (Visual Only) */}
        {!config.showFooter && (
          <div className="h-[56px] bg-wechat-toolbar border-top border-wechat-divider px-3 flex items-center gap-2 shrink-0 border-t">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white border border-black/70 flex items-center justify-center">
                <Mic size={16} className="text-black/80" strokeWidth={2} />
              </div>
            </div>
            
            <div className="flex-1 bg-white h-10 rounded-[6px] border border-wechat-divider"></div>
            
            <div className="flex-shrink-0 flex items-center gap-3">
                <Smile size={26} className="text-black/80" strokeWidth={1.5} />
                <PlusCircle size={26} className="text-black/80" strokeWidth={1.5} />
            </div>
          </div>
        )}

        {/* Marketing Footer */}
        {config.showFooter && (
          <div className="bg-white border-t border-gray-200 p-4 flex items-center gap-4 pb-8 shrink-0">
             <div className="w-20 h-20 bg-gray-100 flex-shrink-0">
               <img src={config.footerQrCodeUrl} className="w-full h-full object-cover" alt="QR" />
             </div>
             <div className="flex-1">
               <p className="text-sm font-bold text-gray-800">{config.footerText}</p>
               <p className="text-xs text-gray-500 mt-1">长按识别二维码</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
