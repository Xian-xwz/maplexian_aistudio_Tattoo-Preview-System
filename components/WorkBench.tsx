import React, { useRef, useState, useEffect } from 'react';
import { Language, Tattoo, CanvasObject, UserConfig, DeviceMode } from '../types';
import { TRANSLATIONS, MAX_UPLOAD_SIZE_MB, MAX_FREE_API_CALLS, DEFAULT_API_KEY } from '../constants';
import { generateFusion } from '../services/geminiService';
import { compressImage } from '../utils/imageUtils';
import TattooGallery from './TattooGallery';
import SettingsModal from './SettingsModal';
import Toast, { ToastMessage } from './Toast';

interface Props {
  language: Language;
  config: UserConfig;
  onUpdateConfig: (newConfig: Partial<UserConfig>) => void;
  onBack: () => void;
}

// 交互状态类型定义
// 新增 'pinch' 模式用于双指缩放
type InteractionMode = 'none' | 'drag' | 'rotate' | 'resize' | 'pan' | 'pinch';
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

interface ViewState {
  scale: number;
  x: number;
  y: number;
  fitScale: number; // 记录初始适配比例
}

interface InteractionState {
  mode: InteractionMode;
  startPoint: { x: number; y: number }; // 屏幕/Canvas坐标
  startObjectParams: { x: number; y: number; width: number; height: number; rotation: number };
  activeHandle?: ResizeHandle;
  startView?: ViewState; // 用于平移和缩放计算
  // 双指缩放专用状态
  startPinchDist?: number; // 初始双指距离
  startPinchCenter?: { x: number; y: number }; // 初始双指中心点(相对于Canvas)
}

// 历史记录状态接口
interface HistoryState {
  bgImageSrc: string | null;
  objects: CanvasObject[];
}

// 增大手柄视觉大小和点击热区
const HANDLE_SIZE = 12; // 视觉大小
const ROTATE_HANDLE_OFFSET = 35; // 旋转手柄距离
const HIT_SLOP = 5.0; // 点击热区倍数 (12 * 5 = 60px 半径)，极大增加移动端容错率

