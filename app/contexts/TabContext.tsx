import React, { createContext, useContext, useState } from 'react';

// Criar um contexto para compartilhar o estado das tabs
type TabContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabContext = createContext<TabContextType>({
  activeTab: 'home',
  setActiveTab: () => {},
});

// Hook para usar o contexto das tabs
export const useTabContext = () => useContext(TabContext);

// Provider para o contexto das tabs
export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

// Exportação padrão para o Expo Router
export default function TabContextProvider({ children }: { children: React.ReactNode }) {
  return <TabProvider>{children}</TabProvider>;
}
