
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ProgressLog, UserRole, CalendarEvent, ChatMessage, ActivityLog } from '../types';
import { db } from '../services/storage';
import { 
    Users, Plus, Save, ArrowLeft, Trash2, Calendar as CalendarIcon, 
    MessageCircle, Send, Dumbbell, Utensils, ImageIcon, Scale, 
    BookOpen, Target, Settings2, ShieldCheck, CheckSquare, ListTodo, Sparkles,
    UserX, Edit3, Key, Camera, Activity, ChevronRight, Clock, Star, Info,
    UserCircle, Ruler, AlertCircle, Loader2, LayoutDashboard, Bell, TrendingUp
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
    
    // Builder State
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'view_progress'>('list');
    
    // Messaging
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const allUsers = await db.getAllUsersFromDb();
                const allProfs = await db.getAllProfilesFromDb();
                const studentList = allUsers.filter(u => u.role === UserRole.STUDENT);
                
                setStudents(studentList);
                setProfiles(allProfs);
                setEvents(db.getEvents(user.id));
                
                const activityFeed: ActivityLog[] = [];
                studentList.forEach(s => {
                    activityFeed.push(...db.getActivity(s.id));
                });
                setAllActivity(activityFeed.sort((a, b) => b.date.localeCompare(a.date)));

                if (activeChat) {
                    setChatMessages(db.getMessages(user.id, activeChat.id));
                }
            } catch (err) {
                console.error("Sync Error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [user.id, activeTab, activeChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSelectStudent = async (student: User) => {
        setLoading(true);
        setSelectedStudent(student);
        try {
            const profile = await db.getProfile(student.id);
            setSelectedProfile(profile || null);
            setBuilderState('manage');
        } catch (e) {
            console.error("Profile load error:", e);
        } finally {
            setLoading(false);
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
            alert("Erro ao atualizar módulos.");
        } finally {
            setIsActionLoading(false);
        }
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
                <p className="font-bold">Sincronizando Ecossistema...</p>
            </div>
        );
    }

    // DASHBOARD
    if (activeTab === 'dashboard') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <h2 className="text-3xl font-black text-slate-900">Visão Geral</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total de Alunos" value={students.length} icon={Users} color="bg-indigo-600" />
                    <StatCard label="Módulos Ativos" value={profiles.filter(p => p.activeModules.fitness).length} icon={Activity} color="bg-emerald-500" />
                    <StatCard label="Atividades Hoje" value={allActivity.filter(a => a.date.startsWith(new Date().toISOString().split('T')[0])).length} icon={TrendingUp} color="bg-rose-500" />
                    <StatCard label="Alertas" value={students.filter(s => !profiles.find(p => p.userId === s.id)?.onboardingCompleted).length} icon={Bell} color="bg-amber-500" />
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600"/> Atividade Recente</h3>
                    <div className="space-y-4">
                        {allActivity.slice(0, 5).map(act => (
                            <div key={act.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{students.find(s => s.id === act.userId)?.name || 'Aluno'}</p>
                                    <p className="text-xs text-slate-500">Concluiu treino • {act.caloriesBurned?.toFixed(0)} kcal</p>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // AGENDA
    if (activeTab === 'agenda') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <h2 className="text-3xl font-black text-slate-900">Agenda</h2>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    {events.length === 0 ? (
                        <p className="text-center py-20 text-slate-400 font-bold italic">Nenhum compromisso marcado.</p>
                    ) : (
                        events.map(e => (
                            <div key={e.id} className="p-4 border-b border-slate-50 flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{e.title}</p>
                                    <p className="text-xs text-slate-500">{e.date} às {e.time}</p>
                                </div>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase">{e.type}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // MENSAGENS
    if (activeTab === 'messages') {
        return (
            <div className="flex gap-8 h-[calc(100vh-200px)] animate-fade-in">
                <div className="w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50 font-black">Conversas</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {students.map(s => (
                            <button key={s.id} onClick={() => setActiveChat(s)} className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${activeChat?.id === s.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold">{s.name.charAt(0)}</div>
                                <div className="text-left"><p className="text-sm font-bold truncate">{s.name}</p></div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    {activeChat ? (
                        <>
                            <div className="p-6 border-b border-slate-50 font-black">{activeChat.name}</div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                {chatMessages.map(m => (
                                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${m.senderId === user.id ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>
                                            <p className="text-sm">{m.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-6 border-t border-slate-50 flex gap-4">
                                <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" placeholder="Digite sua resposta..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                                <button onClick={handleSendMessage} className="bg-slate-900 text-white p-3 rounded-xl"><Send /></button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 font-bold">Selecione um aluno.</div>
                    )}
                </div>
            </div>
        );
    }

    // GESTÃO DE ALUNOS
    if (activeTab === 'students' && builderState === 'list') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.map(s => (
                        <button key={s.id} onClick={() => handleSelectStudent(s)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400">{s.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                                    <p className="text-xs text-slate-500">{s.email}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (selectedStudent && builderState === 'manage') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold"><ArrowLeft /> Voltar</button>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl">{selectedStudent.name.charAt(0)}</div>
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-black text-slate-900">{selectedStudent.name}</h2>
                        {selectedProfile ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <ProfileStat label="Idade" value={`${selectedProfile.age} anos`} icon={UserCircle} />
                                <ProfileStat label="Peso" value={`${selectedProfile.weight} kg`} icon={Scale} />
                                <ProfileStat label="Altura" value={`${selectedProfile.height} cm`} icon={Ruler} />
                                <ProfileStat label="Objetivo" value={selectedProfile.goal || 'Geral'} icon={Target} />
                            </div>
                        ) : <p className="text-amber-600 font-bold">Perfil pendente.</p>}
                        <div className="flex gap-3">
                            <ModuleToggle label="Fitness" active={selectedProfile?.activeModules.fitness} onClick={() => toggleModule('fitness')} icon={Dumbbell} loading={isActionLoading} />
                            <ModuleToggle label="Espiritual" active={selectedProfile?.activeModules.spiritual} onClick={() => toggleModule('spiritual')} icon={Sparkles} loading={isActionLoading} />
                        </div>
                        <div className="flex gap-4 pt-6">
                             <ToolCard icon={ImageIcon} title="Evolução Visual" desc="Fotos do aluno." onClick={() => setBuilderState('view_progress')} />
                             <ToolCard icon={CheckSquare} title="Prescrever" desc="Treinos/Dieta." onClick={() => onTabChange('students')} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedStudent && builderState === 'view_progress') {
        const progress = db.getProgress(selectedStudent.id);
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold"><ArrowLeft /> Voltar ao Aluno</button>
                <h3 className="text-2xl font-black">Evolução de {selectedStudent.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {progress.map(log => (
                        <div key={log.id} className="bg-white rounded-3xl overflow-hidden shadow-sm">
                            <div className="aspect-square bg-slate-100">
                                {log.photoUrl && <img src={log.photoUrl} className="w-full h-full object-cover" />}
                            </div>
                            <div className="p-4">
                                <p className="font-black">{log.weight} kg</p>
                                <p className="text-xs text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

// --- Auxiliares ---
const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><Icon className="w-6 h-6" /></div>
        <div><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="text-xl font-black">{value}</p></div>
    </div>
);
const ProfileStat = ({ label, value, icon: Icon }: any) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <Icon className="w-4 h-4 text-indigo-500 mb-1" />
        <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
        <p className="text-sm font-bold">{value}</p>
    </div>
);
const ModuleToggle = ({ label, active, onClick, icon: Icon, loading }: any) => (
    <button disabled={loading} onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-4 h-4" />} {label}
    </button>
);
const ToolCard = ({ icon: Icon, title, desc, onClick }: any) => (
    <button onClick={onClick} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left hover:bg-white hover:shadow-lg transition-all flex-1">
        <Icon className="w-6 h-6 text-indigo-500 mb-2" />
        <p className="font-bold text-sm">{title}</p>
        <p className="text-[10px] text-slate-400 uppercase">{desc}</p>
    </button>
);
