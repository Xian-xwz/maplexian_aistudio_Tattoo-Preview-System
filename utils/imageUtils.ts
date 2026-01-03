/**
 * 压缩并调整图片尺寸
 * @param file 原始文件
 * @param maxWidth 最大宽度，默认 1280px (平衡显示质量和 AI 处理速度)
 * @param quality 图片质量 0-1
 */
export const compressImage = (file: File, maxWidth = 1280, quality = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    // 1. 如果不是图片，直接返回错误
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // 2. 计算新尺寸
        let width = img.width;
        let height = img.height;

        // 如果图片小于最大宽度，且不是太大的文件，直接返回原文件
        if (width <= maxWidth && file.size < 1024 * 1024 * 2) {
            resolve(file);
            return;
        }

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // 3. 使用 Canvas 进行重绘压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
        }

        // 优化渲染质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // 4. 导出为 Blob/File
        canvas.toBlob((blob) => {
          if (blob) {
            // 强制转换为 JPEG 以获得更好的压缩率，或者保持原格式
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            reject(new Error('Image compression failed'));
          }
        }, 'image/jpeg', quality);
      };

      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};
