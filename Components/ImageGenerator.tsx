

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateImage, editImage, inpaintImage, removeBackground, createChatSession, generateInitialVideo, extendVideo, createBasicChatSession, transcribeAudio } from '../services/geminiService';
import { rgbToHsl, hslToRgb } from '../utils/colorUtils';
import { getChatHistory, saveChatHistory, saveCreation, clearChatHistory } from '../utils/storage';
import type { Chat } from '@google/genai';


// Components
import ShareModal from './ShareModal';

// Icons
import LoadingSpinner from './LoadingSpinner';
import WandIcon from './icons/WandIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import AdjustIcon from './icons/AdjustIcon';
import SunIcon from './icons/SunIcon';
import ColorSwatchIcon from './icons/ColorSwatchIcon';
import SparklesIcon from './icons/SparklesIcon';
import TransformIcon from './icons/TransformIcon';
import BrushIcon from './icons/BrushIcon';
import FaceIcon from './icons/FaceIcon';
import CropIcon from './icons/CropIcon';
import ArrowsExpandIcon from './icons/ArrowsExpandIcon';
import EraserIcon from './icons/EraserIcon';
import ReplyIcon from './icons/ReplyIcon';
import BackgroundRemoveIcon from './icons/BackgroundRemoveIcon';
import ShareIcon from './icons/ShareIcon';
import SendIcon from './icons/SendIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import PhoneIcon from './icons/PhoneIcon';
import PlayIcon from './icons/PlayIcon';
import UndoIcon from './icons/UndoIcon';
import RedoIcon from './icons/RedoIcon';
import VideoIcon from './icons/VideoIcon';
import XCircleIcon from './icons/XCircleIcon';

interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

declare global {
    interface Window {
        aistudio?: AIStudio;
    }
}

const initialAdjustments = { brightness: 100, contrast: 100, saturate: 100, temperature: 0, tint: 0, blur: 0, vignette: 0, grain: 0, noiseReduction: 0 };
const initialPortraitAdjustments = { smoothing: 0, blemishes: 0, slimming: 0 };
const initialHslAdjustments = { red: {h:0,s:0,l:0}, orange: {h:0,s:0,l:0}, yellow: {h:0,s:0,l:0}, green: {h:0,s:0,l:0}, aqua: {h:0,s:0,l:0}, blue: {h:0,s:0,l:0}, purple: {h:0,s:0,l:0}, magenta: {h:0,s:0,l:0} };
const initialSplitToning = { highlights: { color: '#ffffff', saturation: 0 }, shadows: { color: '#000000', saturation: 0 }, balance: 0 };
const filters = [
    { name: 'None', style: {} },
    { name: 'Vintage', style: { filter: 'sepia(0.5) contrast(0.9) brightness(1.1)' } },
    { name: 'Noir', style: { filter: 'grayscale(1) contrast(1.2)' } },
    { name: 'Sepia', style: { filter: 'sepia(0.8)' } },
    { name: 'Lomo', style: { filter: 'contrast(1.4) saturate(1.1)' } },
    { name: 'Technicolor', style: { filter: 'contrast(1.5) saturate(1.5) hue-rotate(-20deg)' } },
    { name: 'Polaroid', style: { filter: 'contrast(1.2) brightness(1.1) sepia(0.3)' } },
    { name: 'Cali', style: { filter: 'saturate(1.2) contrast(1.1)' } },
    { name: 'Drift', style: { filter: 'contrast(1.3) brightness(0.9) hue-rotate(-10deg)' } },
    { name: 'Crimson', style: { filter: 'saturate(1.3) hue-rotate(-15deg) contrast(1.1)' } }
];

