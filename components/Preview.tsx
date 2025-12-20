import React from 'react';
import { useStore } from '../store';
import { Wifi, ChevronLeft, MoreHorizontal, PlusCircle, Mic, Smile } from 'lucide-react';

export const Preview: React.FC = () => {
  const { config, messages } = useStore();

  const getBatteryColor = (level: number) => {
    if (level <= 20) return 'bg-red-500';
    return 'bg-black';
  };

  const batteryLevel = Math.max(0, Math.min(100, config.battery));

  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center p-0 md:p-8 overflow-hidden relative">
       {/* Device Frame */}
      <div 
        id="preview-container"
        className="bg-wechat-bg relative w-full h-full md:w-[375px] md:h-[812px] shadow-2xl overflow-hidden flex flex-col font-ios select-none"
      >
        {/* Status Bar */}
        <div className="status-bar h-[26px] bg-[#f8f8f8] flex items-center justify-between px-3 text-black z-20 shrink-0 border-b border-wechat-divider">
          <div className="text-[12px] font-semibold tracking-tight">{config.time}</div>
          <div className="flex items-center gap-2">
            {config.signal === 'wifi' && <Wifi size={16} className="text-black" strokeWidth={2.2} />}
            {config.signal !== 'wifi' && (
              <div className="flex items-end gap-[2px] text-black">
                 <div className="w-[3px] h-1.5 bg-black rounded-[1px]"></div>
                 <div className="w-[3px] h-2.5 bg-black rounded-[1px]"></div>
                 <div className="w-[3px] h-3.5 bg-black rounded-[1px]"></div>
                 <div className="w-[3px] h-2.5 bg-gray-300 rounded-[1px]"></div>
              </div>
            )}
            {config.signal !== 'wifi' && <span className="text-[11px] font-semibold ml-0.5">{config.signal.toUpperCase()}</span>}
            <div className="flex items-center gap-1 ml-1">
               <div className="relative w-[25px] h-[12px] border border-black/70 rounded-[3px]">
                  <div 
                    className={`absolute left-[2px] top-[2px] h-[8px] rounded-[2px] ${getBatteryColor(batteryLevel)}`} 
                    style={{ width: `${batteryLevel * 0.21}px` }} 
                  />
                  <div className="absolute -right-[4px] top-[4px] w-[2px] h-[4px] bg-black/70 rounded-sm"></div>
               </div>
               <span className="text-[11px] font-semibold">{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* WeChat Nav Bar */}
        <div className="h-[44px] min-h-[44px] bg-wechat-toolbar border-b border-wechat-divider z-20 shrink-0 px-3 relative flex items-center overflow-hidden">
          {/* Left: back + badge */}
          <div className="flex items-center gap-2 min-w-[88px]">
            <ChevronLeft size={22} className="text-black" strokeWidth={2.3} />
            {config.navBadge?.trim() ? (
              <span className="px-2 py-[3px] rounded-full bg-black/6 text-[12px] leading-[14px] text-black/70 border border-black/5 whitespace-nowrap">
                {config.navBadge}
              </span>
            ) : null}
          </div>
          
          {/* Title with absolute centering to avoid compression */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 max-w-[64%] text-center">
            <div className="relative">
              <div className="font-semibold text-[17px] text-center text-[#111111] overflow-hidden whitespace-nowrap text-ellipsis leading-[22px]">
                {config.chatTitle}
              </div>
              {config.isPrivacyMode && (
                <div className="privacy-mask privacy-mask-strong rounded-[4px]" />
              )}
            </div>
          </div>
          
          {/* Right: more */}
          <div className="flex items-center justify-end ml-auto w-[88px]">
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
                    {config.isPrivacyMode && <div className="privacy-mask privacy-mask-strong"></div>}
                  </div>
                )}
                
                <div className={`max-w-[72%] relative`}>
                   
                   {/* TEXT Message */}
                   {msg.type === 'text' && (
                     <div 
                        className={`
                          relative px-[12px] py-[9px] rounded-[6px] text-[16px] leading-[22px] tracking-[-0.2px] break-words
                          border shadow-[0_1px_1px_rgba(0,0,0,0.02)]
                          ${isMe 
                            ? 'bg-wechat-green border-wechat-green-border text-wechat-text' 
                            : 'bg-white border-wechat-bubble-white-border text-wechat-text'
                          }
                          /* Arrow pseudo-element */
                          before:content-[''] before:absolute before:top-[16px] before:w-0 before:h-0 before:border-[6px] before:border-transparent
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
                    {config.isPrivacyMode && <div className="privacy-mask privacy-mask-strong"></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* WeChat Input Bar (Visual Only) */}
        {!config.showFooter && (
          <div className="h-[54px] bg-[#f6f6f6] border-t border-wechat-divider px-3 flex items-center gap-3 shrink-0 shadow-[0_-0.5px_0_rgba(0,0,0,0.06)]">
            <button className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full border border-black/70 bg-white flex items-center justify-center shadow-[0_0.5px_0_rgba(0,0,0,0.08)]">
                <Mic size={17} className="text-black/80" strokeWidth={2} />
              </div>
            </button>
            
            <div className="flex-1 bg-white h-[38px] rounded-[8px] border border-wechat-divider px-3 flex items-center text-[15px] text-[#9b9b9b] shadow-inner">
              <span className="truncate">按住 说话</span>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-3 text-black/80">
              <Smile size={26} strokeWidth={1.6} />
              <PlusCircle size={26} strokeWidth={1.6} />
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
