import React, { createContext, useContext, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Welcome from './components/Welcome';
import Navbar from './components/Navbar';
import Schedule from './components/Schedule';
import RecordRide from './components/RecordRide';
import Team from './components/Team';
import Chat from './components/Chat';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { User } from './types';
import { LogoIcon, SunIcon, MoonIcon } from './components/Icons';

// --- Theme Management ---
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    // Check for valid theme values to prevent unexpected behavior
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // The 'dark' class is what Tailwind CSS uses to apply dark mode styles.
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persist the user's choice in localStorage.
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


// --- Header Component ---
const Header: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto h-16 flex justify-between items-center px-4">
                <div className="flex items-center gap-2 text-yellow-500 dark:text-yellow-400">
                    <LogoIcon className="w-10 h-10" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Nomads <span className="text-yellow-500 dark:text-yellow-400">Bikers</span>
                    </span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
            </div>
        </header>
    );
};

const AppContent: React.FC = () => {
    const location = useLocation();
    const shouldShowNavbar = ['/', '/record', '/team', '/chat'].includes(location.pathname);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
            <Header />
            <main className="pt-16 pb-20">
              <div className="max-w-4xl mx-auto">
                <Routes>
                    <Route path="/" element={<Schedule />} />
                    <Route path="/record" element={<RecordRide />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
            {shouldShowNavbar && <Navbar />}
        </div>
    )
}

const App: React.FC = () => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);

  const handleWelcomeComplete = (newUser: { name: string; age: number }) => {
    const leaderUser: User = { ...newUser, role: 'leader' };
    setUser(leaderUser);
    localStorage.setItem('leaderName', newUser.name);
  };

  return (
    <ThemeProvider>
      {
        !user 
        ? <Welcome onWelcomeComplete={handleWelcomeComplete} />
        : (
            <HashRouter>
                <AppContent />
            </HashRouter>
        )
      }
    </ThemeProvider>
  );
};

export default App;