const WorkBench: React.FC<Props> = ({ language, config, onUpdateConfig, onBack }) => {
  const t = TRANSLATIONS[language];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // 视图状态：缩放和平移
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0, fitScale: 1 });

  // 历史记录状态
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 交互状态管理
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: 'none',
    startPoint: { x: 0, y: 0 },
    startObjectParams: { x: 0, y: 0, width: 0, height: 0, rotation: 0 }
  });

  // 拖拽预览状态 (从纹身库拖拽到画布)
  const [dragPreviewTattoo, setDragPreviewTattoo] = useState<Tattoo | null>(null);
  const [dragOverPos, setDragOverPos] = useState<{x: number, y: number} | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  // 检查新手引导
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('inkpreview_guide_seen');
    if (!hasSeenGuide) {
        setShowGuide(true);
    }
  }, []);

  const closeGuide = () => {
      setShowGuide(false);
      localStorage.setItem('inkpreview_guide_seen', 'true');
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  useEffect(() => {
    drawCanvas();
  }, [bgImage, canvasObjects, selectedObjectId, dragOverPos, view]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current && bgImage) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        drawCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bgImage]);

  // --- 历史记录管理 ---

  // 添加新状态到历史记录
  const addToHistory = (newObjects: CanvasObject[], newBgSrc: string | null) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const newState: HistoryState = {
      // 深拷贝对象属性 (image 引用保持不变，这是安全的因为 Image 对象内容通常不会变)
      objects: newObjects.map(o => ({ ...o })),
      bgImageSrc: newBgSrc
    };
    
    // 限制历史记录长度，防止内存无限增长 (例如限制50步)
    if (newHistory.length >= 50) {
        newHistory.shift();
    }
    
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 恢复历史状态
  const restoreState = (state: HistoryState) => {
    // 恢复背景图
    if (state.bgImageSrc) {
        if (!bgImage || bgImage.src !== state.bgImageSrc) {
            const img = new Image();
            img.src = state.bgImageSrc;
            img.onload = () => {
                setBgImage(img);
                // 恢复对象 (等待背景加载后绘制更稳妥，但 React 状态更新是异步的，这里直接设置也没问题)
            };
        }
    } else {
        setBgImage(null);
    }

    // 恢复纹身对象 (深拷贝回来)
    setCanvasObjects(state.objects.map(o => ({ ...o })));
    setSelectedObjectId(null); // 恢复时取消选中，体验更好
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
        const prevIndex = historyIndex - 1;
        const prevState = history[prevIndex];
        restoreState(prevState);
        setHistoryIndex(prevIndex);
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const nextIndex = historyIndex + 1;
        const nextState = history[nextIndex];
        restoreState(nextState);
        setHistoryIndex(nextIndex);
    }
  };

  // --- 坐标转换辅助函数 ---

  // 屏幕/Canvas坐标 -> 图像世界坐标 (考虑平移和缩放)
  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - view.x) / view.scale,
      y: (screenY - view.y) / view.scale
    };
  };

  // 图像世界坐标 -> 本地对象坐标 (考虑对象旋转)
  const worldToLocal = (worldX: number, worldY: number, obj: CanvasObject) => {
    const dx = worldX - obj.x;
    const dy = worldY - obj.y;
    const angleRad = (-obj.rotation * Math.PI) / 180;
    return {
      x: dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
      y: dx * Math.sin(angleRad) + dy * Math.cos(angleRad)
    };
  };

  // 辅助：获取双指触摸中心点
  const getTouchCenter = (t1: React.Touch, t2: React.Touch, rect: DOMRect) => {
    return {
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top
    };
  };

  // 辅助：获取双指距离
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  // 初始化 Canvas 尺寸和视图
  const initCanvasView = (img: HTMLImageElement) => {
    if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // 计算适配比例 (Contain)
        const scale = Math.min(width / img.width, height / img.height);
        const x = (width - img.width * scale) / 2;
        const y = (height - img.height * scale) / 2;
        
        // 设置初始视图
        setView({ scale, x, y, fitScale: scale });
    }
  };

  // 重置视图
  const handleResetView = () => {
    if (bgImage && containerRef.current) {
        initCanvasView(bgImage);
    }
  };

  /**
   * 绘制 Canvas 核心逻辑
   */
  const drawCanvas = (isExporting = false, useMultiply = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. 绘制背景图
    if (bgImage) {
      ctx.save();
      ctx.translate(view.x, view.y);
      ctx.scale(view.scale, view.scale);

      ctx.drawImage(bgImage, 0, 0);

      // 2. 绘制纹身对象
      canvasObjects.forEach(obj => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate((obj.rotation * Math.PI) / 180);

        if (useMultiply) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.9;
        }
        
        ctx.drawImage(obj.image, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
        
        if (useMultiply) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }

        if (obj.isSelected && !isExporting) {
          const invScale = 1 / view.scale;
          const lineWidth = 2 * invScale;
          const handleRad = HANDLE_SIZE * invScale;
          const rotateOffset = ROTATE_HANDLE_OFFSET * invScale;

          // 绘制选中框
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = lineWidth;
          ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
          
          // 绘制旋转连接线
          ctx.beginPath();
          ctx.moveTo(0, -obj.height / 2);
          ctx.lineTo(0, -obj.height / 2 - rotateOffset);
          ctx.stroke();

          // 绘制旋转手柄 (圆形 + 图标感)
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(0, -obj.height / 2 - rotateOffset, handleRad, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // 旋转手柄中心点
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(0, -obj.height / 2 - rotateOffset, handleRad * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // 绘制四个角的缩放手柄
          const corners = [
              { x: -obj.width / 2, y: -obj.height / 2 },
              { x: obj.width / 2, y: -obj.height / 2 },
              { x: obj.width / 2, y: obj.height / 2 },
              { x: -obj.width / 2, y: obj.height / 2 },
          ];

          corners.forEach((corner) => {
              ctx.fillStyle = '#fff';
              ctx.strokeStyle = '#3b82f6';
              ctx.beginPath();
              ctx.arc(corner.x, corner.y, handleRad, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
          });
        }
        ctx.restore();
      });

      // 3. 绘制拖拽预览
      ctx.restore();
      
      if (dragOverPos && previewImageRef.current && !isExporting) {
        const img = previewImageRef.current;
        const width = 100 * view.scale;
        const height = (100 * (img.height / img.width)) * view.scale;
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.translate(dragOverPos.x, dragOverPos.y);
        ctx.drawImage(img, -width/2, -height/2, width, height);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-width/2, -height/2, width, height);
        ctx.restore();
      }

    } else {
      // 绘制空状态背景
      if (!isExporting) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const isDark = config.theme === 'dark';
        
        ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        ctx.setLineDash([]);

        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(t.uploadTitle, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        ctx.fillText(t.uploadDesc, canvas.width / 2, canvas.height / 2 + 25);
      }
    }
  };

  const handlePhotoUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('error', t.errorFormat || "Format Error");
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      showToast('error', t.errorSize || "Size Error");
      return;
    }

    setIsPhotoLoading(true);

    try {
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgSrc = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setBgImage(img);
          setCanvasObjects([]); 
          setIsPhotoLoading(false);
          initCanvasView(img);
          
          // 重置历史记录，并添加初始状态
          const initialHistory = [{ objects: [], bgImageSrc: imgSrc }];
          setHistory(initialHistory);
          setHistoryIndex(0);

          showToast('info', t.zoomHint || 'Use Ctrl+Wheel to zoom');
        };
        img.onerror = () => {
          setIsPhotoLoading(false);
          showToast('error', t.errorLoad || "Load Error");
        };
        img.src = imgSrc;
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setIsPhotoLoading(false);
      console.error(err);
      showToast('error', t.processImageFail || "Image processing failed");
    }
  };

  // --- 交互处理 ---

  // PC 端鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    if (!bgImage || !e.ctrlKey) return;
    e.preventDefault();

    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldBefore = screenToWorld(mouseX, mouseY);
    const zoomSensitivity = 0.001;
    const minScale = view.fitScale * 0.1;
    const maxScale = Math.max(view.fitScale * 5, 5); 
    
    let newScale = view.scale - e.deltaY * zoomSensitivity * view.scale;
    newScale = Math.min(Math.max(minScale, newScale), maxScale);

    const newX = mouseX - worldBefore.x * newScale;
    const newY = mouseY - worldBefore.y * newScale;

    setView(prev => ({ ...prev, scale: newScale, x: newX, y: newY }));
  };

  const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  // 指针/触摸开始
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || isProcessing || !bgImage) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // --- 双指缩放检测 ---
    // 如果是触摸事件且有2个触点，进入双指缩放模式
    if ('touches' in e && e.touches.length === 2) {
      e.preventDefault(); // 防止默认缩放
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = getTouchDistance(t1, t2);
      const center = getTouchCenter(t1, t2, rect);

      setInteraction({
        mode: 'pinch',
        startPoint: { x: 0, y: 0 }, // 缩放模式下未使用
        startObjectParams: { x: 0, y: 0, width: 0, height: 0, rotation: 0 }, // 未使用
        startPinchDist: dist,
        startPinchCenter: center,
        startView: { ...view }
      });
      return;
    }

    // --- 单指/鼠标操作逻辑 ---
    // 关键修复：单指操作时也需要阻止默认行为（防止页面滚动/回弹）
    if ('touches' in e && e.touches.length === 1) {
       e.preventDefault();
    }

    const { x: clientX, y: clientY } = getClientPos(e);
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const { x: worldX, y: worldY } = screenToWorld(mouseX, mouseY);

    let handled = false;
    
    // 1. 检查选中对象的手柄
    if (selectedObjectId) {
        const obj = canvasObjects.find(o => o.id === selectedObjectId);
        if (obj) {
            const { x: localX, y: localY } = worldToLocal(worldX, worldY, obj);
            // 增大判定区域：使用 HIT_SLOP 倍数
            const hitSize = HANDLE_SIZE * HIT_SLOP / view.scale; 
            const rotateOffset = ROTATE_HANDLE_OFFSET / view.scale;
            
            if (Math.hypot(localX, localY - (-obj.height / 2 - rotateOffset)) <= hitSize) {
                setInteraction({
                    mode: 'rotate',
                    startPoint: { x: mouseX, y: mouseY },
                    startObjectParams: { ...obj }
                });
                handled = true;
            } else {
                const corners: {handle: ResizeHandle, x: number, y: number}[] = [
                    { handle: 'tl', x: -obj.width / 2, y: -obj.height / 2 },
                    { handle: 'tr', x: obj.width / 2, y: -obj.height / 2 },
                    { handle: 'bl', x: -obj.width / 2, y: obj.height / 2 },
                    { handle: 'br', x: obj.width / 2, y: obj.height / 2 },
                ];
                for (const corner of corners) {
                    if (Math.hypot(localX - corner.x, localY - corner.y) <= hitSize) {
                        setInteraction({
                            mode: 'resize',
                            activeHandle: corner.handle,
                            startPoint: { x: mouseX, y: mouseY },
                            startObjectParams: { ...obj }
                        });
                        handled = true;
                        break;
                    }
                }
            }
        }
    }

    // 2. 检查点击对象
    if (!handled) {
        let clickedObjId: string | null = null;
        for (let i = canvasObjects.length - 1; i >= 0; i--) {
            const obj = canvasObjects[i];
            const { x: localX, y: localY } = worldToLocal(worldX, worldY, obj);
            if (localX >= -obj.width / 2 && localX <= obj.width / 2 &&
                localY >= -obj.height / 2 && localY <= obj.height / 2) {
                clickedObjId = obj.id;
                break;
            }
        }

        if (clickedObjId) {
            setSelectedObjectId(clickedObjId);
            setCanvasObjects(prev => prev.map(o => ({ ...o, isSelected: o.id === clickedObjId })));
            const obj = canvasObjects.find(o => o.id === clickedObjId)!;
            setInteraction({
                mode: 'drag',
                startPoint: { x: mouseX, y: mouseY },
                startObjectParams: { ...obj }
            });
            handled = true;
        } else {
            setSelectedObjectId(null);
            setCanvasObjects(prev => prev.map(o => ({ ...o, isSelected: false })));
            setInteraction({
                mode: 'pan',
                startPoint: { x: mouseX, y: mouseY },
                startObjectParams: { x:0,y:0,width:0,height:0,rotation:0 },
                startView: { ...view }
            });
        }
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || isProcessing) return;
    const rect = canvasRef.current.getBoundingClientRect();

    // --- 双指缩放处理 ---
    if (interaction.mode === 'pinch' && 'touches' in e && e.touches.length === 2 && interaction.startView) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = getTouchDistance(t1, t2);
      const currentCenter = getTouchCenter(t1, t2, rect);

      // 计算缩放比例
      const scaleRatio = currentDist / (interaction.startPinchDist || 1);
      const rawNewScale = interaction.startView.scale * scaleRatio;

      // 缩放限制 (0.5x - 3x 相对初始适配比例)
      const minScale = interaction.startView.fitScale ? interaction.startView.fitScale * 0.5 : 0.1;
      const maxScale = Math.max((interaction.startView.fitScale || 1) * 3, 5);
      const newScale = Math.min(Math.max(rawNewScale, minScale), maxScale);

      const worldCenter = {
        x: (interaction.startPinchCenter!.x - interaction.startView.x) / interaction.startView.scale,
        y: (interaction.startPinchCenter!.y - interaction.startView.y) / interaction.startView.scale
      };

      const newX = currentCenter.x - worldCenter.x * newScale;
      const newY = currentCenter.y - worldCenter.y * newScale;

      setView(prev => ({ ...prev, scale: newScale, x: newX, y: newY }));
      return;
    }

    // --- 现有单指/鼠标移动逻辑 ---
    const { x: clientX, y: clientY } = getClientPos(e);
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    if (interaction.mode === 'none') {
        updateCursor(mouseX, mouseY);
        return;
    }

    e.preventDefault();

    if (interaction.mode === 'pan' && interaction.startView) {
        const dx = mouseX - interaction.startPoint.x;
        const dy = mouseY - interaction.startPoint.y;
        setView(prev => ({
            ...prev,
            x: interaction.startView!.x + dx,
            y: interaction.startView!.y + dy
        }));
        return;
    }

    const dxScreen = mouseX - interaction.startPoint.x;
    const dyScreen = mouseY - interaction.startPoint.y;
    const dxWorld = dxScreen / view.scale;
    const dyWorld = dyScreen / view.scale;

    setCanvasObjects(prev => prev.map(obj => {
        if (obj.id !== selectedObjectId) return obj;

        if (interaction.mode === 'drag') {
            return {
                ...obj,
                x: interaction.startObjectParams.x + dxWorld,
                y: interaction.startObjectParams.y + dyWorld
            };
        } 
        else if (interaction.mode === 'rotate') {
            const worldPos = screenToWorld(mouseX, mouseY);
            const dx = worldPos.x - obj.x;
            const dy = worldPos.y - obj.y;
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = (angleRad * 180 / Math.PI) + 90;
            return { ...obj, rotation: angleDeg };
        } 
        else if (interaction.mode === 'resize') {
            const worldPos = screenToWorld(mouseX, mouseY);
            const startWorldPos = screenToWorld(interaction.startPoint.x, interaction.startPoint.y);
            const startDist = Math.hypot(
                startWorldPos.x - interaction.startObjectParams.x,
                startWorldPos.y - interaction.startObjectParams.y
            );
            const currDist = Math.hypot(
                worldPos.x - interaction.startObjectParams.x,
                worldPos.y - interaction.startObjectParams.y
            );
            
            // 避免缩放到0
            if (startDist < 1 || currDist < 1) return obj;
            
            const scaleFactor = currDist / startDist;
            return {
                ...obj,
                width: Math.max(20, interaction.startObjectParams.width * scaleFactor),
                height: Math.max(20, interaction.startObjectParams.height * scaleFactor)
            };
        }
        return obj;
    }));
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    // 如果是 pinch 模式，当触摸点数量变化时结束 pinch
    if (interaction.mode === 'pinch') {
      setInteraction({ mode: 'none', startPoint: {x:0, y:0}, startObjectParams: {x:0,y:0,width:0,height:0,rotation:0} });
      return;
    }

    // 检查是否有实质性修改，如果有，记录历史
    if (selectedObjectId && interaction.mode !== 'none' && interaction.mode !== 'pan') {
        const obj = canvasObjects.find(o => o.id === selectedObjectId);
        const startParams = interaction.startObjectParams;
        if (obj && (
            obj.x !== startParams.x ||
            obj.y !== startParams.y ||
            obj.width !== startParams.width ||
            obj.height !== startParams.height ||
            obj.rotation !== startParams.rotation
        )) {
            addToHistory(canvasObjects, bgImage ? bgImage.src : null);
        }
    }
    
    setInteraction({ mode: 'none', startPoint: {x:0, y:0}, startObjectParams: {x:0,y:0,width:0,height:0,rotation:0} });
  };

  const updateCursor = (mouseX: number, mouseY: number) => {
    if (!canvasRef.current) return;
    if (!selectedObjectId) {
        if (bgImage) {
            canvasRef.current.style.cursor = 'grab';
        } else {
            canvasRef.current.style.cursor = 'default';
        }
        return;
    }
    
    const obj = canvasObjects.find(o => o.id === selectedObjectId);
    if (!obj) return;

    const { x: worldX, y: worldY } = screenToWorld(mouseX, mouseY);
    const { x: localX, y: localY } = worldToLocal(worldX, worldY, obj);
    // 更新 cursor 检测也使用相同的宽松判定
    const hitSize = HANDLE_SIZE * HIT_SLOP / view.scale;
    const rotateOffset = ROTATE_HANDLE_OFFSET / view.scale;

    if (Math.hypot(localX, localY - (-obj.height / 2 - rotateOffset)) <= hitSize) {
        canvasRef.current.style.cursor = 'url("https://api.iconify.design/mdi:refresh.svg") 12 12, auto';
        return;
    }

    if (Math.abs(localX) >= obj.width/2 - hitSize && Math.abs(localX) <= obj.width/2 + hitSize &&
        Math.abs(localY) >= obj.height/2 - hitSize && Math.abs(localY) <= obj.height/2 + hitSize) {
        canvasRef.current.style.cursor = 'nwse-resize';
        return;
    }

    if (localX >= -obj.width / 2 && localX <= obj.width / 2 &&
        localY >= -obj.height / 2 && localY <= obj.height / 2) {
        canvasRef.current.style.cursor = 'move';
        return;
    }

    canvasRef.current.style.cursor = 'default';
  };

  // ... (其余函数保持不变，仅列出需要变更的部分)
  // ... handleDropTattoo, handleTattooClick, addTattooToCanvas, handleDoubleClick, handleGenerate, handleDownload, isMobile, layoutClass, galleryClass, remainingCallsDisplay, hasUserKey, handleTattooDragStart, handleDragOver, handleDragLeave, handleDrop, handleReset, triggerFileSelect ...
  
  // 这里为了完整性，把文件末尾的 helper functions 和 JSX 也包含进来，确保没有遗漏
  const handleDropTattoo = (e: React.DragEvent, tattooJson: string) => {
    if (!bgImage || !canvasRef.current) return;
    const tattoo: Tattoo = JSON.parse(tattooJson);
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x: worldX, y: worldY } = screenToWorld(mouseX, mouseY);
    
    // addTattooToCanvas 会触发状态更新，我们在那里处理历史记录
    addTattooToCanvas(tattoo, worldX, worldY);
    
    setDragOverPos(null);
    setDragPreviewTattoo(null);
    previewImageRef.current = null;
  };

  const handleTattooClick = (tattoo: Tattoo) => {
    if (!bgImage || !canvasRef.current) {
        showToast('info', t.uploadTitle); 
        return;
    }
    const centerWorld = screenToWorld(canvasRef.current.width / 2, canvasRef.current.height / 2);
    addTattooToCanvas(tattoo, centerWorld.x, centerWorld.y);
  }

  const addTattooToCanvas = (tattoo: Tattoo, x: number, y: number) => {
    const img = new Image();
    img.onload = () => {
      const baseSize = bgImage ? Math.min(bgImage.width, bgImage.height) / 4 : 100;
      
      const newObj: CanvasObject = {
        id: Date.now().toString(),
        type: 'image',
        image: img,
        x,
        y,
        width: baseSize, 
        height: baseSize * (img.height / img.width),
        rotation: 0,
        isSelected: true
      };
      
      const nextObjects = [...canvasObjects.map(o => ({ ...o, isSelected: false })), newObj];
      setCanvasObjects(nextObjects);
      setSelectedObjectId(newObj.id);
      
      // 添加历史记录
      addToHistory(nextObjects, bgImage ? bgImage.src : null);
      
      showToast('info', t.doubleClickHint || 'Double-click to fuse');
    };
    img.src = tattoo.imageBase64;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isProcessing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x: worldX, y: worldY } = screenToWorld(mouseX, mouseY);

    let clickedObjId: string | null = null;
    for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        const { x: localX, y: localY } = worldToLocal(worldX, worldY, obj);
        if (localX >= -obj.width / 2 && localX <= obj.width / 2 &&
            localY >= -obj.height / 2 && localY <= obj.height / 2) {
            clickedObjId = obj.id;
            break;
        }
    }

    if (clickedObjId) {
        setSelectedObjectId(clickedObjId);
        setCanvasObjects(prev => prev.map(o => ({ ...o, isSelected: o.id === clickedObjId })));
        handleGenerate();
    } else {
        handleResetView();
    }
  };

  const handleGenerate = async () => {
    if (!canvasRef.current || !bgImage) return;

    const remainingCalls = Math.max(0, MAX_FREE_API_CALLS - config.apiCallCount);
    let apiKeyToUse = '';

    if (remainingCalls > 0) {
      apiKeyToUse = DEFAULT_API_KEY;
      if (!apiKeyToUse) {
        console.error('System Error: Default API key not found in environment.');
        showToast('error', 'System configuration error');
        return;
      }
    } else {
      if (config.userApiKey) {
        apiKeyToUse = config.userApiKey;
      } else {
        showToast('info', t.apiLimitWait);
        setShowSettings(true);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = bgImage.width;
      exportCanvas.height = bgImage.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");

      ctx.drawImage(bgImage, 0, 0);
      canvasObjects.forEach(obj => {
          ctx.save();
          ctx.translate(obj.x, obj.y);
          ctx.rotate((obj.rotation * Math.PI) / 180);
          ctx.drawImage(obj.image, -obj.width/2, -obj.height/2, obj.width, obj.height);
          ctx.restore();
      });

      const dataUrl = exportCanvas.toDataURL('image/jpeg', 0.9);
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');

      const resultBase64 = await generateFusion(apiKeyToUse, base64Data);

      const newImg = new Image();
      newImg.onload = () => {
        setBgImage(newImg);
        setCanvasObjects([]); 
        setIsProcessing(false);
        onUpdateConfig({ apiCallCount: config.apiCallCount + 1 });
        addToHistory([], newImg.src);
        showToast('success', t.genSuccess);
      };
      newImg.src = `data:image/jpeg;base64,${resultBase64}`;

    } catch (error) {
      console.error("Fusion failed:", error);
      setIsProcessing(false);
      showToast('error', t.genFail);
    }
  };
  
  const handleDownload = () => {
      if (!bgImage) return;
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = bgImage.width;
      exportCanvas.height = bgImage.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(bgImage, 0, 0);
      canvasObjects.forEach(obj => {
          ctx.save();
          ctx.translate(obj.x, obj.y);
          ctx.rotate((obj.rotation * Math.PI) / 180);
          ctx.globalCompositeOperation = 'multiply';
          ctx.globalAlpha = 0.9;
          ctx.drawImage(obj.image, -obj.width/2, -obj.height/2, obj.width, obj.height);
          ctx.restore();
      });

      const link = document.createElement('a');
      link.download = `inkpreview_${Date.now()}.jpg`;
      link.href = exportCanvas.toDataURL('image/jpeg', 0.9);
      link.click();
      showToast('success', t.downloadSuccess);
  };

  const isMobile = config.deviceMode === DeviceMode.MOBILE;
  const layoutClass = isMobile ? "flex-col" : "flex-row";
  const galleryClass = isMobile ? "w-full h-[40%] border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30" : "w-[30%] min-w-[300px] h-full border-l border-border z-20";

  const remainingCallsDisplay = Math.max(0, MAX_FREE_API_CALLS - config.apiCallCount);
  const hasUserKey = !!config.userApiKey;

  const handleTattooDragStart = (e: React.DragEvent, tattoo: Tattoo) => {
    e.dataTransfer.setData('tattoo', JSON.stringify(tattoo));
    e.dataTransfer.effectAllowed = 'copy';
    const img = new Image();
    img.src = tattoo.imageBase64;
    img.onload = () => {
        previewImageRef.current = img;
        setDragPreviewTattoo(tattoo);
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragPreviewTattoo && canvasRef.current && bgImage) {
        e.dataTransfer.dropEffect = 'copy';
        const rect = canvasRef.current.getBoundingClientRect();
        setDragOverPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    } else {
        e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPos(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tattooData = e.dataTransfer.getData('tattoo');
    if (tattooData) {
        handleDropTattoo(e, tattooData);
        return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePhotoUpload(e.dataTransfer.files[0]);
    }
    setDragOverPos(null);
  };

  const handleDeleteOrReset = () => {
    // 1. 如果有选中的对象，则执行删除
    if (selectedObjectId) {
      const nextObjects = canvasObjects.filter(obj => obj.id !== selectedObjectId);
      setCanvasObjects(nextObjects);
      setSelectedObjectId(null);
      // 添加到历史记录
      addToHistory(nextObjects, bgImage ? bgImage.src : null);
      return;
    }

    // 2. 否则，执行原来的重置（清空）逻辑
    if (canvasObjects.length === 0 && !bgImage) return;
    if (window.confirm(t.confirmReset)) {
        setCanvasObjects([]);
        setSelectedObjectId(null);
        if (bgImage) {
             const resetHistory = [{ objects: [], bgImageSrc: bgImage.src }];
             setHistory(resetHistory);
             setHistoryIndex(0);
        } else {
            setHistory([]);
            setHistoryIndex(-1);
        }
    }
  };

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className={`flex h-screen w-full bg-background text-txt-primary font-sans overflow-hidden ${layoutClass}`}>
      <Toast message={toast} onClose={() => setToast(null)} />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        language={language}
        config={config}
        onUpdateConfig={onUpdateConfig}
      />

      {/* 新手引导覆盖层 */}
      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                <h3 className="text-2xl font-bold mb-6 text-txt-primary">{t.guideTitle}</h3>
                <ul className="space-y-4 text-txt-secondary mb-8">
                    <li className="flex items-center gap-3"><span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>{t.guideStep1}</li>
                    <li className="flex items-center gap-3"><span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>{t.guideStep2}</li>
                    <li className="flex items-center gap-3"><span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>{t.guideStep3}</li>
                    <li className="flex items-center gap-3"><span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>{t.guideStep4}</li>
                </ul>
                <button onClick={closeGuide} className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-hover transition-colors">
                    {t.gotIt}
                </button>
            </div>
        </div>
      )}

      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
      />

      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Toolbar */}
        <div className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 hover:bg-surface-highlight rounded-full text-txt-secondary transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <span className="font-bold text-txt-primary hidden sm:block">WorkBench</span>
            
            {/* 版本标识 */}
            <span className="text-xs bg-surface-highlight text-txt-secondary px-2 py-0.5 rounded ml-1 border border-border font-medium whitespace-nowrap">
              {isMobile ? t.mobileMode : t.webMode}
            </span>

            {/* API 剩余次数显示 */}
            {hasUserKey ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded ml-1 border border-green-200 font-medium whitespace-nowrap hidden sm:inline-block">
                Pro
              </span>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded ml-1 border font-medium whitespace-nowrap hidden sm:inline-block ${remainingCallsDisplay > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {remainingCallsDisplay}/{MAX_FREE_API_CALLS}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             {bgImage && (
                 <>
                   {/* 历史记录：回退按钮 */}
                   <button
                     onClick={handleUndo}
                     disabled={historyIndex <= 0}
                     className={`p-2 rounded-lg transition-colors ${
                       historyIndex <= 0 ? 'text-txt-muted cursor-not-allowed' : 'text-txt-secondary hover:text-primary hover:bg-surface-highlight'
                     }`}
                     title={t.undo}
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                   </button>

                   {/* 历史记录：前进按钮 */}
                   <button
                     onClick={handleRedo}
                     disabled={historyIndex >= history.length - 1}
                     className={`p-2 rounded-lg transition-colors ${
                       historyIndex >= history.length - 1 ? 'text-txt-muted cursor-not-allowed' : 'text-txt-secondary hover:text-primary hover:bg-surface-highlight'
                     }`}
                     title={t.redo}
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                   </button>
                   
                   <div className="h-6 w-px bg-divider mx-1 hidden sm:block"></div>

                   <button 
                     onClick={handleResetView}
                     className="p-2 text-txt-secondary hover:text-primary hover:bg-surface-highlight rounded-lg transition-colors hidden sm:block"
                     title={t.resetView}
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                   </button>
                   <button 
                     onClick={handleDeleteOrReset}
                     className={`p-2 rounded-lg transition-colors ${
                       selectedObjectId 
                         ? 'text-red-500 bg-red-50 hover:bg-red-100 ring-1 ring-red-200' 
                         : 'text-txt-secondary hover:text-red-500 hover:bg-red-50'
                     }`}
                     title={selectedObjectId ? t.delete : t.reset}
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                   <button 
                     onClick={handleDownload}
                     className="p-2 text-txt-secondary hover:text-primary hover:bg-surface-highlight rounded-lg transition-colors"
                     title={t.download}
                   >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                   </button>
                 </>
             )}

             <button onClick={() => setShowSettings(true)} className="p-2 text-txt-secondary hover:text-primary hover:bg-surface-highlight rounded-lg transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </button>
             
             <button 
               onClick={handleGenerate}
               disabled={!bgImage || canvasObjects.length === 0 || isProcessing}
               className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${
                 !bgImage || canvasObjects.length === 0 ? 'bg-divider cursor-not-allowed' : 'bg-primary hover:bg-primary-hover hover:shadow-md active:scale-95'
               }`}
             >
               {isProcessing ? (
                   <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="hidden sm:inline">{t.processing}</span>
                   </>
               ) : (
                   <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>{t.generate}</span>
                   </>
               )}
             </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="flex-1 bg-background flex items-center justify-center p-4 relative overflow-hidden touch-none"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onWheel={handleWheel} // 绑定滚轮事件
        >
          {/* 照片/AI处理加载层 */}
          {(isPhotoLoading || isProcessing) && (
            <div className="absolute inset-0 bg-surface/80 z-40 flex flex-col items-center justify-center backdrop-blur-sm">
               <svg className="animate-spin h-10 w-10 text-primary mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               <span className="text-txt-secondary font-medium">{isProcessing ? t.processing : t.processingImage}</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            id="photo-canvas"
            className="bg-white shadow-xl max-w-full max-h-full cursor-crosshair touch-none transition-shadow duration-300"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          />
          
          {!bgImage && !isPhotoLoading && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10 hover:bg-black/5 transition-colors group"
              onClick={triggerFileSelect}
            >
                <div className={`bg-surface rounded-full shadow-xl text-primary font-bold group-hover:scale-105 active:scale-95 transition-transform border border-blue-50 flex items-center gap-3 ${isMobile ? 'px-8 py-6 text-lg' : 'px-8 py-4'}`}>
                  <svg className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>{t.uploadTitle}</span>
                </div>
                <p className="mt-4 text-txt-muted text-sm font-medium">{t.uploadDesc}</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${galleryClass} z-20 bg-surface transition-all duration-300`}>
        <TattooGallery 
            language={language} 
            onDragStart={handleTattooDragStart} 
            onTattooClick={handleTattooClick}
            isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default WorkBench;