type HslColor = keyof typeof initialHslAdjustments;
type ChatMessage = {
    role: 'user' | 'model';
    text?: string;
    imageUrl?: string;
    imageName?: string;
    audioUrl?: string;
};
type StorySegment = { id: number; prompt: string; duration: number };

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string)?.split(',')[1];
            if (base64String) {
                resolve(base64String);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const ImageGenerator: React.FC = () => {
    const [generationMode, setGenerationMode] = useState<'image' | 'video'>('image');
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [activeSubTool, setActiveSubTool] = useState<string | null>(null);

    const [prompt, setPrompt] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
    const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);
    
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modes
    const [isInpaintingMode, setIsInpaintingMode] = useState(false);
    const [isCroppingMode, setIsCroppingMode] = useState(false);
    const [isBackgroundRemoved, setIsBackgroundRemoved] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    // Background removal state
    const [foregroundImageUrl, setForegroundImageUrl] = useState<string | null>(null);
    const [preRemovalImageUrl, setPreRemovalImageUrl] = useState<string | null>(null);
    const [bgPrompt, setBgPrompt] = useState('');

    // Inpainting State
    const [brushSize, setBrushSize] = useState(30);
    const [brushHardness, setBrushHardness] = useState(50);
    const [brushOpacity, setBrushOpacity] = useState(100);
    const [hasMask, setHasMask] = useState(false);
    const [inpaintingStep, setInpaintingStep] = useState<'masking' | 'preview'>('masking');
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const lastMousePosition = useRef<{ x: number; y: number } | null>(null);
    
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const processingCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    
    // State
    const [adjustments, setAdjustments] = useState(initialAdjustments);
    const [portraitAdjustments, setPortraitAdjustments] = useState(initialPortraitAdjustments);
    const [hslAdjustments, setHslAdjustments] = useState(initialHslAdjustments);
    const [splitToning, setSplitToning] = useState(initialSplitToning);
    const [activeFilter, setActiveFilter] = useState(filters[0]);
    
    // Crop state
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const cropDragStart = useRef<{ x: number, y: number, boxX: number, boxY: number, boxW: number, boxH: number, handle: string | null } | null>(null);
    const [cropAspectRatio, setCropAspectRatio] = useState<number | null>(null);
    
    // Resize state
    const [resizeDimensions, setResizeDimensions] = useState({ width: 0, height: 0 });
    const [lockAspectRatio, setLockAspectRatio] = useState(true);

    // Chat State
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [imageToSend, setImageToSend] = useState<{ file: File; previewUrl: string } | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // Video State
    const [characterDescriptions, setCharacterDescriptions] = useState('');
    const [storySegments, setStorySegments] = useState<StorySegment[]>([{ id: Date.now(), prompt: '', duration: 15 }]);
    const [generatedClips, setGeneratedClips] = useState<{id: number, url: string}[]>([]);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [generationProgress, setGenerationProgress] = useState({ message: '', percentage: 0, segment: 0, total: 0 });
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [lastVideoOperation, setLastVideoOperation] = useState<any>(null);

    const updateChatHistory = (newHistory: ChatMessage[]) => {
        setChatHistory(newHistory);
        saveChatHistory(newHistory);
    };
    
    const addNewHistoryState = (imageUrl: string) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(imageUrl);
        setHistory(newHistory);
        const newIndex = newHistory.length - 1;
        setHistoryIndex(newIndex);
        setSourceImageUrl(imageUrl);
        saveCreation(imageUrl);
        resetAllAdjustments();
    };

    const resetWithNewImage = (imageUrl: string) => {
        setHistory([imageUrl]);
        setHistoryIndex(0);
        setSourceImageUrl(imageUrl);
        saveCreation(imageUrl);
        resetAllAdjustments();
    };

    useEffect(() => {
        if (generationMode === 'video') {
            window.aistudio?.hasSelectedApiKey().then(setIsApiKeySelected);
        }
    }, [generationMode]);

    useEffect(() => {
        const initChat = async () => {
            const savedHistory = getChatHistory();
            setIsChatLoading(true);
            try {
                const session = await createBasicChatSession();
                setChatSession(session);
                if (savedHistory && savedHistory.length > 0) {
                    setChatHistory(savedHistory);
                } else {
                    const firstMessage = await session.sendMessage({ message: "Hello" });
                    updateChatHistory([{ role: 'model', text: firstMessage.text }]);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not start chat.');
            } finally {
                setIsChatLoading(false);
            }
        };
        initChat();
    }, []);

    useEffect(() => {
        if (!sourceImageUrl) {
            return;
        }
        const initImageChat = async () => {
            setIsChatLoading(true);
            clearChatHistory();
            try {
                const session = await createChatSession(sourceImageUrl);
                setChatSession(session);
                const newHistory: ChatMessage[] = [{ role: 'model', text: "Great! I see the image. I'm ready to help. What would you like to do with it?" }];
                updateChatHistory(newHistory);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not start chat.');
            } finally {
                setIsChatLoading(false);
            }
        };
        initImageChat();
        setGeneratedClips([]);
    }, [sourceImageUrl]);

    useEffect(() => {
        if (!sourceImageUrl) { setDisplayedImageUrl(null); return; }
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.src = sourceImageUrl;
        image.onload = () => {
            const canvas = processingCanvasRef.current; if (!canvas) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
            canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
            ctx.filter = [`brightness(${adjustments.brightness}%)`,`contrast(${adjustments.contrast}%)`,`saturate(${adjustments.saturate}%)`,`blur(${adjustments.blur}px)`].join(' ');
            ctx.drawImage(image, 0, 0);
            ctx.filter = 'none';
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i], g = data[i + 1], b = data[i + 2];
                const [h, s, l] = rgbToHsl(r, g, b);
                const hue = h * 360;
                let targetColor: HslColor | null = null;
                if (hue >= 345 || hue < 15) targetColor = 'red'; else if (hue < 45) targetColor = 'orange'; else if (hue < 75) targetColor = 'yellow'; else if (hue < 165) targetColor = 'green'; else if (hue < 205) targetColor = 'aqua'; else if (hue < 255) targetColor = 'blue'; else if (hue < 285) targetColor = 'purple'; else if (hue < 345) targetColor = 'magenta';
                if (targetColor) { const adj = hslAdjustments[targetColor]; const newH = (h + adj.h / 360); const newS = Math.max(0, Math.min(1, s * (1 + adj.s / 100))); const newL = Math.max(0, Math.min(1, l * (1 + adj.l / 100))); [r,g,b] = hslToRgb(newH, newS, newL); }
                data[i] = r; data[i + 1] = g; data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);
            setDisplayedImageUrl(canvas.toDataURL());
        };
    }, [sourceImageUrl, adjustments, hslAdjustments]);

    useEffect(() => {
        if (!sourceImageUrl) return;
        const image = new Image();
        image.src = sourceImageUrl;
        image.onload = () => {
             if (isCroppingMode) { 
                const container = imageContainerRef.current; 
                if (container) { 
                    setCropBox({ x: container.offsetWidth * 0.1, y: container.offsetHeight * 0.1, width: container.offsetWidth * 0.8, height: container.offsetHeight * 0.8 }); 
                } 
            }
            if (activeSubTool === 'resize') { 
                setResizeDimensions({width: image.naturalWidth, height: image.naturalHeight}); 
            }
        };
    }, [sourceImageUrl, isCroppingMode, activeSubTool]);

    useEffect(() => { if (chatHistoryRef.current) { chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight; } }, [chatHistory]);

    const resetAllAdjustments = () => { setAdjustments(initialAdjustments); setPortraitAdjustments(initialPortraitAdjustments); setHslAdjustments(initialHslAdjustments); setSplitToning(initialSplitToning); setActiveFilter(filters[0]); };
    const handleGenerate = useCallback(async () => { if (!prompt.trim()) return; setIsLoading(true); setError(null); setGeneratedClips([]); try { const imageUrl = await generateImage(prompt); resetWithNewImage(imageUrl); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred.'); } finally { setIsLoading(false); } }, [prompt]);
    const handleEdit = useCallback(async () => { if (!editPrompt.trim() || !sourceImageUrl) return; setIsLoading(true); setError(null); setGeneratedClips([]); try { const imageUrl = await editImage(sourceImageUrl, editPrompt); addNewHistoryState(imageUrl); setEditPrompt(''); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred.'); } finally { setIsLoading(false); } }, [editPrompt, sourceImageUrl, history, historyIndex]);
    const handleDownload = () => { const url = generatedClips[generatedClips.length - 1]?.url || displayedImageUrl || sourceImageUrl; if (!url) return; const a = document.createElement('a'); a.href = url; a.download = url.startsWith('blob:') ? `trigger-ai-video-${Date.now()}.mp4` : `trigger-ai-image-${Date.now()}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (e) => { const result = e.target?.result as string; resetWithNewImage(result); }; reader.readAsDataURL(file); } };
    const triggerFileInput = () => fileInputRef.current?.click();
    const handleShare = () => { if (displayedImageUrl || sourceImageUrl || generatedClips.length > 0) { setIsShareModalOpen(true); } };
    
    const handleStartOver = async () => {
        setSourceImageUrl(null);
        setHistory([]);
        setHistoryIndex(-1);
        resetAllAdjustments();
        setGeneratedClips([]);
        setLastVideoOperation(null);
        setStorySegments([{ id: Date.now(), prompt: '', duration: 15 }]);
        setCharacterDescriptions('');
        setIsChatLoading(true);
        clearChatHistory();
        try {
            const session = await createBasicChatSession();
            setChatSession(session);
            const firstMessage = await session.sendMessage({ message: "Hello" });
            updateChatHistory([{ role: 'model', text: firstMessage.text }]);
        } catch (err) { setError(err instanceof Error ? err.message : 'Could not start chat.'); } finally { setIsChatLoading(false); }
    };

    // Video Logic Handlers
    const addSegment = () => { setStorySegments([...storySegments, { id: Date.now(), prompt: '', duration: 15 }]); };
    const removeSegment = (id: number) => { setStorySegments(storySegments.filter(segment => segment.id !== id)); };
    const updateSegment = (id: number, updatedProps: Partial<StorySegment>) => { setStorySegments(storySegments.map(segment => segment.id === id ? { ...segment, ...updatedProps } : segment)); };
    const handleSelectApiKey = async () => { try { await window.aistudio.openSelectKey(); setIsApiKeySelected(true); setError(null); } catch (e) { console.error("API Key selection failed", e); setError("You must select an API key to generate videos."); } };
    
    const handleGenerateStory = async () => {
        if (!storySegments.some(s => s.prompt.trim())) { setError("Please enter a prompt for at least one story segment."); return; }
        setIsGeneratingStory(true);
        setError(null);
        setGeneratedClips([]);
        let currentLastOp: any = null;
        const clips: {id: number, url: string}[] = [];
        const fullContextPrompt = (segmentPrompt: string) => {
            if (characterDescriptions.trim()) { return `Character Descriptions:\n${characterDescriptions}\n\nStory:\n${segmentPrompt}`; }
            return segmentPrompt;
        };

        for (let i = 0; i < storySegments.length; i++) {
            const segment = storySegments[i];
            setGenerationProgress({ message: `Starting segment ${i + 1}...`, percentage: 0, segment: i + 1, total: storySegments.length });
            
            try {
                let result;
                const onProgress = (progress: { message: string, percentage: number }) => setGenerationProgress({ ...progress, segment: i + 1, total: storySegments.length });

                if (i === 0 || !currentLastOp) {
                    result = await generateInitialVideo(fullContextPrompt(segment.prompt), segment.duration, onProgress, sourceImageUrl);
                } else {
                    result = await extendVideo(currentLastOp, fullContextPrompt(segment.prompt), segment.duration, onProgress);
                }
                
                const { videoUrl, operation } = result;
                clips.push({ id: segment.id, url: videoUrl });
                setGeneratedClips([...clips]);
                currentLastOp = operation;
                setLastVideoOperation(operation);
                saveCreation(videoUrl);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred during generation.';
                setError(`Failed on segment ${i + 1}: ${errorMessage}`);
                if (errorMessage.includes('API key')) { setIsApiKeySelected(false); }
                setIsGeneratingStory(false);
                return;
            }
        }
        setIsGeneratingStory(false);
        setGenerationProgress({ message: 'Finished!', percentage: 100, segment: storySegments.length, total: storySegments.length });
    };

    // Other handlers... (omitted for brevity, no changes)
    const handleApplyPortraitAi = async () => { if (!sourceImageUrl) return; const prompt = "Perform a photorealistic portrait retouch. " + (portraitAdjustments.smoothing > 0 ? `Apply skin smoothing at ${portraitAdjustments.smoothing}%. ` : '') + (portraitAdjustments.blemishes > 0 ? `Remove blemishes at ${portraitAdjustments.blemishes}%. ` : '') + (portraitAdjustments.slimming > 0 ? `Slim the face by ${portraitAdjustments.slimming}%. ` : '') + "Keep it natural."; setIsLoading(true); setError(null); setGeneratedClips([]); try { const imageUrl = await editImage(sourceImageUrl, prompt); addNewHistoryState(imageUrl); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred.'); } finally { setIsLoading(false); } };
    const handleApplyNoiseReduction = async () => { if (!sourceImageUrl || adjustments.noiseReduction === 0) return; const prompt = `Perform intelligent noise reduction on this image at an intensity of ${adjustments.noiseReduction}%. Focus on preserving fine details and textures while removing unwanted grain.`; setIsLoading(true); setError(null); setGeneratedClips([]); try { const imageUrl = await editImage(sourceImageUrl, prompt); addNewHistoryState(imageUrl); setAdjustments(prev => ({ ...prev, noiseReduction: 0 })); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred during noise reduction.'); } finally { setIsLoading(false); } };
    const handleSendMessage = async () => { if ((!chatInput.trim() && !imageToSend) || !chatSession || isChatLoading) return; const userMessage: ChatMessage = { role: 'user' }; let apiText = chatInput.trim(); if (imageToSend) { userMessage.imageUrl = imageToSend.previewUrl; userMessage.imageName = imageToSend.file.name; apiText = `${apiText} [User shared an image: ${imageToSend.file.name}]`.trim(); } if (chatInput.trim()) { userMessage.text = chatInput.trim(); } const newHistory = [...chatHistory, userMessage]; updateChatHistory(newHistory); setChatInput(''); setImageToSend(null); setIsChatLoading(true); try { const response = await chatSession.sendMessage({ message: apiText }); const modelResponse = response.text; if (modelResponse) { updateChatHistory([...newHistory, { role: 'model', text: modelResponse }]); } else { updateChatHistory([...newHistory, { role: 'model', text: "Sorry, I couldn't process that. Try asking in a different way." }]); } } catch (err) { const errorMessage = err instanceof Error ? err.message : 'An error occurred with the chat.'; updateChatHistory([...newHistory, { role: 'model', text: `Error: ${errorMessage}` }]); } finally { setIsChatLoading(false); } };
    const handleChatFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file && file.type.startsWith('image/')) { const previewUrl = URL.createObjectURL(file); setImageToSend({ file, previewUrl }); } event.target.value = ''; };
    const handleToggleRecording = async () => { if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); } else { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' }); mediaRecorderRef.current = mediaRecorder; const audioChunks: Blob[] = []; mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); }; mediaRecorder.onstop = async () => { const audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); const audioUrl = URL.createObjectURL(audioBlob); const userMessage: ChatMessage = { role: 'user', audioUrl }; const newHistory = [...chatHistory, userMessage]; updateChatHistory(newHistory); setIsChatLoading(true); try { const base64Audio = await blobToBase64(audioBlob); const transcription = await transcribeAudio(base64Audio, audioBlob.type); const updatedHistoryWithTranscription = newHistory.map((msg, index) => index === newHistory.length - 1 ? { ...msg, text: `"${transcription}"` } : msg ); updateChatHistory(updatedHistoryWithTranscription); if (chatSession) { const response = await chatSession.sendMessage({ message: transcription }); const modelResponse = response.text; if (modelResponse) { updateChatHistory([...updatedHistoryWithTranscription, { role: 'model', text: modelResponse }]); } else { updateChatHistory([...updatedHistoryWithTranscription, { role: 'model', text: "Sorry, I couldn't process that." }]); } } } catch (err) { const errorMessage = err instanceof Error ? err.message : 'Audio transcription failed.'; const updatedHistoryWithError = newHistory.map((msg, index) => index === newHistory.length - 1 ? { ...msg, text: `(Audio could not be transcribed: ${errorMessage})` } : msg ); updateChatHistory(updatedHistoryWithError); } finally { setIsChatLoading(false); stream.getTracks().forEach(track => track.stop()); } }; mediaRecorder.start(); setIsRecording(true); } catch (err) { console.error("Error accessing microphone:", err); setError("Microphone access was denied. Please allow it in your browser settings."); } } };
    const handleCancelBgRemoval = () => { if (preRemovalImageUrl) { setSourceImageUrl(preRemovalImageUrl); } setIsBackgroundRemoved(false); setForegroundImageUrl(null); setPreRemovalImageUrl(null); setBgPrompt(''); };
    const handleRemoveBackground = async () => { if (!sourceImageUrl) return; setIsLoading(true); setError(null); setGeneratedClips([]); try { setPreRemovalImageUrl(sourceImageUrl); const resultUrl = await removeBackground(sourceImageUrl); setForegroundImageUrl(resultUrl); addNewHistoryState(resultUrl); setIsBackgroundRemoved(true); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred during background removal.'); setPreRemovalImageUrl(null); } finally { setIsLoading(false); } };
    const handleGenerateAndCompositeBackground = async () => { if (!bgPrompt.trim() || !foregroundImageUrl) return; setIsLoading(true); setError(null); setGeneratedClips([]); const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = 'Anonymous'; img.onload = () => resolve(img); img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`)); img.src = src; }); try { const backgroundUrl = await generateImage(bgPrompt); const [bgImg, fgImg] = await Promise.all([loadImage(backgroundUrl), loadImage(foregroundImageUrl)]); const canvas = processingCanvasRef.current; if (!canvas) throw new Error("Canvas not found for compositing."); canvas.width = bgImg.naturalWidth; canvas.height = bgImg.naturalHeight; const ctx = canvas.getContext('2d'); if (!ctx) throw new Error("Could not get canvas context."); ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); const fgRatio = fgImg.naturalWidth / fgImg.naturalHeight; const bgRatio = canvas.width / canvas.height; let drawWidth, drawHeight; if (fgRatio > bgRatio) { drawWidth = canvas.width; drawHeight = drawWidth / fgRatio; } else { drawHeight = canvas.height; drawWidth = drawHeight * fgRatio; } const x = (canvas.width - drawWidth) / 2; const y = (canvas.height - drawHeight) / 2; ctx.drawImage(fgImg, x, y, drawWidth, drawHeight); const compositeUrl = canvas.toDataURL('image/png'); addNewHistoryState(compositeUrl); handleCancelBgRemoval(); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred while creating the background.'); } finally { setIsLoading(false); } };
    const isMaskCanvasEmpty = useCallback((): boolean => { const canvas = maskCanvasRef.current; if (!canvas) return true; const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return true; const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer); return !pixelBuffer.some(color => color !== 0); }, []);
    const handleClearMask = useCallback(() => { const canvas = maskCanvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.clearRect(0, 0, canvas.width, canvas.height); setHasMask(false); }, []);
    const handleOpenInpainting = () => { if (!imageRef.current || !maskCanvasRef.current) return; const image = imageRef.current; const canvas = maskCanvasRef.current; canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; handleClearMask(); setIsInpaintingMode(true); };
    const handleCloseInpainting = useCallback(() => { setIsInpaintingMode(false); setInpaintingStep('masking'); setPreviewImageUrl(null); handleClearMask(); }, [handleClearMask]);
    const handlePreviewInpainting = useCallback(async () => { if (!sourceImageUrl || !maskCanvasRef.current || isMaskCanvasEmpty()) return; setIsLoading(true); setError(null); setGeneratedClips([]); try { const maskDataUrl = maskCanvasRef.current.toDataURL(); const resultUrl = await inpaintImage(sourceImageUrl, maskDataUrl); setPreviewImageUrl(resultUrl); setInpaintingStep('preview'); } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred during inpainting.'); } finally { setIsLoading(false); } }, [sourceImageUrl, isMaskCanvasEmpty]);
    const handleApplyInpainting = () => { if (!previewImageUrl) return; addNewHistoryState(previewImageUrl); handleCloseInpainting(); };
    const handleBackToMasking = () => { setPreviewImageUrl(null); setInpaintingStep('masking'); };
    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>): { x: number, y: number } | null => { const canvas = maskCanvasRef.current; if (!canvas) return null; const rect = canvas.getBoundingClientRect(); const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height; return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY, }; };
    const drawOnCanvas = (x: number, y: number) => { const canvas = maskCanvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.globalAlpha = brushOpacity / 100; const gradient = ctx.createRadialGradient(x, y, 0, x, y, brushSize / 2); const hardnessStop = Math.max(0.01, brushHardness / 100); gradient.addColorStop(0, 'rgba(239, 68, 68, 1)'); gradient.addColorStop(hardnessStop, 'rgba(239, 68, 68, 1)'); gradient.addColorStop(1, 'rgba(239, 68, 68, 0)'); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2); ctx.fill(); };
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => { isDrawing.current = true; const pos = getCanvasCoordinates(e); if (pos) { lastMousePosition.current = pos; drawOnCanvas(pos.x, pos.y); } };
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => { if (!isDrawing.current) return; const pos = getCanvasCoordinates(e); if (pos && lastMousePosition.current) { const dist = Math.hypot(pos.x - lastMousePosition.current.x, pos.y - lastMousePosition.current.y); const angle = Math.atan2(pos.y - lastMousePosition.current.y, pos.x - lastMousePosition.current.x); for (let i = 0; i < dist; i+= 1) { const x = lastMousePosition.current.x + Math.cos(angle) * i; const y = lastMousePosition.current.y + Math.sin(angle) * i; drawOnCanvas(x, y); } lastMousePosition.current = pos; } };
    const handleCanvasMouseUp = () => { isDrawing.current = false; lastMousePosition.current = null; setHasMask(!isMaskCanvasEmpty()); };
    const handleSetSubTool = (tool: string) => { setIsCroppingMode(tool === 'crop'); if (tool === 'crop' && imageContainerRef.current) { const { offsetWidth: w, offsetHeight: h } = imageContainerRef.current; setCropBox({ x: w * 0.1, y: h * 0.1, width: w * 0.8, height: h * 0.8 }); } setActiveSubTool(tool); };
    const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, handle: string | null) => { e.preventDefault(); e.stopPropagation(); if (!imageContainerRef.current) return; const rect = imageContainerRef.current.getBoundingClientRect(); cropDragStart.current = { x: e.clientX, y: e.clientY, boxX: cropBox.x, boxY: cropBox.y, boxW: cropBox.width, boxH: cropBox.height, handle }; window.addEventListener('mousemove', handleCropMouseMove); window.addEventListener('mouseup', handleCropMouseUp); };
    const handleCropMouseMove = useCallback((e: MouseEvent) => { if (!cropDragStart.current || !imageContainerRef.current) return; const { x, y, boxX, boxY, boxW, boxH, handle } = cropDragStart.current; let dx = e.clientX - x; let dy = e.clientY - y; let newX = boxX, newY = boxY, newW = boxW, newH = boxH; if (handle && handle.includes('r')) newW += dx; if (handle && handle.includes('l')) { newW -= dx; newX += dx; } if (handle && handle.includes('b')) newH += dy; if (handle && handle.includes('t')) { newH -= dy; newY += dy; } if (handle === null) { newX += dx; newY += dy; } const { offsetWidth: containerW, offsetHeight: containerH } = imageContainerRef.current; newW = Math.min(Math.max(20, newW), containerW - newX); newH = Math.min(Math.max(20, newH), containerH - newY); newX = Math.max(0, newX); newY = Math.max(0, newY); if (newX + newW > containerW) newW = containerW - newX; if (newY + newH > containerH) newH = containerH - newY; if (cropAspectRatio) { if (handle === 'tl' || handle === 'br' || handle === 'tr' || handle === 'bl') newH = newW / cropAspectRatio; else newW = newH * cropAspectRatio; } setCropBox({ x: newX, y: newY, width: newW, height: newH }); }, [cropAspectRatio]);
    const handleCropMouseUp = useCallback(() => { cropDragStart.current = null; window.removeEventListener('mousemove', handleCropMouseMove); window.removeEventListener('mouseup', handleCropMouseUp); }, [handleCropMouseMove]);
    const handleApplyCrop = () => { if (!imageRef.current || !imageContainerRef.current || !sourceImageUrl) return; const img = imageRef.current; const container = imageContainerRef.current; const scaleX = img.naturalWidth / img.width; const scaleY = img.naturalHeight / img.height; const offsetX = (container.offsetWidth - img.width) / 2; const offsetY = (container.offsetHeight - img.height) / 2; const sourceX = (cropBox.x - offsetX) * scaleX; const sourceY = (cropBox.y - offsetY) * scaleY; const sourceWidth = cropBox.width * scaleX; const sourceHeight = cropBox.height * scaleY; const canvas = processingCanvasRef.current; if (!canvas) return; canvas.width = sourceWidth; canvas.height = sourceHeight; const ctx = canvas.getContext('2d'); if (!ctx) return; const sourceImg = new Image(); sourceImg.crossOrigin = "Anonymous"; sourceImg.onload = () => { ctx.drawImage(sourceImg, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight); addNewHistoryState(canvas.toDataURL()); setIsCroppingMode(false); setActiveSubTool(null); setGeneratedClips([]); }; sourceImg.src = sourceImageUrl; };
    const handleResizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const {name, value} = e.target; if (!imageRef.current) return; const {naturalWidth, naturalHeight} = imageRef.current; const originalAspectRatio = naturalWidth / naturalHeight; let newWidth = resizeDimensions.width; let newHeight = resizeDimensions.height; if (name === 'width') { newWidth = +value; if (lockAspectRatio) newHeight = Math.round(newWidth / originalAspectRatio); } else { newHeight = +value; if (lockAspectRatio) newWidth = Math.round(newHeight * originalAspectRatio); } setResizeDimensions({width: newWidth, height: newHeight}); };
    const handleApplyResize = () => { if (!sourceImageUrl) return; const canvas = processingCanvasRef.current; if (!canvas) return; canvas.width = resizeDimensions.width; canvas.height = resizeDimensions.height; const ctx = canvas.getContext('2d'); if (!ctx) return; const img = new Image(); img.crossOrigin = "Anonymous"; img.onload = () => { ctx.drawImage(img, 0, 0, resizeDimensions.width, resizeDimensions.height); addNewHistoryState(canvas.toDataURL()); setActiveSubTool(null); setGeneratedClips([]); }; img.src = sourceImageUrl; };
    const handleApplyFilter = (filter: typeof filters[0]) => { if (!sourceImageUrl) return; setActiveFilter(filter); const image = new Image(); image.crossOrigin = 'Anonymous'; image.src = sourceImageUrl; image.onload = () => { const canvas = processingCanvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; ctx.filter = filter.style.filter || 'none'; ctx.drawImage(image, 0, 0); const newImageUrl = canvas.toDataURL(); addNewHistoryState(newImageUrl); }; };
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const handleUndo = () => { if (canUndo) { const newIndex = historyIndex - 1; setHistoryIndex(newIndex); setSourceImageUrl(history[newIndex]); resetAllAdjustments(); } };
    const handleRedo = () => { if (canRedo) { const newIndex = historyIndex + 1; setHistoryIndex(newIndex); setSourceImageUrl(history[newIndex]); resetAllAdjustments(); } };

    const toolPanelContent = () => { switch(activeTool) { case 'ai': if (isBackgroundRemoved) { return (<div className="p-4 space-y-4 animate-fade-in-subtle"><h3 className="text-lg font-semibold text-cyan-400">Generate Background</h3><p className="text-xs text-slate-400">Describe the new background you want to create.</p><textarea value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} placeholder="e.g., A futuristic city at night" className="w-full h-20 p-2 bg-slate-900/70 border border-slate-700 rounded-lg" /><button onClick={handleGenerateAndCompositeBackground} disabled={isLoading} className="w-full flex items-center justify-center py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50">{isLoading ? <LoadingSpinner/> : <WandIcon />}<span className="ml-2">Generate</span></button><button onClick={handleCancelBgRemoval} disabled={isLoading} className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg">Cancel</button></div>) } return (<div className="p-4 space-y-4"><button className="w-full py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg">Auto Enhance</button><button onClick={handleOpenInpainting} className="w-full flex items-center justify-center py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg"><BrushIcon /> Object Remover</button><button onClick={handleRemoveBackground} disabled={isLoading} className="w-full flex items-center justify-center py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-lg disabled:opacity-50"><BackgroundRemoveIcon /> Background Remover</button></div>); case 'portrait': return <div className="p-4 space-y-4"><div><label className="text-xs">Skin Smoothing</label><input type="range" min="0" max="100" value={portraitAdjustments.smoothing} onChange={(e) => setPortraitAdjustments(prev => ({...prev, smoothing: +e.target.value}))} /></div><div><label className="text-xs">Blemish Removal</label><input type="range" min="0" max="100" value={portraitAdjustments.blemishes} onChange={(e) => setPortraitAdjustments(prev => ({...prev, blemishes: +e.target.value}))} /></div><div><label className="text-xs">Face Slimming</label><input type="range" min="0" max="100" value={portraitAdjustments.slimming} onChange={(e) => setPortraitAdjustments(prev => ({...prev, slimming: +e.target.value}))} /></div><button onClick={handleApplyPortraitAi} disabled={isLoading} className="w-full flex items-center justify-center py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50">{isLoading ? <LoadingSpinner/> : <WandIcon />} <span className="ml-2">Apply Portrait AI</span></button></div>; case 'light': return <div className="p-4 space-y-4"><div><label className="text-xs">Brightness</label><input type="range" min="50" max="150" value={adjustments.brightness} onChange={(e) => setAdjustments(prev => ({...prev, brightness: +e.target.value}))} /></div><div><label className="text-xs">Contrast</label><input type="range" min="50" max="150" value={adjustments.contrast} onChange={(e) => setAdjustments(prev => ({...prev, contrast: +e.target.value}))} /></div></div>; case 'color': return <div className="p-4 space-y-4">{/* ... HSL logic ... */}</div>; case 'effects': return <div className="p-4 space-y-4"><div><label className="text-xs">Background Blur</label><input type="range" min="0" max="20" value={adjustments.blur} onChange={(e) => setAdjustments(prev => ({...prev, blur: +e.target.value}))} /></div><div><label className="text-xs">Vignette</label><input type="range" min="0" max="100" value={adjustments.vignette} onChange={(e) => setAdjustments(prev => ({...prev, vignette: +e.target.value}))} /></div><div className="border-t border-slate-700 my-4" /><div className="space-y-2"><label className="text-sm font-semibold text-cyan-400">AI Noise Reduction</label><p className="text-xs text-slate-400 pb-2">Reduce noise from low-light photos.</p><input type="range" min="0" max="100" value={adjustments.noiseReduction} onChange={(e) => setAdjustments(prev => ({...prev, noiseReduction: +e.target.value}))} /><button onClick={handleApplyNoiseReduction} disabled={isLoading || adjustments.noiseReduction === 0} className="w-full flex items-center justify-center py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50">{isLoading ? <LoadingSpinner/> : <SparklesIcon />} <span className="ml-2">Apply AI Reduction</span></button></div></div>; case 'transform': return ( <div className="p-4 space-y-4"><div className="flex justify-around bg-slate-700/50 p-1 rounded-md text-sm"><button onClick={()=>handleSetSubTool('crop')} className={`flex-1 flex items-center justify-center gap-2 ${activeSubTool === 'crop' ? 'bg-slate-600 rounded' : ''} p-1`}><CropIcon/> Crop</button><button onClick={()=>handleSetSubTool('resize')} className={`flex-1 flex items-center justify-center gap-2 ${activeSubTool === 'resize' ? 'bg-slate-600 rounded' : ''} p-1`}><ArrowsExpandIcon/> Resize</button></div> {isCroppingMode && <div className="space-y-2"> <p className="text-xs">Aspect Ratio:</p> <div className="grid grid-cols-4 gap-2 text-xs"> {[null, 1 / 1, 4 / 3, 16 / 9].map(ar => <button key={ar || 0} onClick={() => setCropAspectRatio(ar)} className={`p-1 rounded ${cropAspectRatio === ar ? 'bg-cyan-600' : 'bg-slate-600'}`}>{ar ? `${ar === 1 ? '1:1' : ar === 4/3 ? '4:3' : '16:9'}` : 'Free'}</button>)} </div> <div className="flex gap-2 pt-2"> <button onClick={()=>{setIsCroppingMode(false); setActiveSubTool(null)}} className="flex-1 bg-slate-600 py-2 rounded">Cancel</button> <button onClick={handleApplyCrop} className="flex-1 bg-cyan-600 py-2 rounded">Apply</button> </div> </div>} {activeSubTool === 'resize' && <div className="space-y-2"> <div className="flex gap-2"> <input type="number" name="width" value={resizeDimensions.width} onChange={handleResizeInputChange} className="w-full bg-slate-900 p-1 rounded" /> <input type="number" name="height" value={resizeDimensions.height} onChange={handleResizeInputChange} className="w-full bg-slate-900 p-1 rounded" /> </div> <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={lockAspectRatio} onChange={e => setLockAspectRatio(e.target.checked)} /> Lock Aspect Ratio</label> <div className="flex gap-2 pt-2"> <button onClick={()=>setActiveSubTool(null)} className="flex-1 bg-slate-600 py-2 rounded">Cancel</button> <button onClick={handleApplyResize} className="flex-1 bg-cyan-600 py-2 rounded">Apply</button> </div> </div>}</div> ); default: return null; } };
    
    return (
        <div className="h-full bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-lg flex flex-col">
            {isShareModalOpen && <ShareModal imageUrl={generatedClips[generatedClips.length - 1]?.url || displayedImageUrl} onClose={() => setIsShareModalOpen(false)} />}
             <canvas ref={processingCanvasRef} className="hidden" />
            {isInpaintingMode && <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-800 rounded-lg p-4 space-y-4 relative">
                    {isLoading && <div className="absolute inset-0 bg-slate-800/80 flex flex-col items-center justify-center z-10 rounded-lg"><LoadingSpinner /><p className="mt-2 text-sm text-slate-400">AI is thinking...</p></div>}
                    {inpaintingStep === 'masking' && <>
                        <h3 className="text-lg font-bold text-center">Object Remover</h3>
                        <p className="text-sm text-slate-400 text-center">Paint over the object to remove.</p>
                        <div><label className="text-xs">Brush Size</label><input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} /></div>
                        <div><label className="text-xs">Brush Hardness</label><input type="range" min="1" max="100" value={brushHardness} onChange={(e) => setBrushHardness(+e.target.value)} /></div>
                        <div><label className="text-xs">Brush Opacity</label><input type="range" min="1" max="100" value={brushOpacity} onChange={(e) => setBrushOpacity(+e.target.value)} /></div>
                        <div className="flex space-x-2">
                            <button onClick={handleCloseInpainting} className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded">Cancel</button>
                            <button onClick={handleClearMask} className="p-2 bg-slate-600 hover:bg-slate-500 rounded" aria-label="Clear mask"><EraserIcon /></button>
                            <button onClick={handlePreviewInpainting} disabled={!hasMask} className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded">Preview Removal</button>
                        </div>
                    </>}
                    {inpaintingStep === 'preview' && <>
                        <h3 className="text-lg font-bold text-center">Preview</h3>
                        <p className="text-sm text-slate-400 text-center">Happy with the result?</p>
                        <div className="flex space-x-2">
                            <button onClick={handleBackToMasking} className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded flex items-center justify-center gap-2"><ReplyIcon /> Back to Masking</button>
                            <button onClick={handleApplyInpainting} className="flex-1 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded">Apply</button>
                        </div>
                    </>}
                </div>
            </div>}
            <div className="flex-grow grid md:grid-cols-3 gap-6 p-6 overflow-y-auto">
                <div className="md:col-span-1 flex flex-col space-y-4">
                    <div className="flex bg-slate-900/70 p-1 rounded-lg text-sm font-semibold">
                        <button onClick={() => setGenerationMode('image')} className={`flex-1 p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${generationMode === 'image' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
                            <SparklesIcon /> Image
                        </button>
                        <button onClick={() => setGenerationMode('video')} className={`flex-1 p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${generationMode === 'video' ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
                            <VideoIcon /> Video
                        </button>
                    </div>

                    {generationMode === 'image' && (
                        <>
                            {!sourceImageUrl ? (
                                <div className="flex flex-col space-y-4 h-full"><h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">Create with AI</h2><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A cat astronaut on Mars" className="w-full h-24 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500" /><button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full flex items-center justify-center py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 transform hover:scale-105"><WandIcon /> <span className="ml-2">{isLoading ? 'Generating...' : 'Generate'}</span></button></div>
                            ) : (
                                <div className="flex flex-col space-y-4 h-full">
                                    <div className="flex flex-col space-y-4"><h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">Edit with AI Prompt</h2><textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., Remove the person" className="w-full h-24 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500" /><button onClick={handleEdit} disabled={isLoading || !editPrompt.trim()} className="w-full flex items-center justify-center py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 transform hover:scale-105"><WandIcon /> <span className="ml-2">{isLoading ? 'Applying...' : 'Apply Edit'}</span></button></div>
                                    <div className="border-t border-slate-700 pt-4">
                                        <h3 className="text-lg font-semibold text-slate-300 mb-2">Adjust</h3>
                                        <div key={activeTool} className="animate-slide-in-left">{toolPanelContent()}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {generationMode === 'video' && (
                        <div className="flex flex-col space-y-4 h-full">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">Create a Video Story</h2>
                             {!isApiKeySelected ? (
                                <div className="p-4 bg-slate-900/70 border border-slate-700 rounded-lg text-center space-y-3">
                                    <p className="text-sm text-slate-300">Video generation requires a paid Google Cloud project API key.</p>
                                    <button onClick={handleSelectApiKey} className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg">Select API Key</button>
                                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">Learn more about billing</a>
                                </div>
                            ) : (
                                <div className="space-y-4 overflow-y-auto flex-grow flex flex-col">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-300">Character Descriptions (Optional)</label>
                                        <textarea 
                                            value={characterDescriptions}
                                            onChange={(e) => setCharacterDescriptions(e.target.value)}
                                            placeholder="e.g., Elara: A young explorer with bright red hair..."
                                            className="w-full h-24 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500"
                                            disabled={isGeneratingStory}
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-300">Story Segments</h3>
                                    <div className="space-y-3 pr-2 flex-grow overflow-y-auto">
                                        {storySegments.map((segment, index) => (
                                            <div key={segment.id} className="p-3 bg-slate-900/70 border border-slate-700 rounded-lg space-y-2 relative animate-fade-in-subtle">
                                                <label className="text-xs font-bold text-cyan-400">Segment {index + 1}</label>
                                                <textarea 
                                                    value={segment.prompt}
                                                    onChange={(e) => updateSegment(segment.id, { prompt: e.target.value })}
                                                    placeholder={`Describe what happens in this part of the story...`}
                                                    className="w-full h-20 p-2 bg-slate-700/50 border border-slate-600 rounded-lg"
                                                    disabled={isGeneratingStory}
                                                />
                                                <div>
                                                    <label className="text-xs text-slate-400">Duration: {segment.duration}s</label>
                                                    <input 
                                                        type="range" min="5" max="60" 
                                                        value={segment.duration} 
                                                        onChange={(e) => updateSegment(segment.id, { duration: +e.target.value })}
                                                        className="w-full"
                                                        disabled={isGeneratingStory}
                                                    />
                                                </div>
                                                {storySegments.length > 1 && (
                                                    <button onClick={() => removeSegment(segment.id)} disabled={isGeneratingStory} className="absolute top-1 right-1 text-slate-500 hover:text-red-400 disabled:opacity-50">
                                                        <XCircleIcon />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={addSegment} disabled={isGeneratingStory} className="w-full py-2 px-4 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg disabled:opacity-50">
                                        + Add Next Segment
                                    </button>

                                    <div className="!mt-auto pt-4">
                                        <button onClick={handleGenerateStory} disabled={isGeneratingStory} className="w-full flex items-center justify-center py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50">
                                            <WandIcon /> 
                                            <span className="ml-2">{isGeneratingStory ? `Generating ${generationProgress.segment}/${generationProgress.total}...` : 'Generate Full Story'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="!mt-auto pt-4 flex space-x-2">
                        <button onClick={handleStartOver} className="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg">Start Over</button>
                        <button onClick={handleShare} disabled={!sourceImageUrl && generatedClips.length === 0} className="flex-1 flex items-center justify-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"><ShareIcon /> Share</button>
                        <button onClick={handleDownload} disabled={(!sourceImageUrl && generatedClips.length === 0) || isGeneratingStory} className="flex-1 flex items-center justify-center py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50"><DownloadIcon /> Download</button>
                    </div>
                    {generationMode === 'image' && (
                        <div className="flex justify-center items-center gap-2 pt-4">
                            <button onClick={handleUndo} disabled={!canUndo} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"><UndoIcon /></button>
                            <button onClick={handleRedo} disabled={!canRedo} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"><RedoIcon /></button>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 flex flex-col items-center justify-center">
                    <div className={`w-full aspect-square bg-slate-900/50 border border-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden ${isBackgroundRemoved ? 'checkerboard-bg' : ''}`} ref={imageContainerRef}>
                        {(!sourceImageUrl && generatedClips.length === 0) && <div className="text-center"><UploadIcon /><p className="mt-4 text-slate-400">Upload or generate an image/video.</p><button onClick={triggerFileInput} className="mt-4 py-2 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg">Choose File</button><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" /></div>}
                        {(isLoading || isGeneratingStory) && !isInpaintingMode && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-20"><LoadingSpinner size="h-12 w-12" /><p className="mt-4 text-lg animate-pulse-subtle">{isGeneratingStory ? `Segment ${generationProgress.segment}/${generationProgress.total}: ${generationProgress.message}` : 'Processing...'}</p>{(isGeneratingStory) && <div className="w-3/4 bg-slate-600 rounded-full h-2.5 mt-4"><div className="bg-cyan-500 h-2.5 rounded-full" style={{width: `${generationProgress.percentage}%`}}></div></div>}</div>}
                        {error && <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-900/80 z-20"><p className="text-red-400 text-center">{error}</p></div>}
                        
                        {generatedClips.length > 0 ? (
                             <div className="w-full h-full p-4 grid grid-cols-2 gap-4 overflow-y-auto">
                                {generatedClips.map((clip, index) => (
                                    <div key={clip.id} className="aspect-video bg-black rounded-lg overflow-hidden relative group animate-fade-in">
                                        <video src={clip.url} controls loop className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded-full text-xs font-bold">
                                            Segment {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sourceImageUrl && (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {!isInpaintingMode && <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">{[{ key: 'ai', icon: <SparklesIcon />}, {key: 'portrait', icon: <FaceIcon/>}, { key: 'light', icon: <SunIcon /> }, { key: 'color', icon: <ColorSwatchIcon /> }, { key: 'effects', icon: <AdjustIcon /> }, { key: 'transform', icon: <TransformIcon /> }].map(tool => <button key={tool.key} onClick={() => setActiveTool(activeTool === tool.key ? null : tool.key)} className={`p-2 rounded-md transition-all ${activeTool === tool.key ? 'bg-cyan-500 scale-110' : 'bg-slate-700 hover:bg-slate-600 hover:scale-110'}`}>{tool.icon}</button>)}</div>}
                                <div className="relative w-full h-full">
                                    <img ref={imageRef} src={isInpaintingMode && previewImageUrl ? previewImageUrl : displayedImageUrl || sourceImageUrl} alt="Editable" className="w-full h-full object-contain" crossOrigin="anonymous"/>
                                    <div className="absolute inset-0 pointer-events-none" style={{boxShadow: `inset 0 0 ${adjustments.vignette * 2}px ${adjustments.vignette}px rgba(0,0,0,0.5)`}}/>
                                    {isInpaintingMode && inpaintingStep === 'masking' && <canvas ref={maskCanvasRef} className="absolute top-0 left-0 w-full h-full opacity-70" style={{ cursor: 'crosshair' }} onMouseDown={handleCanvasMouseDown} onMouseUp={handleCanvasMouseUp} onMouseOut={handleCanvasMouseUp} onMouseMove={handleCanvasMouseMove} />}
                                    {isCroppingMode && <div className="absolute inset-0"><div className="absolute inset-0 bg-black/50" style={{clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${cropBox.y}px, ${cropBox.x}px ${cropBox.y}px, ${cropBox.x}px ${cropBox.y + cropBox.height}px, ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px, ${cropBox.x + cropBox.width}px ${cropBox.y}px, 0 ${cropBox.y}px)`}}/><div className="absolute border-2 border-white/80 cursor-move" onMouseDown={e => handleCropMouseDown(e, null)} style={{ left: cropBox.x, top: cropBox.y, width: cropBox.width, height: cropBox.height }}><div onMouseDown={e => handleCropMouseDown(e, 'tl')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nwse-resize"/><div onMouseDown={e => handleCropMouseDown(e, 'tr')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-nesw-resize"/><div onMouseDown={e => handleCropMouseDown(e, 'bl')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full cursor-nesw-resize"/><div onMouseDown={e => handleCropMouseDown(e, 'br')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full cursor-nwse-resize"/></div></div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             {sourceImageUrl && !isInpaintingMode && generationMode === 'image' && <div className="p-6 border-t border-slate-700/50"><h3 className="text-sm font-semibold mb-2">Filters</h3><div className="flex space-x-2 overflow-x-auto pb-2">{filters.map(filter => <button key={filter.name} onClick={() => handleApplyFilter(filter)} className="flex-shrink-0 group"><div className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${activeFilter.name === filter.name ? 'border-cyan-400' : 'border-slate-700 group-hover:border-slate-500'}`}><img src={sourceImageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" style={filter.style} alt={filter.name} /></div><p className={`text-xs text-center mt-1 transition-colors ${activeFilter.name === filter.name ? 'text-cyan-400' : 'text-slate-400'}`}>{filter.name}</p></button>)}</div></div>}
        </div>
    );
};

export default ImageGenerator;
