
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { StudentViewContent } from './components/StudentView';
import { TrainerViewContent } from './components/TrainerView';
import { db } from './services/storage';
import { User, UserRole, UserProfile } from './types';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorType, setErrorType] = useState<'generic' | 'permission'>('generic');
  const [isInitializing, setIsInitializing] = useState(true);

  // Lógica para interceptar o botão voltar do celular
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (activeTab !== 'dashboard') {
        event.preventDefault();
        setActiveTab('dashboard');
        // Re-push para manter o usuário no app na próxima vez que clicar em voltar
        window.history.pushState({ tab: 'dashboard' }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Sempre que a aba mudar, adicionamos uma entrada no histórico do navegador
  useEffect(() => {
    window.history.pushState({ tab: activeTab }, '');
  }, [activeTab]);

  useEffect(() => {
    db.init();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await db.getUserFromDb(firebaseUser.uid);
          const userProfile = await db.getProfile(firebaseUser.uid);
          
          if (userData) setUser(userData);
          if (userProfile) setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (e: any) {
        if (e.message?.includes('Permission denied')) {
            setErrorType('permission');
            setHasError(true);
        }
      } finally {
        setIsInitializing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab('dashboard');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950">
        <Loader2 className="w-12 h-12 text-white animate-spin opacity-20" />
      </div>
    );
  }

  if (!user) {
    return (
        <>
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
               <Auth onLogin={(u) => setUser(u)} />
            </div>
        </>
    );
  }

  if (user.role === UserRole.STUDENT && (!profile || !profile.onboardingCompleted)) {
      return <Onboarding user={user} onComplete={async () => {
          const p = await db.getProfile(user.id);
          setProfile(p || null);
      }} />;
  }

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
}

export default App;
