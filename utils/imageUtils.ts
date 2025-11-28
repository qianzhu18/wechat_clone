import html2canvas from 'html2canvas';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const fetchAsDataUrl = async (url: string): Promise<string> => {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`fetch image failed: ${res.status}`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 将 element 内部的外链图片转成 dataURL，避免 CORS 导致导出空白。
 * 返回恢复函数用于导出后还原。
 */
const inlineExternalImages = async (element: HTMLElement) => {
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  const restores: Array<() => void> = [];

  for (const img of imgs) {
    const src = img.getAttribute('src') || '';
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;

    // 若已有 crossOrigin，可保持；为了兼容，强制 anonymous
    img.crossOrigin = 'anonymous';

    try {
      const dataUrl = await fetchAsDataUrl(src);
      const originalSrc = src;
      img.setAttribute('src', dataUrl);
      restores.push(() => img.setAttribute('src', originalSrc));
    } catch (err) {
      console.warn('Inline image failed, may render blank in export:', src, err);
      // 保留原 src，避免破坏实时预览
    }
  }

  return () => {
    restores.forEach((restore) => restore());
  };
};

export const exportImage = async (elementId: string, fileName: string = 'wechat-mock.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export failed: element #${elementId} not found.`);
    return;
  }

  // 为保证 1:1，还原预览布局，使用克隆节点放到视口外渲染，避免 flex/隐藏状态导致尺寸缩放。
  const rect = element.getBoundingClientRect();
  const targetWidth = Math.max(element.clientWidth || rect.width || 0, 375);
  const targetHeight = Math.max(element.scrollHeight || rect.height || 0, 812);
  const dpr = window.devicePixelRatio || 1;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = `${elementId}-export-clone`;
  clone.style.width = `${targetWidth}px`;
  clone.style.height = `${targetHeight}px`;
  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.zIndex = '-1';
  clone.style.pointerEvents = 'none';
  clone.style.opacity = '1';
  clone.style.transform = 'none';
  document.body.appendChild(clone);

  let restoreImages: (() => void) | null = null;

  try {
    restoreImages = await inlineExternalImages(clone);

    const canvas = await html2canvas(clone, {
      scale: dpr, // 与设备像素比一致，确保 1:1 清晰度
      useCORS: true,
      backgroundColor: null,
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      windowHeight: targetHeight
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(`Canvas size invalid: ${canvas.width}x${canvas.height}`);
    }

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    console.error("Export failed", e);
    alert("导出图片失败，请重试（若是网络图片，请确保允许跨域或改用本地上传）");
    throw e;
  } finally {
    if (restoreImages) {
      try { restoreImages(); } catch { /* ignore */ }
    }

    // 清理克隆节点
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
};
