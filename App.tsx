
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { StudentViewContent } from './components/StudentView';
import { TrainerViewContent } from './components/TrainerView';
import { db } from './services/storage';
import { User, UserRole } from './types';
import { Dumbbell, AlertTriangle, RefreshCcw } from 'lucide-react';

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Sequência de animação
    const t1 = setTimeout(() => setStep(1), 500);
    const t2 = setTimeout(() => setStep(2), 2000); 
    const t3 = setTimeout(() => {
      setStep(3);
      setTimeout(onFinish, 500); 
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
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
        <p className={`text-indigo-300 mt-4 text-center font-light tracking-widest text-sm uppercase transition-opacity duration-700 delay-300 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          Eleve seu potencial
        </p>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDbReady, setIsDbReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [appVersion, setAppVersion] = useState(0); // Used to force re-render after onboarding
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // Initialize DB immediately
      db.init();
      setIsDbReady(true);
      
      // Check session
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Critical Init Error", e);
      setHasError(true);
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    setActiveTab('dashboard'); 
    setHasError(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('dashboard');
    setHasError(false);
  };

  const handleOnboardingComplete = () => {
    if(user) {
        // Instead of reloading page (which causes 404s in some envs), we force a state update
        // ensuring the 'needsOnboarding' check runs again.
        setAppVersion(v => v + 1);
        setActiveTab('dashboard');
    }
  };

  const handleResetApp = () => {
      localStorage.clear();
      window.location.href = '/'; // Hard reset only on explicit error recovery
  };

  // Only render app content when DB is ready
  if (!isDbReady) return null;

  if (hasError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                  <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Algo deu errado</h2>
              <p className="text-slate-500 mb-6 max-w-md">Ocorreu um erro ao carregar seus dados. Tente reiniciar o aplicativo.</p>
              <button onClick={handleResetApp} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                  <RefreshCcw className="w-4 h-4" /> Reiniciar App
              </button>
          </div>
      )
  }

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      
      {!user ? (
        <div className={showSplash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
           <Auth onLogin={handleLogin} />
        </div>
      ) : (
        // Key prop ensures re-render when appVersion changes (after onboarding)
        <React.Fragment key={appVersion}>
           {(() => {
               try {
                   // Logic to route between Onboarding and Main App
                   const profile = db.getProfile(user.id);
                   const needsOnboarding = user.role === UserRole.STUDENT && (!profile || !profile.onboardingCompleted);

                   if (needsOnboarding) {
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
               } catch (err) {
                   console.error("Render Error:", err);
                   setHasError(true);
                   return null;
               }
           })()}
        </React.Fragment>
      )}
    </>
  );
}

export default App;
