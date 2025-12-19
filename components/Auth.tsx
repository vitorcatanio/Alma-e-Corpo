
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { Key, ArrowRight, User as UserIcon, Lock, Mail, Activity, Sparkles, ShieldAlert } from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isTrainerMode, setIsTrainerMode] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');

    const REQUIRED_ACCESS_CODE = "amizades verdadeiras";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const roleToUse = isTrainerMode ? UserRole.TRAINER : UserRole.STUDENT;

        // Validação do Código de Acesso para Personal
        if (isTrainerMode && accessCode.toLowerCase() !== REQUIRED_ACCESS_CODE.toLowerCase()) {
            setError('Código de acesso administrativo inválido.');
            return;
        }

        if (isLogin) {
            const users = db.getUsers();
            const user = users.find(u => u.email === email && u.password === password && u.role === roleToUse);
            
            if (user) {
                onLogin(user);
            } else {
                setError(isTrainerMode ? 'Credenciais de Personal inválidas.' : 'Email ou senha inválidos.');
            }
        } else {
            // Register
            if (!name || !email || !password) {
                setError('Todos os campos são obrigatórios');
                return;
            }
            
            // Verificar se email já existe
            const users = db.getUsers();
            if (users.find(u => u.email === email)) {
                setError('Este email já está cadastrado.');
                return;
            }

            const newUser: User = {
                id: Date.now().toString(),
                name,
                email,
                role: roleToUse,
                password
            };
            db.registerUser(newUser);
            onLogin(newUser);
        }
    };

    const toggleTrainerMode = () => {
        setIsTrainerMode(!isTrainerMode);
        setError('');
        setEmail('');
        setPassword('');
        setAccessCode('');
        setName('');
    };

    return (
        <div className={`min-h-screen relative flex items-center justify-center p-6 overflow-hidden transition-colors duration-700 ease-in-out ${isTrainerMode ? 'bg-slate-950' : 'bg-[#F8FAFC]'}`}>
            
            {/* Background Decor Elements */}
            <div className={`absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none transition-opacity duration-700 ${isTrainerMode ? 'opacity-20' : 'opacity-100'}`}>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-[100px]"></div>
            </div>

            {/* Discrete Key for Trainer Access */}
            <button 
                onClick={toggleTrainerMode}
                className={`fixed top-8 right-8 z-50 group p-3 rounded-full transition-all duration-300 backdrop-blur-sm border ${
                    isTrainerMode 
                    ? 'bg-slate-900/50 border-slate-700 text-indigo-400 hover:bg-slate-800' 
                    : 'bg-white/50 border-slate-200 text-slate-300 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100'
                }`}
                title="Acesso Administrativo"
            >
                <Key className={`w-5 h-5 transition-transform duration-300 ${isTrainerMode ? 'rotate-90' : 'group-hover:rotate-12'}`} />
            </button>

            <div className="w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 min-h-[600px] animate-fade-in">
                
                {/* Left Side - Visual & Branding */}
                <div className={`relative hidden md:flex flex-col justify-between p-12 transition-all duration-700 ${isTrainerMode ? 'bg-slate-900' : 'bg-indigo-600'}`}>
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                         <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white/30 rounded-full"></div>
                         <div className="absolute bottom-20 left-10 w-24 h-24 bg-white/20 rounded-xl transform rotate-12"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-white mb-6">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                            <span className="font-bold tracking-widest text-sm opacity-80 uppercase">Corpo & Alma</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-tight mb-4">
                            TREYO
                        </h1>
                        <p className="text-indigo-100/80 text-lg leading-relaxed max-w-xs">
                            {isTrainerMode 
                                ? "Painel de Controle Administrativo para Personal Trainers e Gestores." 
                                : "Transforme sua vida integrando saúde física e espiritual em um único lugar."}
                        </p>
                    </div>

                    <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2">
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className={`w-8 h-8 rounded-full border-2 ${isTrainerMode ? 'border-slate-900 bg-slate-700' : 'border-indigo-600 bg-indigo-400'}`}></div>
                                ))}
                            </div>
                            <span className="text-white/80 text-xs font-medium pl-2">Comunidade TREYO ativa</span>
                         </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className={`p-10 md:p-12 flex flex-col justify-center transition-colors duration-500 ${isTrainerMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                    
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                            {isTrainerMode ? 'Acesso Personal' : isLogin ? 'Bem-vindo(a)' : 'Criar Conta'} 
                            {isTrainerMode && <Key className="w-5 h-5 text-indigo-400" />}
                            {!isLogin && !isTrainerMode && <Sparkles className="w-5 h-5 text-yellow-400" />}
                        </h2>
                        <p className={`text-sm ${isTrainerMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isTrainerMode 
                                ? 'Módulo administrativo restrito.' 
                                : isLogin ? 'Faça login para continuar sua evolução.' : 'Preencha seus dados para começar.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isTrainerMode ? 'text-slate-500' : 'text-slate-400'}`}>Nome Completo</label>
                                <div className="relative group">
                                    <UserIcon className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${isTrainerMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`} />
                                    <input 
                                        type="text" 
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
                                            isTrainerMode 
                                                ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500 placeholder-slate-600' 
                                                : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-indigo-600 placeholder-slate-400'
                                        }`}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isTrainerMode ? 'text-slate-500' : 'text-slate-400'}`}>Email</label>
                            <div className="relative group">
                                <Mail className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${isTrainerMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`} />
                                <input 
                                    type="email" 
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
                                        isTrainerMode 
                                            ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500 placeholder-slate-600' 
                                            : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-indigo-600 placeholder-slate-400'
                                    }`}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isTrainerMode ? 'text-slate-500' : 'text-slate-400'}`}>Senha</label>
                            <div className="relative group">
                                <Lock className={`absolute left-4 top-3.5 w-5 h-5 transition-colors ${isTrainerMode ? 'text-slate-500 group-focus-within:text-indigo-400' : 'text-slate-400 group-focus-within:text-indigo-600'}`} />
                                <input 
                                    type="password" 
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all font-medium ${
                                        isTrainerMode 
                                            ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500 placeholder-slate-600' 
                                            : 'bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-indigo-600 placeholder-slate-400'
                                    }`}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {isTrainerMode && (
                            <div className="space-y-1 animate-slide-up">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-400">Código de Acesso Administrativo</label>
                                <div className="relative group">
                                    <ShieldAlert className="absolute left-4 top-3.5 w-5 h-5 text-indigo-400" />
                                    <input 
                                        type="password" 
                                        placeholder="Digite o código secreto"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all font-bold bg-slate-800 border-indigo-500/30 text-white focus:border-indigo-400 placeholder-slate-600"
                                        value={accessCode}
                                        onChange={e => setAccessCode(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center justify-center gap-2 animate-shake">
                                <ShieldAlert className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transform transition-all hover:-translate-y-1 active:scale-[0.98] shadow-xl ${
                                isTrainerMode
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-300'
                            }`}
                        >
                            {isLogin ? 'Entrar' : 'Cadastrar'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="mt-8 text-center space-y-2">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className={`text-sm font-bold transition-colors hover:underline underline-offset-4 ${
                                isTrainerMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-600'
                            }`}
                        >
                            {isLogin ? "Não tem uma conta? Cadastre-se" : "Já possui conta? Fazer login"}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile Branding */}
            <div className="absolute top-6 left-6 md:hidden">
                <div className="flex items-center gap-2 text-slate-900">
                    <Activity className={`w-6 h-6 ${isTrainerMode ? 'text-white' : 'text-indigo-600'}`} />
                    <span className={`font-black text-xl tracking-tighter ${isTrainerMode ? 'text-white' : 'text-slate-900'}`}>TREYO</span>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>
        </div>
    );
};
