
import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

const FullScreenButton: React.FC = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        // Listener to update state if user uses Esc or browser controls
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleFullScreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error("Error attempting to toggle full-screen mode:", err);
        }
    };

    return (
        <button
            onClick={toggleFullScreen}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95"
            title={isFullScreen ? "Sair da Tela Cheia (F11)" : "Tela Cheia (F11)"}
        >
            {isFullScreen ? (
                <Minimize className="w-5 h-5" />
            ) : (
                <Maximize className="w-5 h-5" />
            )}
        </button>
    );
};

export default FullScreenButton;
