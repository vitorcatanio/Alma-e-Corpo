
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ProgressLog, UserRole, CalendarEvent, ChatMessage, ActivityLog } from '../types';
import { db } from '../services/storage';
import { 
    Users, Plus, ArrowLeft, Calendar as CalendarIcon, 
    MessageCircle, Send, Dumbbell, Utensils, ImageIcon, Scale, 
    BookOpen, Target, CheckSquare, Sparkles,
    Camera, Activity, ChevronRight, Clock, Star, Info,
    UserCircle, Ruler, AlertCircle, Loader2, Bell, TrendingUp,
    Search, Filter, Trash2, Edit3
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
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({ 
        type: 'training', 
        date: new Date().toISOString().split('T')[0], 
        time: '08:00',
        attendees: []
    });

    // Messaging
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [allUsers, allProfs, allEvents] = await Promise.all([
                    db.getAllUsersFromDb(),
                    db.getAllProfilesFromDb(),
                    db.getEvents()
                ]);

                const studentList = allUsers.filter(u => u.role === UserRole.STUDENT);
                setStudents(studentList);
                setProfiles(allProfs);
                setEvents(allEvents.filter(e => e.trainerId === user.id));
                
                // Agrega atividades de todos os alunos
                const activities: ActivityLog[] = [];
                for (const student of studentList) {
                    const studentActs = await db.getActivity(student.id);
                    activities.push(...studentActs);
                }
                setAllActivity(activities.sort((a, b) => b.date.localeCompare(a.date)));

                if (activeChat) {
                    const msgs = await db.getMessages(user.id, activeChat.id);
                    setChatMessages(msgs);
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
            alert("Erro ao atualizar permissões.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSaveEvent = async () => {
        if (!newEvent.title || !newEvent.date) return;
        const event: CalendarEvent = {
            id: editingEventId || Date.now().toString(),
            trainerId: user.id,
            title: newEvent.title!,
            date: newEvent.date!,
            time: newEvent.time || '08:00',
            type: newEvent.type as any || 'training',
            description: newEvent.description,
            studentId: newEvent.studentId,
            attendees: newEvent.attendees || []
        };
        await db.addEvent(event);
        const updatedEvents = await db.getEvents();
        setEvents(updatedEvents.filter(e => e.trainerId === user.id));
        setShowEventModal(false);
        setEditingEventId(null);
        setNewEvent({ type: 'training', date: new Date().toISOString().split('T')[0], time: '08:00', attendees: [] });
    };

    const handleDeleteEvent = async (id: string) => {
        if (confirm("Deseja realmente excluir este compromisso?")) {
            await db.deleteEvent(id);
            const updatedEvents = await db.getEvents();
            setEvents(updatedEvents.filter(e => e.trainerId === user.id));
        }
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setEditingEventId(event.id);
        setNewEvent(event);
        setShowEventModal(true);
    };

    const handleSendMessage = async () => {
        if (!msgInput.trim() || !activeChat) return;
        const msg: ChatMessage = {
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: activeChat.id,
            content: msgInput,
            timestamp: new Date().toISOString(),
            read: false
        };
        await db.sendMessage(msg);
        setChatMessages([...chatMessages, msg]);
        setMsgInput('');
    };

    if (loading && students.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="font-bold">Sincronizando Ecossistema Treyo...</p>
            </div>
        );
    }

    // --- RENDERING TABS ---

    const renderDashboard = () => (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral</h2>
                    <p className="text-slate-500 font-medium">Controle total de seus alunos e atividades.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total de Alunos" value={students.length} icon={Users} color="bg-indigo-600" />
                <StatCard label="Módulos Ativos" value={profiles.filter(p => p.activeModules.fitness).length} icon={Activity} color="bg-emerald-500" />
                <StatCard label="Eventos Agendados" value={events.length} icon={CalendarIcon} color="bg-amber-500" />
                <StatCard label="Alertas" value={students.filter(s => !profiles.find(p => p.userId === s.id)?.onboardingCompleted).length} icon={Bell} color="bg-rose-500" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                    <TrendingUp className="w-5 h-5 text-indigo-600"/> Atividade Recente
                </h3>
                <div className="space-y-4">
                    {allActivity.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 font-medium italic">Nenhuma atividade registrada ainda.</div>
                    ) : (
                        allActivity.slice(0, 5).map(act => (
                            <div key={act.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{students.find(s => s.id === act.userId)?.name || 'Aluno'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Treino Finalizado • {act.caloriesBurned?.toFixed(0)} kcal</p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(act.date).toLocaleTimeString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderAgenda = () => (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900">Agenda</h2>
                    <p className="text-slate-500 font-medium">Sessões, avaliações e eventos globais.</p>
                </div>
                <button onClick={() => { setEditingEventId(null); setNewEvent({ type: 'training', date: new Date().toISOString().split('T')[0], time: '08:00', attendees: [] }); setShowEventModal(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                    <Plus className="w-5 h-5" /> Novo Evento
                </button>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                {events.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 font-bold italic">Nenhum compromisso marcado.</div>
                ) : (
                    <div className="space-y-4">
                        {events.map(e => (
                            <div key={e.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group relative">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 border border-indigo-100">
                                    <span className="text-[10px] font-black uppercase">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                    <span className="text-2xl font-black leading-none">{new Date(e.date).getDate() + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-lg">{e.title}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium"><Clock className="w-3 h-3"/> {e.time}</span>
                                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest">{e.type}</span>
                                        <span className="text-indigo-600 font-black text-[10px] uppercase">{e.attendees?.length || 0} Confirmados</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditEvent(e)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 className="w-5 h-5" /></button>
                                    <button onClick={() => handleDeleteEvent(e.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showEventModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slide-up">
                        <h3 className="text-2xl font-black mb-6">{editingEventId ? 'Editar Evento' : 'Novo Evento'}</h3>
                        <div className="space-y-4">
                            <Input label="Título" value={newEvent.title} onChange={v => setNewEvent({...newEvent, title: v})} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Data" type="date" value={newEvent.date} onChange={v => setNewEvent({...newEvent, date: v})} />
                                <Input label="Hora" type="time" value={newEvent.time} onChange={v => setNewEvent({...newEvent, time: v})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-bold" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                                    <option value="training">Treino Individual</option>
                                    <option value="assessment">Avaliação Física</option>
                                    <option value="global">Evento Global</option>
                                </select>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowEventModal(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                                <button onClick={handleSaveEvent} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black shadow-xl">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMessages = () => (
        <div className="flex gap-8 h-[calc(100vh-200px)] animate-fade-in">
            <div className="w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <div className="relative"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none" placeholder="Buscar aluno..." /></div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {students.map(s => (
                        <button key={s.id} onClick={() => setActiveChat(s)} className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${activeChat?.id === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${activeChat?.id === s.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>{s.name.charAt(0)}</div>
                            <div className="text-left flex-1 overflow-hidden"><p className="text-sm font-bold truncate">{s.name}</p></div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
                {activeChat ? (
                    <>
                        <div className="p-6 border-b border-slate-50 flex items-center gap-4 bg-slate-50/50">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">{activeChat.name.charAt(0)}</div>
                            <div><h4 className="font-black text-slate-900">{activeChat.name}</h4><span className="text-[10px] text-green-500 font-black uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Aluno Online</span></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-4">
                            {chatMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300"><MessageCircle className="w-16 h-16 opacity-10 mb-4" /><p className="font-bold">Nenhuma mensagem ainda.</p></div>
                            ) : (
                                chatMessages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}><p className="text-sm font-medium leading-relaxed">{m.content}</p></div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                            <input className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-medium shadow-sm" placeholder="Escreva sua mensagem..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                            <button onClick={handleSendMessage} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:scale-105 transition-all"><Send className="w-6 h-6" /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center"><div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6"><MessageCircle className="w-16 h-16 opacity-10" /></div><h3 className="text-2xl font-black text-slate-900 mb-2">Central de Mensagens</h3><p className="font-medium max-w-xs">Selecione um aluno para começar.</p></div>
                )}
            </div>
        </div>
    );

    const renderStudentsList = () => (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map(s => (
                    <button key={s.id} onClick={() => handleSelectStudent(s)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{s.name.charAt(0)}</div>
                            <div><h3 className="font-bold text-lg text-slate-900">{s.name}</h3><p className="text-xs text-slate-500 font-medium">{s.email}</p></div>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-slate-50 text-[10px] font-black uppercase text-indigo-600">
                            Gerenciar Aluno <ChevronRight className="w-3 h-3"/>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    const renderStudentManagement = () => (
        <div className="space-y-8 animate-fade-in pb-20">
            <button onClick={() => { setBuilderState('list'); setSelectedStudent(null); }} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar para Lista</button>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-10">
                <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl mb-4">{selectedStudent?.name.charAt(0)}</div>
                <div className="flex-1 space-y-6">
                    <h2 className="text-3xl font-black text-slate-900">{selectedStudent?.name}</h2>
                    <div className="flex flex-wrap gap-3 pt-4">
                        <ModuleToggle label="Fitness" active={selectedProfile?.activeModules.fitness} onClick={() => toggleModule('fitness')} icon={Dumbbell} loading={isActionLoading} />
                        <ModuleToggle label="Espiritual" active={selectedProfile?.activeModules.spiritual} onClick={() => toggleModule('spiritual')} icon={Sparkles} loading={isActionLoading} />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ToolCard icon={CheckSquare} title="Prescrever Treino" desc="Sincronize exercícios." onClick={() => {}} />
                <ToolCard icon={ImageIcon} title="Evolução Visual" desc="Fotos e timelapse." onClick={() => setBuilderState('view_progress')} />
                <ToolCard icon={MessageCircle} title="Conversar" desc="Abrir chat direto." onClick={() => { setActiveChat(selectedStudent); onTabChange('messages'); }} />
            </div>
        </div>
    );

    const renderViewProgress = () => {
        // Mock de progresso visual (em um app real viria do DB)
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors"><ArrowLeft className="w-5 h-5" /> Voltar ao Aluno</button>
                <h3 className="text-2xl font-black text-slate-900">Evolução de {selectedStudent?.name}</h3>
                <div className="py-20 text-center text-slate-400 font-bold italic bg-white rounded-[2.5rem] border border-slate-100">
                    Nenhuma foto de progresso registrada por este aluno.
                </div>
            </div>
        );
    };

    // --- MAIN RENDER LOGIC ---
    if (activeTab === 'dashboard') return renderDashboard();
    if (activeTab === 'agenda') return renderAgenda();
    if (activeTab === 'messages') return renderMessages();
    if (activeTab === 'students') {
        if (builderState === 'list') return renderStudentsList();
        if (builderState === 'manage') return renderStudentManagement();
        if (builderState === 'view_progress') return renderViewProgress();
    }

    return null;
};

// --- Auxiliares ---
const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6"><div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><Icon className="w-7 h-7" /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div></div>
);
const ModuleToggle = ({ label, active, onClick, icon: Icon, loading }: any) => (
    <button disabled={loading} onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>{loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-4 h-4" />} {label}</button>
);
const ToolCard = ({ icon: Icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left hover:shadow-xl transition-all group"><div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><Icon className="w-6 h-6" /></div><h4 className="font-black text-slate-900 mb-2">{title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed">{desc}</p></button>
);
const Input = ({ label, type = 'text', value, onChange }: any) => (
    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label><input type={type} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold text-slate-700" value={value || ''} onChange={e => onChange(e.target.value)} /></div>
);
