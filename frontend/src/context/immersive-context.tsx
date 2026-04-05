import { createContext, useContext, useState, ReactNode } from "react";

const ImmersiveContext = createContext<{
  immersive: boolean;
  setImmersive: (value: boolean) => void;
}>({
  immersive: false,
  setImmersive: () => {},
});

export function ImmersiveProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);

  return (
    <ImmersiveContext.Provider value={{ immersive, setImmersive }}>
      {children}
    </ImmersiveContext.Provider>
  );
}

export function useImmersive() {
  return useContext(ImmersiveContext);
}
