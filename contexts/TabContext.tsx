import React, { createContext, useContext, useState } from 'react';

type TabContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TabContext = createContext<TabContextType>({
  activeTab: 'home',
  setActiveTab: () => {},
});

export const useTabContext = () => useContext(TabContext);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export default function TabContextProvider({ children }: { children: React.ReactNode }) {
  return <TabProvider>{children}</TabProvider>;
}
