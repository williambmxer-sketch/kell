export const isValidPlate = (plate: string): boolean => {
    // Remove non-alphanumeric characters
    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Old Format: ABC1234 (3 letters, 4 numbers)
    const isOld = /^[A-Z]{3}\d{4}$/.test(cleanPlate);

    // Mercosur: ABC1D23 (3 letters, 1 number, 1 letter, 2 numbers)
    const isMercosur = /^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleanPlate);

    return isOld || isMercosur;
};

export const formatPlate = (plate: string): string => {
    const clean = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // Basic formatting if desired, though usually just UPPERCASE is enough for storage
    // Could add hyphen if OLD format: ABC1234 -> ABC-1234
    if (/^[A-Z]{3}\d{4}$/.test(clean)) {
        return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
};
