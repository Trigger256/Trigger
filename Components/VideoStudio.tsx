
import React, { useState, useEffect } from 'react';
import { getCreations, getVideoProjects, saveVideoProjects } from '../utils/storage';
import type { VideoProject } from '../utils/storage';
import LoadingSpinner from './LoadingSpinner';

const VideoStudio: React.FC = () => {
    const [projects, setProjects] = useState<VideoProject[]>([]);
    const [activeProject, setActiveProject] = useState<VideoProject | null>(null);
    const [media, setMedia] = useState<string[]>([]);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const creations = getCreations().filter(url => url.startsWith('blob:'));
        setMedia(creations);

        const savedProjects = getVideoProjects();
        setProjects(savedProjects);
        
        if (savedProjects.length > 0) {
            setActiveProject(savedProjects[0]);
        } else {
            const newProject: VideoProject = {
                id: `proj_${Date.now()}`,
                name: `My First Movie`,
                timeline: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setActiveProject(newProject);
            setProjects([newProject]);
            saveVideoProjects([newProject]);
        }
    }, []);

    const handleExport = async () => {
        const lastClipUrl = media[media.length - 1];
        if (!lastClipUrl) {
            alert("No video clips to export. Please generate some video segments first.");
            return;
        }

        setIsExporting(true);
        // This simulates a video rendering process
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            const response = await fetch(lastClipUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${activeProject?.name.replace(/\s+/g, '_') || 'trigger-ai-movie'}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export failed:", error);
            alert("An error occurred during export. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    if (!activeProject) {
        return <div className="text-center p-8">Loading Video Studio...</div>;
    }

    return (
        <div className="h-full bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-lg text-white flex flex-col font-sans p-4 gap-4">
            <header className="flex-shrink-0 flex justify-between items-center p-2 bg-slate-900/50 rounded-lg">
                <h1 className="text-xl font-bold">{activeProject.name}</h1>
                <div className="flex gap-2">
                    <button className="py-2 px-4 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg">Save Project</button>
                    <button onClick={handleExport} disabled={isExporting || media.length === 0} className="py-2 px-4 text-sm bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50 flex items-center gap-2">
                        {isExporting ? <LoadingSpinner size="h-4 w-4"/> : null}
                        {isExporting ? 'Exporting...' : 'Export Video'}
                    </button>
                </div>
            </header>
            <div className="flex-grow grid grid-cols-3 gap-4 min-h-0">
                <aside className="col-span-1 bg-slate-900/50 rounded-lg p-4 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Media Bin</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto">
                        {media.map((url, index) => (
                             <div key={url} className="aspect-video bg-black rounded overflow-hidden group relative">
                                <video src={url} className="w-full h-full object-cover" />
                                <div className="absolute top-1 left-1 bg-black/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                                    Clip {index + 1}
                                </div>
                            </div>
                        ))}
                         {media.length === 0 && <p className="col-span-full text-sm text-slate-400">Generate videos in the 'Generate' tab to see them here.</p>}
                    </div>
                </aside>
                <main className="col-span-2 bg-slate-900/50 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="w-full aspect-video bg-black rounded">
                        {media.length > 0 ? (
                            <video key={media[media.length - 1]} src={media[media.length - 1]} controls className="w-full h-full" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <p>Video Preview</p>
                            </div>
                        )}
                    </div>
                     <p className="text-sm text-slate-500 mt-4">Timeline and editing features are under construction.</p>
                </main>
            </div>
            <footer className="h-48 bg-slate-900/50 rounded-lg p-4 flex-shrink-0">
                <h2 className="text-lg font-semibold mb-2">Timeline</h2>
                 {/* Timeline tracks will go here */}
            </footer>
        </div>
    );
};

export default VideoStudio;
