import React, { useState } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Preview } from './components/Preview';
import { Edit2, Eye, ChevronLeft, Download } from 'lucide-react';
import { exportImage } from './utils/imageUtils';

const App: React.FC = () => {
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');

  const handleMobileExport = async () => {
     try {
       await exportImage('preview-container', `wechat-mock-${Date.now()}.png`);
     } catch(e) {
       // handled
     }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-900 font-sans text-slate-800 flex-col md:flex-row relative">
      
      {/* Editor Panel: Visible on desktop, or on mobile when 'editor' tab is active */}
      <ControlPanel className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex`} />
      
      {/* Preview Panel: Visible on desktop, or on mobile when 'preview' tab is active */}
      <div className={`flex-1 ${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex relative justify-center items-center bg-gray-900`}>
        <Preview />

        {/* Floating Control Layer (Mobile Only in Preview Mode) */}
        {mobileTab === 'preview' && (
          <div className="absolute top-0 left-0 w-full z-50 flex justify-between p-4 bg-black/60 backdrop-blur-sm text-white md:hidden">
            <button 
              onClick={() => setMobileTab('editor')}
              className="flex items-center gap-1 text-sm font-medium bg-white/10 px-3 py-2 rounded-full hover:bg-white/20 transition-colors"
            >
               <ChevronLeft size={16} /> 返回编辑
            </button>
            <button 
              onClick={handleMobileExport}
              className="flex items-center gap-1 text-sm font-medium bg-wechat-green text-black px-3 py-2 rounded-full hover:opacity-90 transition-colors"
            >
               保存图片 <Download size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Tab Bar - Only show in Editor Mode to avoid clutter in Preview Mode, or keep consistency? 
          SDD says "User is stuck", so we provided the overlay. 
          Let's hide the bottom bar in preview mode to give full screen experience. 
      */}
      {mobileTab === 'editor' && (
        <div className="md:hidden h-14 bg-white border-t border-gray-200 flex shrink-0 z-40">
          <button 
            onClick={() => setMobileTab('editor')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium text-wechat-green`}
          >
            <Edit2 size={20} />
            编辑
          </button>
          <button 
            onClick={() => setMobileTab('preview')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium text-gray-400`}
          >
            <Eye size={20} />
            预览
          </button>
        </div>
      )}
    </div>
  );
};

export default App;