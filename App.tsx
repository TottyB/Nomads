import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Schedule from './components/Schedule';
import RecordRide from './components/RecordRide';
import Team from './components/Team';
import Chat from './components/Chat';
import Leaderboard from './components/Leaderboard';
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

// Fix: Update ThemeProvider to use a more standard signature for components with children.
// Updated the signature to a standard functional component without using React.FC to resolve a typing issue.
const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
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

// --- Online Status Hook ---
const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
};

// --- Header Component ---
// Fix: Changed from React.FC to a plain function component to avoid potential typing issues.
const Header = () => {
    const { theme, toggleTheme } = useTheme();
    const { profile, supabase } = useAuth();

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto h-16 flex justify-between items-center px-4">
                <div className="flex items-center gap-2 text-yellow-500 dark:text-yellow-400">
                    <LogoIcon className="w-10 h-10" />
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Nomads <span className="text-yellow-500 dark:text-yellow-400">Bikers</span>
                    </span>
                </div>
                 <div className="flex items-center gap-4">
                    {profile && (
                        <button onClick={() => supabase.auth.signOut()} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-yellow-500">
                            Logout
                        </button>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </header>
    );
};

// Fix: Changed from React.FC to a plain function component to avoid potential typing issues.
const AppContent = () => {
    const location = useLocation();
    const isOnline = useOnlineStatus();
    const shouldShowNavbar = ['/', '/record', '/team', '/chat', '/leaderboard'].includes(location.pathname);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white min-h-screen">
            <Header />
            <main className="pt-16 pb-20">
              {!isOnline && (
                  <div className="bg-red-500 text-white text-center py-2 fixed top-16 left-0 right-0 z-30">
                      You are offline. Some features may be disabled.
                  </div>
              )}
              <div className={`max-w-4xl mx-auto ${!isOnline ? 'pt-8' : ''}`}>
                <Routes>
                    <Route path="/" element={<Schedule />} />
                    <Route path="/record" element={<RecordRide />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
            {shouldShowNavbar && <Navbar />}
        </div>
    )
}

// Fix: Changed from React.FC to a plain function component to avoid potential typing issues.
const MainApp = () => {
    const { session } = useAuth();

    return !session ? <Auth /> : (
        <HashRouter>
            <AppContent />
        </HashRouter>
    );
}

// Fix: Changed from React.FC to a plain function component to avoid potential typing issues.
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;