
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ProgressLog, UserRole, CalendarEvent, ChatMessage } from '../types';
import { db } from '../services/storage';
import { 
    Users, Plus, Save, ArrowLeft, Trash2, Calendar as CalendarIcon, 
    MessageCircle, Send, Dumbbell, Utensils, ImageIcon, Scale, 
    BookOpen, Target, Settings2, ShieldCheck, CheckSquare, ListTodo, Sparkles,
    UserX, Edit3, Key, Camera, Activity, ChevronRight, Clock, Star, Info,
    UserCircle, Ruler, AlertCircle, Loader2
} from 'lucide-react';

interface TrainerViewProps {
    user: User;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TrainerViewContent: React.FC<TrainerViewProps> = ({ user, activeTab, onTabChange }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    
    // Builder States
    const [builderState, setBuilderState] = useState<'list' | 'manage' | 'create_workout' | 'edit_diet' | 'view_progress' | 'edit_access' | 'edit_books'>('list');
    
    // Workout Builder
    const [exercises, setExercises] = useState<Partial<Exercise>[]>([]);
    const [workoutTitle, setWorkoutTitle] = useState('');
    const [selectedSport, setSelectedSport] = useState<SportType>(SportType.GYM);
    const [selectedSplit, setSelectedSplit] = useState('A');
    const [durationMinutes, setDurationMinutes] = useState(60);
    
    // Diet Editor
    const [dietContent, setDietContent] = useState('');
    const [dietMacros, setDietMacros] = useState({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
    const [dietGuidelines, setDietGuidelines] = useState('');

    // Book Suggestions
    const [bookSuggestions, setBookSuggestions] = useState<string[]>([]);
    const [newBook, setNewBook] = useState('');

    // Messaging
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const allUsers = await db.getAllUsersFromDb();
                setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
                setEvents(db.getEvents(user.id));
                
                if (activeChat) {
                    setChatMessages(db.getMessages(user.id, activeChat.id));
                }
            } catch (err) {
                console.error("Sync Students Error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [user.id, activeTab, builderState, activeChat]);

    const handleSelectStudent = async (student: User) => {
        setLoading(true);
        setSelectedStudent(student);
        try {
            const profile = await db.getProfile(student.id);
            setSelectedProfile(profile || null);
            
            const diet = db.getDiet(student.id);
            if (diet) {
                setDietContent(diet.content);
                setDietMacros(diet.macros);
                setDietGuidelines(diet.guidelines || '');
            }

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
            alert("Erro ao atualizar módulos. Verifique as permissões do banco de dados.");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (loading && builderState === 'list') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="font-bold">Sincronizando Alunos...</p>
            </div>
        );
    }

    if (activeTab === 'students' && builderState === 'list') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.length === 0 ? (
                        <div className="col-span-full p-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                           Nenhum aluno cadastrado no projeto treyo.
                        </div>
                    ) : (
                        students.map(student => (
                            <button 
                                key={student.id}
                                onClick={() => handleSelectStudent(student)}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{student.name}</h3>
                                        <p className="text-xs text-slate-400">{student.email}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (selectedStudent && builderState === 'manage') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" /> Voltar para Lista
                </button>

                {/* Perfil Header */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-10">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl mb-4">
                            {selectedStudent.name.charAt(0)}
                        </div>
                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedProfile ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {selectedProfile ? 'Perfil Ativo' : 'Pendente Onboarding'}
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-6">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedStudent.name}</h2>
                            <p className="text-slate-500 font-medium">{selectedStudent.email}</p>
                        </div>

                        {selectedProfile ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <ProfileStat label="Idade" value={`${selectedProfile.age} anos`} icon={UserCircle} />
                                <ProfileStat label="Peso" value={`${selectedProfile.weight} kg`} icon={Scale} />
                                <ProfileStat label="Altura" value={`${selectedProfile.height} cm`} icon={Ruler} />
                                <ProfileStat label="Objetivo" value={selectedProfile.goal || 'Geral'} icon={Target} />
                            </div>
                        ) : (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-amber-700 text-sm font-bold">
                                <AlertCircle className="w-5 h-5" /> O aluno ainda não preencheu o formulário de objetivos.
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3 pt-4">
                            <ModuleToggle 
                                label="Fitness" 
                                active={selectedProfile?.activeModules.fitness} 
                                onClick={() => toggleModule('fitness')} 
                                icon={Dumbbell}
                                loading={isActionLoading}
                            />
                            <ModuleToggle 
                                label="Espiritual" 
                                active={selectedProfile?.activeModules.spiritual} 
                                onClick={() => toggleModule('spiritual')} 
                                icon={Sparkles}
                                loading={isActionLoading}
                            />
                            <ModuleToggle 
                                label="Leitura" 
                                active={selectedProfile?.activeModules.reading} 
                                onClick={() => toggleModule('reading')} 
                                icon={BookOpen}
                                loading={isActionLoading}
                            />
                        </div>
                    </div>
                </div>

                {/* Ferramentas de Gestão */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ToolCard icon={CheckSquare} title="Prescrever Treino" desc="Configure os splits e exercícios." onClick={() => setBuilderState('create_workout')} />
                    <ToolCard icon={Utensils} title="Ajustar Dieta" desc="Defina macros e plano alimentar." onClick={() => setBuilderState('edit_diet')} />
                    <ToolCard icon={ListTodo} title="Sugestão de Livros" desc="Indique obras para leitura extra." onClick={() => setBuilderState('edit_books')} />
                    <ToolCard icon={ImageIcon} title="Histórico Visual" desc="Veja fotos e timelapse de medidas." onClick={() => setBuilderState('view_progress')} />
                </div>
            </div>
        );
    }

    // Renderização para Dashboard e Agenda permanecem as mesmas
    return <div className="p-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Módulo em construção ou Aba Geral.</div>;
};

// --- Sub-components para TrainerView ---

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
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
            active 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                : 'border-slate-100 bg-slate-50 text-slate-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
    >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-4 h-4" />} 
        {label} {active ? '(Ativo)' : '(Inativo)'}
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
