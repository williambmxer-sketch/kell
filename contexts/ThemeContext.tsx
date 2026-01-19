import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchSettings, updateSettings } from '../services/supabase';

type Theme = 'light' | 'dark';
type SidebarMode = 'automatic' | 'fixed-open' | 'fixed-closed';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    sidebarMode: SidebarMode;
    setSidebarMode: (mode: SidebarMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme') as Theme;
        if (saved) return saved;
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
        const saved = localStorage.getItem('sidebarMode') as SidebarMode;
        if (saved) return saved;
        return 'automatic'; // default
    });

    // Load settings from DB on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await fetchSettings();
                if (settings) {
                    if (settings.theme) setTheme(settings.theme);
                    if (settings.sidebarMode) setSidebarMode(settings.sidebarMode);
                }
            } catch (error) {
                console.error('Failed to load theme settings:', error);
            }
        };
        loadSettings();
    }, []);

    // Apply theme to DOM
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    // Persist theme to DB
    useEffect(() => {
        localStorage.setItem('theme', theme);
        // Persist to DB
        updateSettings({ theme }).catch(err => console.error('Failed to save theme:', err));
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('sidebarMode', sidebarMode);
        // Persist to DB
        updateSettings({ sidebarMode }).catch(err => console.error('Failed to save sidebar mode:', err));
    }, [sidebarMode]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, sidebarMode, setSidebarMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
