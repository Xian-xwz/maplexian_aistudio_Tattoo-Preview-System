import React, { useEffect, useState, useRef } from 'react';
import { Tattoo, Language } from '../types';
import { db } from '../services/db';
import { TRANSLATIONS } from '../src/constants';

interface Props {
  language: Language;
  onDragStart: (e: React.DragEvent, tattoo: Tattoo) => void;
  onTattooClick: (tattoo: Tattoo) => void;
  isMobile: boolean;
}

const TattooGallery: React.FC<Props> = ({ language, onDragStart, onTattooClick, isMobile }) => {
  const [tattoos, setTattoos] = useState<Tattoo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 拖拽相关状态
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  // 初始化加载数据
  useEffect(() => {
    loadTattoos();
  }, []);

  // 从 DB 加载纹身列表
  const loadTattoos = async () => {
    setIsLoading(true);
    try {
      const data = await db.tattoos.getAll();
      setTattoos(data);
    } catch (error) {
      console.error("Failed to load tattoos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 验证文件
  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert(t.errorFormat || "Invalid format");
      return false;
    }
    // 5MB 限制
    if (file.size > 5 * 1024 * 1024) {
      alert(t.tattooSizeError || "File too large");
      return false;
    }
    return true;
  };

  // 处理文件上传 (添加新纹身)
  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;
    
    setIsLoading(true);
    try {
      await db.tattoos.upload(file);
      await loadTattoos(); 
      // 简单提示，实际项目建议使用 Toast
      console.log(t.uploadSuccess); 
    } catch (error) {
      console.error("Failed to upload tattoo:", error);
      alert(t.uploadFailed || "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件替换 (替换现有纹身)
  const handleFileReplace = async (id: string, file: File) => {
    if (!validateFile(file)) return;

    setIsLoading(true);
    try {
      await db.tattoos.replace(id, file);
      await loadTattoos();
      console.log(t.replaceSuccess);
    } catch (error: any) {
      console.error("Failed to replace tattoo:", error);
      // 如果是默认图片不可替换的错误，显示特定提示
      if (error.message.includes("default")) {
          alert(t.replaceErrorDefault);
      } else {
          alert(t.replaceFailed || "Replace failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
    // 清空 input 允许重复上传同一文件
    e.target.value = '';
  };

  // 删除操作
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (!window.confirm(t.confirmDelete)) return;

    try {
      const success = await db.tattoos.delete(id);
      if (success) {
        loadTattoos();
      } else {
        alert(t.replaceErrorDefault || "Cannot delete default tattoo.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(t.deleteFailed || "Delete failed");
    }
  };

  // --- 容器拖拽事件 (添加新纹身) ---
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        setIsDragOverContainer(true);
        e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // 只有当离开整个容器时才取消高亮
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOverContainer(false);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverContainer(false);
    
    // 如果是文件拖拽
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // --- 列表项拖拽事件 (替换纹身) ---
  const handleItemDragOver = (e: React.DragEvent, id: string) => {
    // 阻止冒泡，避免触发容器的 drop
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
        setDragOverItemId(id);
        e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleItemDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
  };

  const handleItemDrop = (e: React.DragEvent, tattoo: Tattoo) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverItemId(null);
    setIsDragOverContainer(false); // 确保容器高亮也取消

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // 尝试替换
        if (tattoo.isDefault) {
            alert(t.replaceErrorDefault);
        } else {
            handleFileReplace(tattoo.id, e.dataTransfer.files[0]);
        }
    }
  };

  return (
    <div 
        className={`h-full flex flex-col bg-surface border-l border-border shadow-lg select-none transition-colors duration-200 ${isDragOverContainer ? 'bg-blue-50/50' : ''}`}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
    >
      {/* 顶部标题栏和上传按钮 */}
      <div className={`border-b border-border bg-surface sticky top-0 z-10 shadow-sm ${isMobile ? 'p-2' : 'p-4'}`}>
        {!isMobile && (
          <h3 className="font-bold text-txt-primary text-lg mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {t.galleryTitle}
          </h3>
        )}
        {!isMobile && <p className="text-xs text-txt-secondary mb-3">{t.galleryDragHint}</p>}
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center justify-center w-full bg-primary text-white rounded-lg cursor-pointer hover:bg-primary-hover active:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-0.5 ${isMobile ? 'py-4 text-base' : 'py-2.5 text-sm'}`}
        >
          <svg className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t.uploadTattoo}
        </button>
        <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={onFileInputChange} 
        />
      </div>

      {/* 纹身列表区域 */}
      <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-40 text-txt-muted space-y-2">
            <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span className="text-xs">{t.loadingGallery}</span>
          </div>
        ) : (
          <div className={`grid gap-3 content-start pb-20 ${isMobile ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {tattoos.map((tattoo) => {
              const isDragOver = dragOverItemId === tattoo.id;
              
              return (
                <div
                    key={tattoo.id}
                    className={`aspect-square bg-surface-highlight border-2 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all duration-200 flex items-center justify-center relative group
                        ${isDragOver ? 'border-primary bg-blue-50 scale-105 shadow-lg' : 'border-transparent hover:border-primary/50 hover:bg-blue-50/30 hover:shadow-md'}
                    `}
                    draggable="true"
                    onDragStart={(e) => onDragStart(e, tattoo)}
                    onClick={() => onTattooClick(tattoo)}
                    onDragOver={(e) => handleItemDragOver(e, tattoo.id)}
                    onDragLeave={handleItemDragLeave}
                    onDrop={(e) => handleItemDrop(e, tattoo)}
                    title={tattoo.name}
                >
                    {/* 图片展示 */}
                    <img
                    src={tattoo.imageBase64}
                    alt={tattoo.name}
                    loading="lazy" 
                    className="max-w-full max-h-full object-contain pointer-events-none select-none drop-shadow-sm transition-transform group-hover:scale-105" 
                    />
                    
                    {/* 仅用户上传的图片显示删除按钮 */}
                    {!tattoo.isDefault && (
                    <button 
                        className="absolute top-1 right-1 p-1.5 bg-surface rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:scale-110 z-10"
                        onClick={(e) => handleDelete(e, tattoo.id)}
                        title="Delete"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                    )}

                    {/* 默认图片的标识 (可选) */}
                    {tattoo.isDefault && (
                    <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                        <svg className="w-3 h-3 text-txt-muted" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    </div>
                    )}
                    
                    {/* 悬停提示 */}
                    {!isDragOver && (
                        <div className="absolute inset-0 border-2 border-primary rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                    )}
                </div>
              );
            })}
            
            {tattoos.length === 0 && (
                <div className={`text-center text-txt-muted py-10 text-sm ${isMobile ? 'col-span-3' : 'col-span-2'}`}>
                    {t.noTattoos}
                </div>
            )}
            
            {/* 上传引导块 (可选，如果列表为空或者为了方便) */}
            <div 
                className="aspect-square border-2 border-dashed border-divider rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-surface-highlight text-txt-muted hover:text-primary transition-all"
                onClick={() => fileInputRef.current?.click()}
                title={t.uploadTattoo}
            >
                 <svg className="w-8 h-8 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                 <span className="text-xs font-medium">{t.uploadTattoo}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* 拖拽时的全局覆盖层 (当拖拽进入容器时增强提示) */}
      {isDragOverContainer && !dragOverItemId && (
          <div className="absolute inset-0 z-20 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center pointer-events-none border-2 border-primary m-2 rounded-xl border-dashed">
              <div className="bg-surface px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="font-bold text-primary">{t.dropToAdd}</span>
              </div>
          </div>
      )}
    </div>
  );
};

export default TattooGallery;