
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { StudentViewContent } from './components/StudentView';
import { TrainerViewContent } from './components/TrainerView';
import { db } from './services/storage';
import { User, UserRole } from './types';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { Dumbbell, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 2000); 
    const t3 = setTimeout(() => {
      setStep(3);
      setTimeout(onFinish, 500); 
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-indigo-950 flex flex-col items-center justify-center transition-opacity duration-700 ${step === 3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className={`transition-all duration-1000 transform ${step >= 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-xl shadow-lg shadow-indigo-900/50">
                <Dumbbell className="w-10 h-10 text-indigo-900" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">TREYO</h1>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDbReady, setIsDbReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [appVersion, setAppVersion] = useState(0); 
  const [hasError, setHasError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    db.init();
    
    // Monitora o estado de login do Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await db.getUserFromDb(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          }
        } else {
          setUser(null);
          localStorage.removeItem('currentUser');
        }
      } catch (e) {
        console.error("Auth sync error", e);
        setHasError(true);
      } finally {
        setIsInitializing(false);
        setIsDbReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    setActiveTab('dashboard'); 
    setHasError(false);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('dashboard');
  };

  const handleOnboardingComplete = () => {
    setAppVersion(v => v + 1);
    setActiveTab('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950">
        <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
      </div>
    );
  }

  if (hasError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Erro de Sincronização</h2>
              <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">Tentar Novamente</button>
          </div>
      );
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      {!user ? (
        <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
           <Auth onLogin={handleLogin} />
        </div>
      ) : (
        <React.Fragment key={appVersion}>
           {(() => {
               // No Firebase, precisamos garantir que o perfil seja carregado de forma assíncrona.
               // Como as views já lidam com useEffect para carregar o perfil, passamos apenas o objeto user.
               return (
                 <Layout 
                   role={user.role} 
                   activeTab={activeTab} 
                   onTabChange={setActiveTab}
                   onLogout={handleLogout}
                   user={user}
                   onUserUpdate={(updated) => setUser(updated)}
                 >
                   {user.role === UserRole.STUDENT ? (
                     <StudentViewContent activeTab={activeTab} user={user} onTabChange={setActiveTab} />
                   ) : (
                     <TrainerViewContent user={user} activeTab={activeTab} onTabChange={setActiveTab} />
                   )}
                 </Layout>
               );
           })()}
        </React.Fragment>
      )}
    </>
  );
}

export default App;
