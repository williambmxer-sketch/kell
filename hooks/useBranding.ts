import { useEffect } from 'react';
import { WorkshopSettings } from '../types';

export const useBranding = (settings: WorkshopSettings | null) => {
    useEffect(() => {
        if (!settings) return;

        // Update Title
        if (settings.nome_oficina) {
            document.title = settings.nome_oficina;
        } else {
            document.title = 'Oficina Master Pro'; // Default
        }

        // Update Favicon
        if (settings.logo_url) {
            const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                // Create if doesn't exist (though usually it does in index.html)
                const newLink = document.createElement('link');
                newLink.rel = 'icon';
                newLink.href = settings.logo_url;
                document.getElementsByTagName('head')[0].appendChild(newLink);
            } else {
                link.href = settings.logo_url;
            }
        }
    }, [settings]);
};
