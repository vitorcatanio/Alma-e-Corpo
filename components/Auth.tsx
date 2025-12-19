
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { fazerLogin, cadastrarUsuario } from '../auth-service';
import { auth } from '../firebase-config';
import { 
    Key, ArrowRight, User as UserIcon, Lock, Mail, Activity, 
    ShieldAlert, Loader2, ExternalLink, AlertTriangle, RefreshCw, Terminal
} from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isTrainerMode, setIsTrainerMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    const REQUIRED_ACCESS_CODE = "amizades verdadeiras";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowTroubleshooting(false);
        setIsLoading(true);

        const roleToUse = isTrainerMode ? UserRole.TRAINER : UserRole.STUDENT;

        try {
            if (isTrainerMode && accessCode.toLowerCase() !== REQUIRED_ACCESS_CODE.toLowerCase()) {
                throw new Error('Código de acesso administrativo inválido.');
            }

            if (isLogin) {
                const firebaseUser = await fazerLogin(email, password);
                if (firebaseUser) {
                    const userData = await db.getUserFromDb(firebaseUser.uid);
                    if (userData) {
                        if (userData.role !== roleToUse) {
                            throw new Error(`Esta conta está registrada como ${userData.role === 'trainer' ? 'Personal' : 'Aluno'}. Mude o modo de acesso.`);
                        }
                        onLogin(userData);
                    } else {
                        const newUser: User = { id: firebaseUser.uid, name: firebaseUser.displayName || 'Usuário', email: firebaseUser.email!, role: roleToUse };
                        await db.saveUserToDb(newUser);
                        onLogin(newUser);
                    }
                }
            } else {
                if (!name || !email || !password) {
                    throw new Error('Todos os campos são obrigatórios');
                }
                
                const userCredential = await cadastrarUsuario(email, password, name, roleToUse);
                const newUser: User = {
                    id: userCredential.user.uid,
                    name,
                    email,
                    role: roleToUse
                };
                onLogin(newUser);
            }
        } catch (err: any) {
            console.error("Auth System Diagnostic:", {
                code: err.code,
                message: err.message,
                projectId: auth.app.options.projectId,
                apiKey: auth.app.options.apiKey?.substring(0, 10) + "..."
            });

            let msg = err.message;
            
            if (err.code === 'auth/operation-not-allowed') {
                msg = "Método de login ainda bloqueado pelo Firebase.";
                setShowTroubleshooting(true);
            } else if (err.code === 'auth/email-already-in-use') {
                msg = "Este e-mail já está em uso.";
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                msg = "E-mail ou senha incorretos.";
            } else if (err.code === 'auth/weak-password') {
                msg = "A senha deve ter pelo menos 6 caracteres.";
            } else if (err.code === 'auth/invalid-email') {
                msg = "O formato do e-mail é inválido.";
            }
            
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTrainerMode = () => {
        setIsTrainerMode(!isTrainerMode);
        setError('');
        setShowTroubleshooting(false);
    };

    return (
        <div className={`min-h-screen relative flex items-center justify-center p-6 overflow-hidden transition-colors duration-700 ease-in-out ${isTrainerMode ? 'bg-slate-950' : 'bg-[#F8FAFC]'}`}>
            {/* Background Decor */}
            <div className={`absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none transition-opacity duration-700 ${isTrainerMode ? 'opacity-20' : 'opacity-100'}`}>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <button 
                onClick={toggleTrainerMode}
                disabled={isLoading}
                className={`fixed top-8 right-8 z-50 p-3 rounded-full transition-all duration-300 backdrop-blur-sm border ${
                    isTrainerMode ? 'bg-slate-900/50 border-slate-700 text-indigo-400' : 'bg-white/50 border-slate-200 text-slate-300'
                }`}
            >
                <Key className="w-5 h-5" />
            </button>

            <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 min-h-[650px] border border-slate-100 animate-fade-in">
                <div className={`relative hidden md:flex flex-col justify-between p-12 transition-all duration-700 ${isTrainerMode ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                    <div className="text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6" />
                            <span className="font-bold tracking-widest text-[10px] uppercase opacity-80">TREYO PLATFORM</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4">TREYO</h1>
                        <p className="opacity-80 text-lg max-w-xs font-medium leading-relaxed">
                            A sincronização na nuvem permite que seus dados de treino e leitura estejam em todos os seus dispositivos.
                        </p>
                    </div>
                </div>

                <div className={`p-10 md:p-14 flex flex-col justify-center ${isTrainerMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    
                    {showTroubleshooting ? (
                        <div className="space-y-6 animate-slide-up">
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem]">
                                <h3 className="text-red-500 font-black flex items-center gap-2 mb-2 text-sm">
                                    <ShieldAlert className="w-5 h-5" /> DIAGNÓSTICO TÉCNICO
                                </h3>
                                <p className="text-xs font-bold leading-relaxed opacity-80 text-red-700">
                                    O Firebase ainda está recusando a conexão para E-mail/Senha. 
                                    Isso é um problema de "Infra-como-Código".
                                </p>
                            </div>

                            <div className="bg-slate-100 p-6 rounded-3xl space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Confirmação de Identidade:</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-mono">
                                        <span className="font-bold">Project ID:</span>
                                        <span className="text-indigo-600">{auth.app.options.projectId}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-mono">
                                        <span className="font-bold">API Key:</span>
                                        <span className="text-indigo-600">***{auth.app.options.apiKey?.slice(-6)}</span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200">
                                    <p className="text-[10px] font-bold text-slate-500">
                                        ⚠️ IMPORTANTE: Se o Project ID acima for diferente do ID que aparece no seu console, você está configurando o projeto errado.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a 
                                    href={`https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=${auth.app.options.projectId}`}
                                    target="_blank" 
                                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                                >
                                    <ExternalLink className="w-4 h-4" /> 1. Habilitar API no Google Cloud
                                </a>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="w-full border-2 border-slate-200 text-slate-600 py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" /> 2. Recarregar App (Limpar Cache)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10">
                                <h2 className="text-4xl font-black mb-2 tracking-tight">
                                    {isTrainerMode ? 'Acesso Personal' : isLogin ? 'Bem-vindo' : 'Criar Conta'}
                                </h2>
                                <p className="text-sm opacity-50 font-medium">
                                    {isLogin ? 'Entre para sincronizar seus treinos.' : 'Inicie sua jornada hoje.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {!isLogin && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-40">Nome</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-4 w-5 h-5 opacity-30" />
                                            <input required type="text" className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} value={name} onChange={e => setName(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-40">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-4 w-5 h-5 opacity-30" />
                                        <input required type="email" className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} value={email} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-1 opacity-40">Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-4 w-5 h-5 opacity-30" />
                                        <input required type="password" className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                </div>
                                {isTrainerMode && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-400">Código Master</label>
                                        <input required type="password" placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl border-2 outline-none bg-slate-800 border-indigo-500/30 text-indigo-100 font-black tracking-widest" value={accessCode} onChange={e => setAccessCode(e.target.value)} />
                                    </div>
                                )}
                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold flex items-center gap-3 animate-shake">
                                        <ShieldAlert className="w-5 h-5" /> {error}
                                    </div>
                                )}
                                <button disabled={isLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isTrainerMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isLogin ? 'Entrar' : 'Cadastrar'}
                                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                                </button>
                            </form>

                            <div className="mt-10 text-center">
                                <button disabled={isLoading} onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity">
                                    {isLogin ? "Não tem conta? Cadastre-se" : "Já é membro? Entre aqui"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};
