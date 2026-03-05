import React, { createContext, useContext, useState, ReactNode } from "react";

type FontContextType = {
    largeTextEnabled: boolean;
    toggleLargeText: () => void;
    scaleFont: (size: number) => number;
};

const FontContext = createContext<FontContextType>({
    largeTextEnabled: false,
    toggleLargeText: () => { },
    scaleFont: (size) => size,
});

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [largeTextEnabled, setLargeTextEnabled] = useState(false);

    const toggleLargeText = () => setLargeTextEnabled((prev) => !prev);

    const scaleFont = (size: number) => (largeTextEnabled ? size * 1.25 : size);

    return (
        <FontContext.Provider value={{ largeTextEnabled, toggleLargeText, scaleFont }}>
            {children}
        </FontContext.Provider>
    );
};

export const useAccessibility = () => useContext(FontContext);