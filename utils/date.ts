export const formatScheduledDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();

    // Heuristic correction for UTC-3 timezone mismatch
    // If the time is unnaturally early (< 8:00), it's likely a UTC displayed as Local issue
    // Example: 05:00 displayed -> 08:00 intended
    if (hours < 8) {
        date.setHours(date.getHours() + 3);
    }

    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
};

export const formatScheduledTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = date.getHours();

    // Heuristic correction for UTC-3 timezone mismatch
    if (hours < 8) {
        date.setHours(date.getHours() + 3);
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
