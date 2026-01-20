import React, { useState, useEffect } from 'react';
import { AppScreen, UserSession, UserData } from './types';
import { SESSION_KEY } from './constants';
import { CookieManager } from './services/storage';
import LoginForm from './components/LoginForm';
import ConfigForm from './components/ConfigForm';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [session, setSession] = useState<UserSession | null>(null);
  const [initialData, setInitialData] = useState<UserData | null>(null);

  useEffect(() => {
    const savedSession = CookieManager.get(SESSION_KEY);
    if (savedSession && savedSession.email) {
      setSession(savedSession);
      setCurrentScreen(AppScreen.CONFIG);
    }
  }, []);

  const handleLoginSuccess = (userEmail: string, fetchedData?: UserData) => {
    const newSession = {
      email: userEmail,
      loggedAt: new Date().toISOString()
    };
    CookieManager.set(SESSION_KEY, newSession, 90);
    setSession(newSession);
    if (fetchedData) setInitialData(fetchedData);
    setCurrentScreen(AppScreen.CONFIG);
  };

  const handleLogout = () => {
    CookieManager.delete(SESSION_KEY);
    setSession(null);
    setInitialData(null);
    setCurrentScreen(AppScreen.LOGIN);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[440px] relative z-10">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-1 font-mono">
            D'Enterprise
          </h1>
          <p className="text-cyan-500 font-mono text-xs uppercase tracking-[0.3em] mb-3">
            Marcador Vturb
          </p>
          <div className="h-0.5 w-12 bg-zinc-800 mx-auto rounded-full" />
        </header>

        <div className="glass-card rounded-2xl p-8 shadow-2xl transition-all duration-500">
          {currentScreen === AppScreen.LOGIN ? (
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          ) : (
            <ConfigForm 
              session={session!} 
              onLogout={handleLogout} 
              initialData={initialData}
            />
          )}
        </div>
        
        <footer className="mt-8 text-center text-zinc-600 text-[10px] font-mono uppercase tracking-widest">
          SISTEMA VER 2.2.0 // D'ENTERPRISE CORE
        </footer>
      </div>
    </div>
  );
};

export default App;