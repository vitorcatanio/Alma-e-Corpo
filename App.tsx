
import React, { useState, useEffect, useRef } from 'react';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { StudentViewContent } from './components/StudentView';
import { TrainerViewContent } from './components/TrainerView';
import { db } from './services/storage';
import { User, UserRole, UserProfile } from './types';
import { auth } from './firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
  const [isInitializing, setIsInitializing] = useState(true);
  
  const isAuthProcessRunning = useRef(false);

  useEffect(() => {
    db.init();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isAuthProcessRunning.current) return;

      try {
        if (firebaseUser) {
          const userData = await db.getUserFromDb(firebaseUser.uid);
          const userProfile = await db.getProfile(firebaseUser.uid);
          
          if (userData) {
            setUser(userData);
          }
          if (userProfile) {
            setProfile(userProfile);
          }
        } else {
          // Limpeza total de estados locais se não houver usuário Firebase
          setUser(null);
          setProfile(null);
        }
      } catch (e: any) {
        console.error("Critical Sync Error:", e);
        setHasError(true);
      } finally {
        setIsInitializing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    // Garante que o estado está limpo antes de setar o novo usuário
    setUser(null);
    setProfile(null);
    
    // Seta o novo usuário e encerra o bloqueio de processo
    setTimeout(() => {
        setUser(loggedInUser);
        setActiveTab('dashboard'); 
        setHasError(false);
        isAuthProcessRunning.current = false;
    }, 10);
  };

  const setAuthProcessStatus = (status: boolean) => {
      isAuthProcessRunning.current = status;
  };

  const handleLogout = async () => {
    // Reset preventivo de estados
    setUser(null);
    setProfile(null);
    setActiveTab('dashboard');
    setIsInitializing(false);
    
    // Logout real no Firebase
    await signOut(auth);
  };

  const handleOnboardingComplete = async () => {
    if (user) {
        const newProfile = await db.getProfile(user.id);
        setProfile(newProfile || null);
    }
  };

  if (isInitializing && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin opacity-20" />
      </div>
    );
  }

  if (hasError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-3xl font-black mb-2 text-slate-900">Falha de Conexão</h2>
              <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black">Tentar Novamente</button>
          </div>
      );
  }

  if (!user) {
    return (
        <>
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
               <Auth onLogin={handleLogin} setAuthProcessStatus={setAuthProcessStatus} />
            </div>
        </>
    );
  }

  if (user.role === UserRole.STUDENT && (!profile || !profile.onboardingCompleted)) {
      return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
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
