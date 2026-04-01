import React, { createContext, useContext, useMemo, useState } from "react";

export type ColorBlindMode =
  | "default"
  | "tritanopia"
  | "protanopia"
  | "deuteranopia";

type ColorBlindContextType = {
  colorBlindMode: ColorBlindMode;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  getAccessibleColor: (fill?: string | null, alpha?: number) => string;
};

const ColorBlindContext = createContext<ColorBlindContextType | undefined>(undefined);

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

const toRgba = (fill?: string | null, alpha = 0.3) => {
  if (!fill) return `rgba(0, 122, 255, ${alpha})`;

  const s = fill.trim();

  const rgbaMatch =
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i.exec(s);
  if (rgbaMatch) return s;

  const rgbMatch =
    /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(s);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1).map(Number);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split("").map((ch) => ch + ch).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return `rgba(0, 122, 255, ${alpha})`;
};

const PALETTES: Record<ColorBlindMode, Record<string, string>> = {
  default: {},

  protanopia: {
    "#16a085": "#0072B2",
    "#1abc9c": "#56B4E9",
    "#27ae60": "#009E73",
    "#2e86ff": "#332288",
    "#34495e": "#117733",
    "#8e44ad": "#AA4499",
    "#95a5a6": "#999933",
    "#a0522d": "#CC6677",
    "#c0392b": "#D55E00",
    "#e91e63": "#882255",
    "#f1c40f": "#E69F00",
    "#f39c12": "#DDCC77",

    "rgb(13, 137, 233)": "#0072B2",
    "rgb(13, 233, 137)": "#009E73",
    "rgb(207, 1, 174)": "#AA4499",
    "rgb(207, 174, 1)": "#E69F00",
    "rgb(255, 64, 64)": "#D55E00",
    "rgb(99, 249, 34)": "#44AA99",
    "rgb(99, 34, 249)": "#332288",
  },

  deuteranopia: {
    "#16a085": "#0072B2",
    "#1abc9c": "#56B4E9",
    "#27ae60": "#009E73",
    "#2e86ff": "#332288",
    "#34495e": "#004488",
    "#8e44ad": "#AA4499",
    "#95a5a6": "#999933",
    "#a0522d": "#CC6677",
    "#c0392b": "#D55E00",
    "#e91e63": "#882255",
    "#f1c40f": "#E69F00",
    "#f39c12": "#DDCC77",

    "rgb(13, 137, 233)": "#0072B2",
    "rgb(13, 233, 137)": "#009E73",
    "rgb(207, 1, 174)": "#AA4499",
    "rgb(207, 174, 1)": "#E69F00",
    "rgb(255, 64, 64)": "#D55E00",
    "rgb(99, 249, 34)": "#44AA99",
    "rgb(99, 34, 249)": "#332288",
  },

  tritanopia: {
    "#16a085": "#1B9E77",
    "#1abc9c": "#66A61E",
    "#27ae60": "#4DAF4A",
    "#2e86ff": "#7570B3",
    "#34495e": "#386CB0",
    "#8e44ad": "#984EA3",
    "#95a5a6": "#999999",
    "#a0522d": "#A6761D",
    "#c0392b": "#E41A1C",
    "#e91e63": "#E7298A",
    "#f1c40f": "#FF7F00",
    "#f39c12": "#FDB462",

    "rgb(13, 137, 233)": "#386CB0",
    "rgb(13, 233, 137)": "#4DAF4A",
    "rgb(207, 1, 174)": "#984EA3",
    "rgb(207, 174, 1)": "#FF7F00",
    "rgb(255, 64, 64)": "#E41A1C",
    "rgb(99, 249, 34)": "#66A61E",
    "rgb(99, 34, 249)": "#7570B3",
  },
};

export const ColorBlindModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>("default");

  const getAccessibleColor = (fill?: string | null, alpha = 0.3) => {
    const normalized = normalize(fill);
    const mapped = PALETTES[colorBlindMode][normalized] ?? fill;
    return toRgba(mapped, alpha);
  };

  const value = useMemo(
    () => ({
      colorBlindMode,
      setColorBlindMode,
      getAccessibleColor,
    }),
    [colorBlindMode]
  );

  return (
    <ColorBlindContext.Provider value={value}>
      {children}
    </ColorBlindContext.Provider>
  );
};

export const useColorBlindMode = () => {
  const context = useContext(ColorBlindContext);
  if (!context) {
    throw new Error("useColorBlindMode must be used inside ColorBlindModeProvider");
  }
  return context;
};