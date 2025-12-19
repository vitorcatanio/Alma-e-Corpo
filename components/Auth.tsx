
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { fazerLogin, cadastrarUsuario } from '../auth-service';
import { auth } from '../firebase-config';
import { 
    Key, ArrowRight, User as UserIcon, Lock, Mail, Activity, 
    ShieldAlert, Loader2, RefreshCw, Check
} from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
    setAuthProcessStatus: (status: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, setAuthProcessStatus }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isTrainerMode, setIsTrainerMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const [lembrarMe, setLembrarMe] = useState(true);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    const REQUIRED_ACCESS_CODE = "amizades verdadeiras";

    // Limpa campos ao trocar entre Login e Cadastro ou Trainer/Student
    useEffect(() => {
        setEmail('');
        setPassword('');
        setError('');
        setAccessCode('');
    }, [isLogin, isTrainerMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setAuthProcessStatus(true); // Bloqueia o observador automático do App.tsx

        const roleToUse = isTrainerMode ? UserRole.TRAINER : UserRole.STUDENT;

        try {
            if (isTrainerMode && accessCode.toLowerCase() !== REQUIRED_ACCESS_CODE.toLowerCase()) {
                throw new Error('Código de acesso administrativo inválido.');
            }

            if (isLogin) {
                // A função fazerLogin agora limpa a sessão antes de entrar
                const firebaseUser = await fazerLogin(email, password, lembrarMe);
                if (firebaseUser) {
                    const userData = await db.getUserFromDb(firebaseUser.uid);
                    
                    if (userData) {
                        if (userData.role !== roleToUse) {
                            await auth.signOut();
                            throw new Error(`Esta conta (${email}) está registrada como ${userData.role === 'trainer' ? 'Personal' : 'Aluno'}. Por favor, alterne o modo de acesso acima.`);
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
            console.error("Auth System Error:", err);
            setAuthProcessStatus(false);

            let msg = err.message;
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                msg = "E-mail ou senha incorretos para este perfil.";
            } else if (err.code === 'auth/too-many-requests') {
                msg = "Muitas tentativas. Tente novamente em alguns minutos.";
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTrainerMode = () => {
        setIsTrainerMode(!isTrainerMode);
    };

    return (
        <div className={`min-h-screen relative flex items-center justify-center p-6 transition-colors duration-700 ${isTrainerMode ? 'bg-slate-950' : 'bg-[#F8FAFC]'}`}>
            {/* Botão de Alternância de Modo - Fora do formulário */}
            <button 
                type="button"
                onClick={toggleTrainerMode}
                disabled={isLoading}
                className={`fixed top-8 right-8 z-50 p-4 rounded-full transition-all duration-300 border flex items-center gap-2 font-bold text-[10px] tracking-widest uppercase ${
                    isTrainerMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-white border-slate-200 text-slate-400'
                }`}
            >
                <Key className="w-4 h-4" />
                {isTrainerMode ? 'Acessar como Personal' : 'Acessar como Aluno'}
            </button>

            <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 min-h-[650px] border border-slate-100">
                <div className={`relative hidden md:flex flex-col justify-between p-12 transition-all duration-700 ${isTrainerMode ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                    <div className="text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6" />
                            <span className="font-bold tracking-widest text-[10px] uppercase opacity-80">TREYO PLATFORM</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4">TREYO</h1>
                        <p className="opacity-80 text-lg max-w-xs font-medium leading-relaxed">
                            Contas separadas, objetivos unidos. Sincronize sua evolução.
                        </p>
                    </div>
                </div>

                <div className={`p-10 md:p-14 flex flex-col justify-center ${isTrainerMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    {showTroubleshooting ? (
                        <div className="space-y-6 text-center">
                            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                            <h2 className="text-xl font-bold">Erro Crítico</h2>
                            <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold">Reiniciar App</button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-10">
                                <h2 className="text-4xl font-black mb-2 tracking-tight">
                                    {isTrainerMode ? 'Personal' : isLogin ? 'Olá Aluno' : 'Novo Aluno'}
                                </h2>
                                <p className="text-sm opacity-50 font-medium italic">
                                    {isTrainerMode ? 'vitor_catanio@hotmail.com' : 'vitorcatanio@gmail.com'}
                                </p>
                            </div>

                            {/* 
                                A 'key' no formulário é o segredo aqui. 
                                Ao mudar a key, o React destrói o formulário antigo e cria um novo, 
                                o que impede o navegador de sugerir a senha errada do modo anterior.
                            */}
                            <form 
                                key={isTrainerMode ? 'trainer-form' : 'student-form'} 
                                onSubmit={handleSubmit} 
                                className="space-y-5" 
                                autoComplete="off"
                            >
                                {!isLogin && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Nome</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-4 w-5 h-5 opacity-30" />
                                            <input required type="text" name="user_fullname" className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} value={name} onChange={e => setName(e.target.value)} />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">E-mail de Acesso</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-4 w-5 h-5 opacity-30" />
                                        <input 
                                            required 
                                            type="email" 
                                            name={isTrainerMode ? "trainer_email_field" : "student_email_field"} 
                                            placeholder={isTrainerMode ? "seu_personal@email.com" : "seu_aluno@email.com"}
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} 
                                            value={email} 
                                            onChange={e => setEmail(e.target.value)} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Sua Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-4 w-5 h-5 opacity-30" />
                                        <input 
                                            required 
                                            type="password" 
                                            name={isTrainerMode ? "trainer_pass_field" : "student_pass_field"} 
                                            autoComplete="new-password"
                                            className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none font-bold ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100 focus:border-indigo-500'}`} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                {isLogin && (
                                    <div className="flex items-center gap-3 py-2">
                                        <button 
                                            type="button"
                                            onClick={() => setLembrarMe(!lembrarMe)}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                lembrarMe 
                                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                : isTrainerMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'
                                            }`}
                                        >
                                            {lembrarMe && <Check className="w-4 h-4" />}
                                        </button>
                                        <span className="text-xs font-bold opacity-60">Lembrar neste aparelho</span>
                                    </div>
                                )}

                                {isTrainerMode && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-400">Código Administrativo</label>
                                        <input required type="password" placeholder="Código de Segurança" className="w-full px-6 py-4 rounded-2xl border-2 outline-none bg-slate-800 border-indigo-500/30 text-indigo-100 font-black tracking-widest" value={accessCode} onChange={e => setAccessCode(e.target.value)} />
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold flex items-center gap-3 animate-pulse">
                                        <ShieldAlert className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <button disabled={isLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50 ${isTrainerMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar no Sistema'}
                                    {!isLoading && <ArrowRight className="w-5 h-5" />}
                                </button>
                            </form>

                            <div className="mt-10 text-center">
                                <button disabled={isLoading} type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity underline decoration-indigo-500/30 underline-offset-8">
                                    {isLogin ? "Ainda não tem cadastro?" : "Já possui uma conta?"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
