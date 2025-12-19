
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { fazerLogin, cadastrarUsuario } from '../auth-service';
import { Key, ArrowRight, User as UserIcon, Lock, Mail, Activity, ShieldAlert, Loader2 } from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isTrainerMode, setIsTrainerMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    const REQUIRED_ACCESS_CODE = "amizades verdadeiras";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
                        // Se por algum motivo o Auth existe mas o DB não, criamos um registro básico
                        const newUser: User = { id: firebaseUser.uid, name: firebaseUser.displayName || 'Usuário', email: firebaseUser.email!, role: roleToUse };
                        await db.saveUserToDb(newUser);
                        onLogin(newUser);
                    }
                }
            } else {
                if (!name || !email || !password) {
                    throw new Error('Todos os campos são obrigatórios');
                }
                
                // Passando o roleToUse para o serviço de cadastro
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
            let msg = err.message;
            if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
            if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
            if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTrainerMode = () => {
        setIsTrainerMode(!isTrainerMode);
        setError('');
    };

    return (
        <div className={`min-h-screen relative flex items-center justify-center p-6 overflow-hidden transition-colors duration-700 ease-in-out ${isTrainerMode ? 'bg-slate-950' : 'bg-[#F8FAFC]'}`}>
            <div className={`absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none transition-opacity duration-700 ${isTrainerMode ? 'opacity-20' : 'opacity-100'}`}>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <button 
                onClick={toggleTrainerMode}
                disabled={isLoading}
                title={isTrainerMode ? "Mudar para modo Aluno" : "Mudar para modo Personal"}
                className={`fixed top-8 right-8 z-50 group p-3 rounded-full transition-all duration-300 backdrop-blur-sm border ${
                    isTrainerMode 
                    ? 'bg-slate-900/50 border-slate-700 text-indigo-400 hover:bg-slate-800' 
                    : 'bg-white/50 border-slate-200 text-slate-300 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg'
                }`}
            >
                <Key className={`w-5 h-5 transition-transform duration-300 ${isTrainerMode ? 'rotate-90' : 'group-hover:rotate-12'}`} />
            </button>

            <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 min-h-[600px] animate-fade-in">
                <div className={`relative hidden md:flex flex-col justify-between p-12 transition-all duration-700 ${isTrainerMode ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                    <div className="relative z-10 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6" />
                            <span className="font-bold tracking-widest text-sm uppercase opacity-80">Corpo & Alma</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight mb-4">TREYO</h1>
                        <p className="opacity-80 text-lg max-w-xs">
                            {isTrainerMode ? "Módulo administrativo para gestão de alunos." : "Saúde física e espiritual em um único lugar."}
                        </p>
                    </div>
                </div>

                <div className={`p-10 md:p-12 flex flex-col justify-center ${isTrainerMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">{isTrainerMode ? 'Acesso Personal' : isLogin ? 'Bem-vindo(a)' : 'Criar Conta'}</h2>
                        <p className="text-sm opacity-60">{isLogin ? 'Entre com seus dados salvos na nuvem.' : 'Crie sua conta persistente.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-3.5 w-5 h-5 opacity-40" />
                                    <input required type="text" className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} value={name} onChange={e => setName(e.target.value)} />
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 w-5 h-5 opacity-40" />
                                <input required type="email" className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 w-5 h-5 opacity-40" />
                                <input required type="password" className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all ${isTrainerMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`} value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                        </div>
                        {isTrainerMode && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-400">Código Administrativo</label>
                                <input required type="password" className="w-full px-4 py-3 rounded-xl border-2 outline-none bg-slate-800 border-indigo-500/30" value={accessCode} onChange={e => setAccessCode(e.target.value)} />
                            </div>
                        )}
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2 animate-shake">
                                <ShieldAlert className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <button disabled={isLoading} type="submit" className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl ${isTrainerMode ? 'bg-indigo-600' : 'bg-slate-900 text-white'} disabled:opacity-50`}>
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isLogin ? 'Entrar' : 'Cadastrar'}
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button disabled={isLoading} onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold opacity-60 hover:opacity-100 hover:underline">
                            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já possui conta? Fazer login"}
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};
