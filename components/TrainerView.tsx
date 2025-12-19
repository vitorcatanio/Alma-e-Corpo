
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ProgressLog, UserRole, CalendarEvent, ChatMessage, ActivityLog } from '../types';
import { db } from '../services/storage';
import { 
    Users, Plus, ArrowLeft, Calendar as CalendarIcon, 
    MessageCircle, Send, Dumbbell, Utensils, ImageIcon, Scale, 
    BookOpen, Target, CheckSquare, Sparkles,
    Camera, Activity, ChevronRight, Clock, Star, Info,
    UserCircle, Ruler, AlertCircle, Loader2, Bell, TrendingUp,
    Search, Filter
} from 'lucide-react';

interface TrainerViewProps {
    user: User;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TrainerViewContent: React.FC<TrainerViewProps> = ({ user, activeTab, onTabChange }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
    
    // UI States
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'view_progress'>('list');
    const [showEventModal, setShowEventModal] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({ type: 'training', date: new Date().toISOString().split('T')[0], time: '08:00' });

    // Messaging
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const allUsers = await db.getAllUsersFromDb();
                const allProfs = await db.getAllProfilesFromDb();
                const studentList = allUsers.filter(u => u.role === UserRole.STUDENT);
                
                setStudents(studentList);
                setProfiles(allProfs);
                setEvents(db.getEvents(user.id));
                
                // Agrega atividades de todos os alunos para o feed global
                const activityFeed: ActivityLog[] = [];
                studentList.forEach(s => {
                    activityFeed.push(...db.getActivity(s.id));
                });
                setAllActivity(activityFeed.sort((a, b) => b.date.localeCompare(a.date)));

                if (activeChat) {
                    setChatMessages(db.getMessages(user.id, activeChat.id));
                }
            } catch (err) {
                console.error("Erro na sincronização do Personal:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [user.id, activeTab, activeChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSelectStudent = async (student: User) => {
        setIsActionLoading(true);
        setSelectedStudent(student);
        try {
            const profile = await db.getProfile(student.id);
            setSelectedProfile(profile || null);
            setBuilderState('manage');
        } catch (e) {
            console.error("Erro ao carregar perfil do aluno:", e);
        } finally {
            setIsActionLoading(false);
        }
    };

    const toggleModule = async (module: 'fitness' | 'spiritual' | 'reading') => {
        if (!selectedStudent || !selectedProfile) return;
        setIsActionLoading(true);
        try {
            const updatedProfile = { ...selectedProfile };
            updatedProfile.activeModules[module] = !updatedProfile.activeModules[module];
            await db.saveProfile(updatedProfile);
            setSelectedProfile(updatedProfile);
        } catch (e) {
            alert("Erro ao atualizar permissões do aluno.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.date) return;
        const event: CalendarEvent = {
            id: Date.now().toString(),
            trainerId: user.id,
            title: newEvent.title!,
            date: newEvent.date!,
            time: newEvent.time || '08:00',
            type: newEvent.type as any || 'training',
            description: newEvent.description,
            studentId: newEvent.studentId
        };
        db.addEvent(event);
        setEvents(db.getEvents(user.id));
        setShowEventModal(false);
        setNewEvent({ type: 'training', date: new Date().toISOString().split('T')[0], time: '08:00' });
    };

    const handleSendMessage = () => {
        if (!msgInput.trim() || !activeChat) return;
        const msg: ChatMessage = {
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: activeChat.id,
            content: msgInput,
            timestamp: new Date().toISOString(),
            read: false
        };
        db.sendMessage(msg);
        setChatMessages([...chatMessages, msg]);
        setMsgInput('');
    };

    if (loading && students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="font-bold">Carregando painel de controle...</p>
            </div>
        );
    }

    // --- ABA: VISÃO GERAL ---
    if (activeTab === 'dashboard') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral</h2>
                        <p className="text-slate-500 font-medium">Status global dos seus alunos e atividades.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase">Sincronizado</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total de Alunos" value={students.length} icon={Users} color="bg-indigo-600" />
                    <StatCard label="Módulos Ativos" value={profiles.filter(p => p.activeModules.fitness).length} icon={Activity} color="bg-emerald-500" />
                    <StatCard label="Eventos na Semana" value={events.length} icon={CalendarIcon} color="bg-amber-500" />
                    <StatCard label="Alertas Onboarding" value={students.filter(s => !profiles.find(p => p.userId === s.id)?.onboardingCompleted).length} icon={Bell} color="bg-rose-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Feed de Atividades */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                            <TrendingUp className="w-5 h-5 text-indigo-600"/> Atividade Recente
                        </h3>
                        <div className="space-y-4">
                            {allActivity.length === 0 ? (
                                <div className="py-10 text-center text-slate-400 font-medium italic">Nenhuma atividade registrada hoje.</div>
                            ) : (
                                allActivity.slice(0, 6).map(act => (
                                    <div key={act.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                                                {students.find(s => s.id === act.userId)?.name.charAt(0) || 'A'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{students.find(s => s.id === act.userId)?.name || 'Aluno'}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Treino Finalizado • {act.caloriesBurned?.toFixed(0)} kcal</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Alunos Pendentes */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                            <AlertCircle className="w-5 h-5 text-rose-500"/> Atenção Necessária
                        </h3>
                        <div className="space-y-3">
                            {students.filter(s => !profiles.find(p => p.userId === s.id)?.onboardingCompleted).map(s => (
                                <div key={s.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertCircle className="w-4 h-4"/></div>
                                        <div>
                                            <p className="text-sm font-bold text-rose-900">{s.name}</p>
                                            <p className="text-[10px] text-rose-600 font-black uppercase">Aguardando Onboarding</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleSelectStudent(s)} className="p-2 hover:bg-rose-200 rounded-lg text-rose-700 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {students.filter(s => !profiles.find(p => p.userId === s.id)?.onboardingCompleted).length === 0 && (
                                <div className="py-10 text-center text-slate-400 font-medium">Tudo em dia! Todos os alunos completaram o perfil.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- ABA: AGENDA ---
    if (activeTab === 'agenda') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Agenda Mestra</h2>
                        <p className="text-slate-500 font-medium">Controle de sessões e avaliações físicas.</p>
                    </div>
                    <button onClick={() => setShowEventModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                        <Plus className="w-5 h-5" /> Novo Evento
                    </button>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    {events.length === 0 ? (
                        <div className="py-20 text-center">
                            <CalendarIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold italic">Nenhum compromisso marcado para os próximos dias.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map(e => (
                                <div key={e.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 border border-indigo-100">
                                        <span className="text-[10px] font-black uppercase">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                        <span className="text-2xl font-black leading-none">{new Date(e.date).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 text-lg">{e.title}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><Clock className="w-3 h-3"/> {e.time}</span>
                                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">{e.type}</span>
                                        </div>
                                    </div>
                                    <button className="p-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500">
                                        <Info className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal de Evento */}
                {showEventModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slide-up">
                            <h3 className="text-2xl font-black mb-6">Agendar Compromisso</h3>
                            <div className="space-y-4">
                                <Input label="Título do Evento" value={newEvent.title} onChange={v => setNewEvent({...newEvent, title: v})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Data" type="date" value={newEvent.date} onChange={v => setNewEvent({...newEvent, date: v})} />
                                    <Input label="Horário" type="time" value={newEvent.time} onChange={v => setNewEvent({...newEvent, time: v})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Tipo</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                                        value={newEvent.type}
                                        onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                                    >
                                        <option value="training">Treino Individual</option>
                                        <option value="assessment">Avaliação Física</option>
                                        <option value="global">Evento Global</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowEventModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                                    <button onClick={handleAddEvent} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black shadow-xl">Salvar Evento</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- ABA: MENSAGENS ---
    if (activeTab === 'messages') {
        return (
            <div className="flex gap-8 h-[calc(100vh-200px)] animate-fade-in">
                {/* Lista de Contatos */}
                <div className="w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none" placeholder="Buscar aluno..." />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {students.map(s => (
                            <button 
                                key={s.id} 
                                onClick={() => setActiveChat(s)} 
                                className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${activeChat?.id === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50'}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${activeChat?.id === s.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                    {s.name.charAt(0)}
                                </div>
                                <div className="text-left flex-1 overflow-hidden">
                                    <p className="text-sm font-bold truncate">{s.name}</p>
                                    <p className={`text-[10px] font-medium uppercase truncate ${activeChat?.id === s.id ? 'text-indigo-200' : 'text-slate-400'}`}>Aluno</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Janela de Chat */}
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
                    {activeChat ? (
                        <>
                            <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                                    {activeChat.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900">{activeChat.name}</h4>
                                    <span className="text-[10px] text-green-500 font-black uppercase flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Ativo agora
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <MessageCircle className="w-16 h-16 mb-4 opacity-10" />
                                        <p className="font-bold">Diga "Olá" para {activeChat.name.split(' ')[0]}!</p>
                                    </div>
                                ) : (
                                    chatMessages.map(m => {
                                        const isMe = m.senderId === user.id;
                                        return (
                                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                                    <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                                                    <p className="text-[9px] mt-1 font-bold opacity-50 text-right">
                                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                                <input 
                                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-medium shadow-sm" 
                                    placeholder="Escreva sua mensagem..." 
                                    value={msgInput} 
                                    onChange={e => setMsgInput(e.target.value)} 
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
                                />
                                <button onClick={handleSendMessage} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:scale-105 transition-all">
                                    <Send className="w-6 h-6" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <MessageCircle className="w-16 h-16 opacity-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Central de Mensagens</h3>
                            <p className="max-w-xs font-medium">Selecione um aluno na lista ao lado para iniciar uma conversa.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- ABA: GESTÃO DE ALUNOS ---
    if (activeTab === 'students' && builderState === 'list') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                    <div className="flex gap-2">
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm"><Filter className="w-5 h-5"/></button>
                        <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors shadow-sm"><Plus className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map(s => (
                        <button key={s.id} onClick={() => handleSelectStudent(s)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{s.email}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                                <div className="flex gap-1">
                                    <div className={`w-2 h-2 rounded-full ${profiles.find(p => p.userId === s.id)?.activeModules.fitness ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                                    <div className={`w-2 h-2 rounded-full ${profiles.find(p => p.userId === s.id)?.activeModules.spiritual ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                                </div>
                                <div className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Gerenciar <ChevronRight className="w-3 h-3"/>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // --- VISÃO: GERENCIAR ALUNO ---
    if (selectedStudent && builderState === 'manage') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Voltar para Lista
                </button>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-10">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl mb-4 relative overflow-hidden">
                             {selectedStudent.name.charAt(0)}
                             <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 blur-xl"></div>
                        </div>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedProfile?.onboardingCompleted ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {selectedProfile?.onboardingCompleted ? 'Perfil Ativo' : 'Pendente Onboarding'}
                        </span>
                    </div>
                    
                    <div className="flex-1 space-y-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-1">{selectedStudent.name}</h2>
                            <p className="text-slate-500 font-medium">{selectedStudent.email}</p>
                        </div>

                        {selectedProfile ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <ProfileStat label="Idade" value={`${selectedProfile.age} anos`} icon={UserCircle} />
                                <ProfileStat label="Peso" value={`${selectedProfile.weight} kg`} icon={Scale} />
                                <ProfileStat label="Altura" value={`${selectedProfile.height} cm`} icon={Ruler} />
                                <ProfileStat label="Objetivo" value={selectedProfile.goal || 'TREYO'} icon={Target} />
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700 text-sm font-bold">
                                <AlertCircle className="w-5 h-5" /> Aluno aguardando preenchimento do formulário inicial.
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 pt-4">
                            <ModuleToggle label="Fitness" active={selectedProfile?.activeModules.fitness} onClick={() => toggleModule('fitness')} icon={Dumbbell} loading={isActionLoading} />
                            <ModuleToggle label="Espiritual" active={selectedProfile?.activeModules.spiritual} onClick={() => toggleModule('spiritual')} icon={Sparkles} loading={isActionLoading} />
                            <ModuleToggle label="Leitura" active={selectedProfile?.activeModules.reading} onClick={() => toggleModule('reading')} icon={BookOpen} loading={isActionLoading} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ToolCard icon={CheckSquare} title="Prescrever Treino" desc="Sincronize exercícios." onClick={() => onTabChange('students')} />
                    <ToolCard icon={Utensils} title="Plano Alimentar" desc="Macros e diretrizes." onClick={() => onTabChange('students')} />
                    <ToolCard icon={ImageIcon} title="Evolução Visual" desc="Fotos e timelapse." onClick={() => setBuilderState('view_progress')} />
                    <ToolCard icon={MessageCircle} title="Conversar" desc="Chat em tempo real." onClick={() => { setActiveChat(selectedStudent); onTabChange('messages'); }} />
                </div>
            </div>
        );
    }

    // --- VISÃO: EVOLUÇÃO VISUAL ---
    if (selectedStudent && builderState === 'view_progress') {
        const progress = db.getProgress(selectedStudent.id);
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Voltar ao Aluno
                </button>
                <h3 className="text-2xl font-black text-slate-900">Evolução de {selectedStudent.name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {progress.length === 0 ? (
                        <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold">
                            Nenhum registro visual encontrado para este aluno.
                        </div>
                    ) : (
                        progress.map(log => (
                            <div key={log.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                                <div className="aspect-square bg-slate-100">
                                    {log.photoUrl ? (
                                        <img src={log.photoUrl} className="w-full h-full object-cover" alt="Progresso" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Camera className="w-10 h-10 text-slate-200" /></div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-bold text-slate-900 text-lg">{log.weight} kg</p>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(log.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">{log.notes || 'Sem anotações.'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return null;
};

// --- Auxiliares ---
const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
            <Icon className="w-7 h-7" />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
    </div>
);

const ProfileStat = ({ label, value, icon: Icon }: any) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <Icon className="w-4 h-4 text-indigo-500 mb-1" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
);

const ModuleToggle = ({ label, active, onClick, icon: Icon, loading }: any) => (
    <button 
        disabled={loading} 
        onClick={onClick} 
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-300'} ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
    >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-4 h-4" />} {label} {active ? '✓' : ''}
    </button>
);

const ToolCard = ({ icon: Icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left hover:shadow-xl transition-all group">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="font-black text-slate-900 mb-2">{title}</h4>
        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{desc}</p>
    </button>
);

const Input = ({ label, type = 'text', value, onChange }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
        <input 
            type={type} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold text-slate-700" 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
        />
    </div>
);
