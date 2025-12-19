
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { fazerLogin, cadastrarUsuario } from '../auth-service';
import { auth } from '../firebase-config';
import { 
    ArrowRight, User as UserIcon, Lock, Mail, Activity, 
    ShieldAlert, Loader2, Check, Shield
} from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
    setAuthProcessStatus: (status: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, setAuthProcessStatus }) => {
    // O sistema sempre abre no modo ALUNO por padrão
    const [isLogin, setIsLogin] = useState(true);
    const [isTrainerMode, setIsTrainerMode] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [lembrarMe, setLembrarMe] = useState(true);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    const REQUIRED_ACCESS_CODE = "amizades verdadeiras";

    // Reseta o formulário ao trocar de modo
    useEffect(() => {
        setEmail('');
        setPassword('');
        setError('');
        setAccessCode('');
    }, [isTrainerMode, isLogin]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setAuthProcessStatus(true);

        const roleToUse = isTrainerMode ? UserRole.TRAINER : UserRole.STUDENT;

        try {
            if (isTrainerMode && accessCode.toLowerCase() !== REQUIRED_ACCESS_CODE.toLowerCase()) {
                throw new Error('Código administrativo incorreto.');
            }

            if (isLogin) {
                const firebaseUser = await fazerLogin(email, password, lembrarMe);
                if (firebaseUser) {
                    const userData = await db.getUserFromDb(firebaseUser.uid);
                    
                    if (userData) {
                        if (userData.role !== roleToUse) {
                            await auth.signOut();
                            throw new Error(`Acesso Negado: Perfil incorreto para este modo de entrada.`);
                        }
                        onLogin(userData);
                    } else {
                        const newUser: User = { id: firebaseUser.uid, name: firebaseUser.displayName || 'Usuário', email: firebaseUser.email!, role: roleToUse };
                        await db.saveUserToDb(newUser);
                        onLogin(newUser);
                    }
                }
            } else {
                if (!name || !email || !password) throw new Error('Preencha todos os campos obrigatórios.');
                const userCredential = await cadastrarUsuario(email, password, name, roleToUse);
                const newUser: User = { id: userCredential.user.uid, name, email, role: roleToUse };
                onLogin(newUser);
            }
        } catch (err: any) {
            setAuthProcessStatus(false);
            let msg = err.message;
            if (err.code === 'auth/invalid-credential') msg = "E-mail ou senha incorretos.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-6 bg-slate-50 transition-colors duration-700 ${isTrainerMode ? 'bg-indigo-950/5' : ''}`}>
            
            <div className="w-full max-w-[980px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 relative">
                
                {/* Painel de Identidade (Esquerda) */}
                <div className={`relative hidden md:flex flex-col justify-between p-12 transition-all duration-700 ${isTrainerMode ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                    <div className="text-white">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="w-6 h-6" />
                            <span className="font-bold tracking-widest text-[10px] uppercase opacity-60">TREYO PLATFORM</span>
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4">TREYO</h1>
                        <p className="opacity-80 text-lg max-w-xs font-medium leading-relaxed">
                            {isTrainerMode 
                                ? 'Gerenciamento profissional para o seu ecossistema de alunos.' 
                                : 'Conectando seu desenvolvimento físico à sua jornada espiritual.'}
                        </p>
                    </div>
                </div>

                {/* Painel de Acesso (Direita) */}
                <div className="p-10 md:p-14 flex flex-col justify-center bg-white">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                            {isTrainerMode ? 'Admin Portal' : isLogin ? 'Olá Aluno' : 'Criar Conta'}
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                            {isTrainerMode ? 'Acesso Administrativo Treyo' : 'Seu painel de evolução pessoal'}
                        </p>
                    </div>

                    <form 
                        key={isTrainerMode ? 'auth-personal' : 'auth-aluno'}
                        onSubmit={handleSubmit} 
                        className="space-y-5"
                        autoComplete="off"
                    >
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                                    <input required type="text" placeholder="Como deseja ser chamado?" className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">E-mail de Acesso</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                                <input 
                                    required 
                                    type="email" 
                                    name={isTrainerMode ? "trainer_login" : "student_login"}
                                    placeholder="seuemail@exemplo.com"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                                <input 
                                    required 
                                    type="password" 
                                    name={isTrainerMode ? "trainer_pwd" : "student_pwd"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex items-center gap-3 py-1">
                                <button 
                                    type="button"
                                    onClick={() => setLembrarMe(!lembrarMe)}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${lembrarMe ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200'}`}
                                >
                                    {lembrarMe && <Check className="w-4 h-4" />}
                                </button>
                                <span className="text-xs font-bold text-slate-400">Manter conectado</span>
                            </div>
                        )}

                        {isTrainerMode && (
                            <div className="space-y-1 animate-slide-up">
                                <label className="text-[10px] font-black uppercase text-indigo-500 ml-1">Chave de Segurança</label>
                                <input required type="password" placeholder="Código Admin" className="w-full px-6 py-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50 focus:bg-white focus:border-indigo-500 outline-none font-black tracking-widest text-indigo-900" value={accessCode} onChange={e => setAccessCode(e.target.value)} />
                            </div>
                        )}

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 text-red-500 text-[11px] font-bold flex items-center gap-3 animate-pulse">
                                <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}

                        <button disabled={isLoading} type="submit" className={`w-full py-5 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xl ${isTrainerMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                            {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
                            {isLogin ? "Ainda não tem cadastro?" : "Já possui conta? Entre agora"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Alternador de Modo Master - Ultra Discreto no Canto Inferior */}
            <div className="fixed bottom-6 right-6">
                <button 
                    onClick={() => setIsTrainerMode(!isTrainerMode)}
                    className="p-3 text-slate-200 hover:text-indigo-400 transition-all opacity-20 hover:opacity-100 group flex items-center gap-2"
                    title={isTrainerMode ? "Voltar ao Modo Aluno" : "Acesso Personal"}
                >
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
                        {isTrainerMode ? 'PORTAL ALUNO' : 'PORTAL ADMIN'}
                    </span>
                    <Shield className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
