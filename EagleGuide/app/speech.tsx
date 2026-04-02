import React, { createContext, useContext, useState } from "react";

type TTSContextType = {
  ttsEnabled: boolean;
  setTTSEnabled: (value: boolean) => void;
};

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ttsEnabled, setTTSEnabled] = useState(false);

  return (
    <TTSContext.Provider value={{ ttsEnabled, setTTSEnabled }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS must be used inside TTSProvider");
  return ctx;
};