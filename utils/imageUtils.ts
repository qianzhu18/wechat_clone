import html2canvas from 'html2canvas';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const exportImage = async (elementId: string, fileName: string = 'wechat-mock.png') => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Increased scale for sharpness
      useCORS: true,
      backgroundColor: null,
      windowWidth: 375, // Force mobile width to prevent layout collapse
      onclone: (clonedDoc) => {
        // Ensure the cloned element respects the width
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
            clonedElement.style.width = '375px';
            clonedElement.style.height = '812px'; // Optional: fix height if needed, but width is critical
        }
      }
    });
    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (e) {
    console.error("Export failed", e);
    alert("导出图片失败，请重试");
  }
};