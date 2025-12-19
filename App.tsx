
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
import { Dumbbell, AlertTriangle, RefreshCcw, Loader2, Database, ShieldAlert, ExternalLink } from 'lucide-react';

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
  const [errorType, setErrorType] = useState<'generic' | 'permission'>('generic');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    db.init();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Tentativa de buscar usuário no DB
          const userData = await db.getUserFromDb(firebaseUser.uid);
          if (userData) {
            setUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          } else {
            // Se o login foi no Auth mas não existe no DB (ex: cadastro incompleto)
            // Permitimos o fluxo para que o Onboarding possa criar o perfil
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              role: UserRole.STUDENT // Default
            });
          }
        } else {
          setUser(null);
          localStorage.removeItem('currentUser');
        }
        setHasError(false);
      } catch (e: any) {
        console.error("Auth sync error detailed:", e);
        if (e.message?.includes('Permission denied') || e.code === 'PERMISSION_DENIED') {
          setErrorType('permission');
        } else {
          setErrorType('generic');
        }
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
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              
              <h2 className="text-3xl font-black mb-2 text-slate-900">Erro de Sincronização</h2>
              <p className="text-slate-500 max-w-md mb-8 font-medium">
                {errorType === 'permission' 
                  ? "As regras de segurança do seu banco de dados estão bloqueando o acesso." 
                  : "Não conseguimos conectar com o servidor do TREYO."}
              </p>

              {errorType === 'permission' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 text-left max-w-md w-full animate-slide-up">
                  <h4 className="text-xs font-black uppercase text-indigo-600 tracking-widest mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Solução do Arquiteto:
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-xs font-bold text-slate-600">
                      <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0">1</div>
                      Vá em 'Realtime Database' no Firebase.
                    </li>
                    <li className="flex gap-3 text-xs font-bold text-slate-600">
                      <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0">2</div>
                      Clique na aba 'Regras' (Rules).
                    </li>
                    <li className="flex gap-3 text-xs font-bold text-slate-600">
                      <div className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0">3</div>
                      Altere para: <code className="bg-slate-100 px-1 rounded">".read": "auth != null"</code>
                    </li>
                  </ul>
                  <a 
                    href="https://console.firebase.google.com/project/_/database/rules" 
                    target="_blank"
                    className="mt-6 block w-full bg-slate-900 text-white text-center py-3 rounded-xl font-bold text-xs"
                  >
                    Abrir Regras do Firebase <ExternalLink className="w-3 h-3 inline ml-1" />
                  </a>
                </div>
              )}

              <button 
                onClick={() => window.location.reload()} 
                className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
              >
                <RefreshCcw className="w-5 h-5" /> Tentar Novamente
              </button>
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
        </React.Fragment>
      )}
    </>
  );
}

export default App;
