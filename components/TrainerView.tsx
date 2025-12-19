
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, SportType, Exercise, DietPlan, ProgressLog, UserRole, CalendarEvent, ChatMessage } from '../types';
import { db } from '../services/storage';
import { 
    Users, Plus, Save, ArrowLeft, Trash2, Calendar as CalendarIcon, 
    MessageCircle, Send, Dumbbell, Utensils, ImageIcon, Scale, 
    BookOpen, Target, Settings2, ShieldCheck, CheckSquare, ListTodo, Sparkles,
    UserX, Edit3, Key, Camera, Activity, ChevronRight, Clock, Star, Info
} from 'lucide-react';

interface TrainerViewProps {
    user: User;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const TrainerViewContent: React.FC<TrainerViewProps> = ({ user, activeTab, onTabChange }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
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

    // Access Editor
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');

    // Calendar Creation
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '', type: 'global' as const });

    // Messaging
    const [activeChat, setActiveChat] = useState<User | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const load = () => {
            const allUsers = db.getUsers();
            setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
            setEvents(db.getEvents(user.id));
            setLoading(false);
            
            if (activeChat) {
                setChatMessages(db.getMessages(user.id, activeChat.id));
            }
        };
        load();
        const interval = setInterval(load, 3000);
        return () => clearInterval(interval);
    }, [user.id, activeTab, builderState, activeChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSelectStudent = (student: User) => {
        setSelectedStudent(student);
        const profile = db.getProfile(student.id);
        const diet = db.getDiet(student.id);
        
        if (diet) {
            setDietContent(diet.content);
            setDietMacros(diet.macros);
            setDietGuidelines(diet.guidelines || '');
        } else {
            setDietContent('');
            setDietMacros({ calories: 2000, protein: 150, carbs: 200, fats: 60 });
            setDietGuidelines('');
        }

        if (profile?.bookSuggestions) {
            setBookSuggestions(profile.bookSuggestions);
        } else {
            setBookSuggestions([]);
        }
        
        setBuilderState('manage');
    };

    const handleSaveWorkout = () => {
        if (!selectedStudent || !workoutTitle || exercises.length === 0) return;
        
        const newWorkout: WorkoutPlan = {
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            sportType: selectedSport,
            split: selectedSplit,
            title: workoutTitle,
            exercises: exercises.map(ex => ({
                id: Math.random().toString(36).substr(2, 9),
                name: ex.name || 'Exercício',
                type: selectedSport === SportType.GYM ? 'strength' : 'cardio',
                sets: ex.sets || 0,
                reps: ex.reps || '0',
                load: ex.load || '0',
                distance: ex.distance || '0',
                duration: ex.duration || '0',
                pace: ex.pace || '0',
                rest: ex.rest || '60s',
                completed: false
            })) as Exercise[],
            assignedDate: new Date().toISOString(),
            estimatedCalories: 300,
            durationMinutes: durationMinutes
        };

        db.saveWorkout(newWorkout);
        setBuilderState('manage');
        setExercises([]);
        setWorkoutTitle('');
    };

    const handleSaveDiet = () => {
        if (!selectedStudent) return;
        const newDiet: DietPlan = {
            id: Date.now().toString(),
            userId: selectedStudent.id,
            trainerId: user.id,
            macros: dietMacros,
            content: dietContent,
            guidelines: dietGuidelines,
            updatedAt: new Date().toISOString()
        };
        db.saveDiet(newDiet);
        setBuilderState('manage');
    };

    const handleSaveBooks = () => {
        if (!selectedStudent) return;
        db.saveBookSuggestions(selectedStudent.id, bookSuggestions);
        setBuilderState('manage');
    }

    const toggleModule = (module: 'fitness' | 'spiritual' | 'reading') => {
        if (!selectedStudent) return;
        const profile = db.getProfile(selectedStudent.id);
        if (profile) {
            profile.activeModules[module] = !profile.activeModules[module];
            db.saveProfile(profile);
            // Force re-render
            setSelectedStudent({...selectedStudent});
        }
    };

    const handleDeleteStudent = () => {
        if (!selectedStudent) return;
        const confirmDelete = window.confirm(`Deseja realmente remover o aluno ${selectedStudent.name}?`);
        if (confirmDelete) {
            db.deleteUser(selectedStudent.id);
            setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
            setBuilderState('list');
            setSelectedStudent(null);
        }
    };

    const handleUpdateAccess = () => {
        if (!selectedStudent) return;
        db.updateUser({
            id: selectedStudent.id,
            name: editName,
            email: editEmail,
            password: editPassword || selectedStudent.password
        });
        setBuilderState('manage');
    };

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.date) return;
        db.addEvent({
            ...newEvent,
            id: Date.now().toString(),
            trainerId: user.id,
        });
        setIsAddingEvent(false);
        setEvents(db.getEvents(user.id));
    }

    const handleSendMsg = () => {
        if (!msgInput.trim() || !activeChat) return;
        db.sendMessage({
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: activeChat.id,
            content: msgInput,
            timestamp: new Date().toISOString(),
            read: false
        });
        setMsgInput('');
        setChatMessages(db.getMessages(user.id, activeChat.id));
    };

    if (activeTab === 'dashboard') {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <Users className="w-8 h-8 text-indigo-600 mb-4" />
                        <h3 className="text-3xl font-black text-slate-900">{students.length}</h3>
                        <p className="text-slate-500 font-medium">Alunos Ativos</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <Activity className="w-8 h-8 text-emerald-500 mb-4" />
                        <h3 className="text-3xl font-black text-slate-900">Atividade</h3>
                        <p className="text-slate-500 font-medium">Frequência Semanal</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <MessageCircle className="w-8 h-8 text-amber-500 mb-4" />
                        <h3 className="text-3xl font-black text-slate-900">Suporte</h3>
                        <p className="text-slate-500 font-medium">Dúvidas Frequentes</p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-black">Agenda do Studio</h2>
                        <button onClick={() => onTabChange('agenda')} className="text-indigo-400 font-bold flex items-center gap-2 hover:text-indigo-300">
                            Ver completa <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {events.length === 0 ? (
                             <p className="text-slate-400 italic">Nenhum evento agendado.</p>
                        ) : (
                            events.slice(0, 3).map(e => (
                                <div key={e.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex flex-col items-center justify-center font-bold">
                                             <span className="text-[10px] uppercase">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                             <span className="text-lg leading-none">{new Date(e.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold">{e.title}</p>
                                            <p className="text-xs text-slate-400">{e.time} • {e.type === 'global' ? 'Aberto a todos' : 'Privado'}</p>
                                        </div>
                                    </div>
                                    <Clock className="w-5 h-5 text-slate-500" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (activeTab === 'students') {
        if (builderState === 'list') {
            return (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-900">Alunos Corpo & Alma</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map(student => {
                            const profile = db.getProfile(student.id);
                            return (
                                <div 
                                    key={student.id} 
                                    onClick={() => handleSelectStudent(student)}
                                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden">
                                            {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover"/> : student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">{student.name}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{student.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-6">
                                        {profile?.activeModules.fitness && <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-md uppercase">Físico</span>}
                                        {profile?.activeModules.spiritual && <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black rounded-md uppercase">Espiritual</span>}
                                        {profile?.activeModules.reading && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md uppercase">Leitura</span>}
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <span className="text-xs font-bold text-slate-400">Meta: {profile?.goal || 'Não definida'}</span>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (selectedStudent) {
            const profile = db.getProfile(selectedStudent.id);
            
            if (builderState === 'manage') {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Voltar para lista
                        </button>

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Student Profile Card */}
                            <div className="lg:w-1/3 space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                                    <div className="w-24 h-24 bg-indigo-100 rounded-[2rem] flex items-center justify-center text-3xl font-black text-indigo-600 mb-4 overflow-hidden mx-auto">
                                        {selectedStudent.avatarUrl ? <img src={selectedStudent.avatarUrl} className="w-full h-full object-cover"/> : selectedStudent.name.charAt(0)}
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedStudent.name}</h2>
                                    <p className="text-slate-400 text-sm mb-8">{selectedStudent.email}</p>

                                    <div className="space-y-3">
                                        <button onClick={() => {
                                            setEditName(selectedStudent.name);
                                            setEditEmail(selectedStudent.email);
                                            setEditPassword('');
                                            setBuilderState('edit_access');
                                        }} className="w-full py-3.5 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-100 transition-all">
                                            <Settings2 className="w-5 h-5" /> Configurar Acesso
                                        </button>
                                        <button onClick={handleDeleteStudent} className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-red-100 transition-all">
                                            <UserX className="w-5 h-5" /> Remover Aluno
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-black mb-6">Módulos Ativos</h3>
                                    <div className="space-y-4">
                                        <ModuleToggle icon={Dumbbell} label="Treino Físico" active={profile?.activeModules.fitness} onToggle={() => toggleModule('fitness')} color="indigo" />
                                        <ModuleToggle icon={BookOpen} label="Plano Espiritual" active={profile?.activeModules.spiritual} onToggle={() => toggleModule('spiritual')} color="amber" />
                                        <ModuleToggle icon={Target} label="Clube de Leitura" active={profile?.activeModules.reading} onToggle={() => toggleModule('reading')} color="emerald" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div className="flex-1 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ActionCard icon={Plus} title="Prescrever Treino" desc="Monte o split A, B, C, D ou E" onClick={() => setBuilderState('create_workout')} color="indigo" />
                                    <ActionCard icon={Utensils} title="Plano Nutricional" desc="Macros e cardápio diário" onClick={() => setBuilderState('edit_diet')} color="rose" />
                                    <ActionCard icon={Star} title="Sugestões de Leitura" desc="Indique livros para o aluno" onClick={() => setBuilderState('edit_books')} color="emerald" />
                                    <ActionCard icon={ImageIcon} title="Acompanhar Evolução" desc="Veja o timelapse de progresso" onClick={() => setBuilderState('view_progress')} color="indigo" />
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                                    <h3 className="text-xl font-black mb-6">Desejos do Onboarding</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <ObjectiveItem label="Peso" active={profile?.onboardingChoices.wantsWeightLoss} />
                                        <ObjectiveItem label="Bíblia" active={profile?.onboardingChoices.wantsBibleReading} />
                                        <ObjectiveItem label="Extra" active={profile?.onboardingChoices.wantsExtraReading} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            if (builderState === 'create_workout') {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Cancelar
                            </button>
                            <h2 className="text-2xl font-black">Montagem de Treino</h2>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400">Nome da Rotina</label>
                                    <input value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold" placeholder="Ex: Inferiores Foco Quadríceps" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400">Modalidade</label>
                                    <select value={selectedSport} onChange={e => setSelectedSport(e.target.value as SportType)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                                        {Object.values(SportType).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400">Divisão (Split)</label>
                                    <select value={selectedSplit} onChange={e => setSelectedSplit(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold">
                                        {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Treino {s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-black flex items-center gap-2"><ListTodo className="w-5 h-5 text-indigo-600"/> Lista de Exercícios</h3>
                                {exercises.map((ex, i) => (
                                    <div key={i} className="p-6 bg-slate-50 rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-4 items-end animate-slide-up">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400">Exercício</label>
                                            <input value={ex.name || ''} onChange={e => {
                                                const n = [...exercises];
                                                n[i].name = e.target.value;
                                                setExercises(n);
                                            }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                        </div>

                                        {selectedSport === SportType.GYM ? (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Séries</label>
                                                    <input type="number" value={ex.sets || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].sets = parseInt(e.target.value);
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Reps</label>
                                                    <input value={ex.reps || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].reps = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Carga (Kg)</label>
                                                    <input value={ex.load || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].load = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                            </>
                                        ) : selectedSport === SportType.RUNNING ? (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Distância (km)</label>
                                                    <input value={ex.distance || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].distance = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Tempo (min)</label>
                                                    <input value={ex.duration || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].duration = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Pace</label>
                                                    <input value={ex.pace || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].pace = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Distância (km)</label>
                                                    <input value={ex.distance || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].distance = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                                <div className="md:col-span-1 space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-slate-400">Tempo (min)</label>
                                                    <input value={ex.duration || ''} onChange={e => {
                                                        const n = [...exercises];
                                                        n[i].duration = e.target.value;
                                                        setExercises(n);
                                                    }} className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none font-bold" />
                                                </div>
                                            </>
                                        )}
                                        
                                        <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => setExercises([...exercises, { name: '', sets: 3, reps: '12', rest: '60s' }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl font-bold text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                                    <Plus className="w-5 h-5" /> Novo Exercício
                                </button>
                            </div>

                            <button onClick={handleSaveWorkout} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
                                <Save className="w-6 h-6" /> Publicar Treino
                            </button>
                        </div>
                    </div>
                );
            }

            if (builderState === 'edit_diet') {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Cancelar
                            </button>
                            <h2 className="text-2xl font-black">Planejamento Nutricional</h2>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <MacroInput label="Kcal Alvo" value={dietMacros.calories} onChange={v => setDietMacros({...dietMacros, calories: v})} unit="kcal" />
                                <MacroInput label="Proteínas" value={dietMacros.protein} onChange={v => setDietMacros({...dietMacros, protein: v})} unit="g" />
                                <MacroInput label="Carbos" value={dietMacros.carbs} onChange={v => setDietMacros({...dietMacros, carbs: v})} unit="g" />
                                <MacroInput label="Gorduras" value={dietMacros.fats} onChange={v => setDietMacros({...dietMacros, fats: v})} unit="g" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400">Refeições e Cardápio</label>
                                <textarea value={dietContent} onChange={e => setDietContent(e.target.value)} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-500 min-h-[300px] font-medium" />
                            </div>

                            <button onClick={handleSaveDiet} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:bg-rose-700 transition-all">
                                <Save className="w-6 h-6" /> Salvar Dieta
                            </button>
                        </div>
                    </div>
                );
            }

            if (builderState === 'edit_books') {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </button>
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-black">Sugestões de Leitura</h2>
                            <p className="text-slate-500 text-sm">Estas sugestões aparecerão na aba principal do aluno no módulo de leitura.</p>
                            
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" 
                                    placeholder="Nome do livro ou autor"
                                    value={newBook}
                                    onChange={e => setNewBook(e.target.value)}
                                />
                                <button onClick={() => {
                                    if(newBook) {
                                        setBookSuggestions([...bookSuggestions, newBook]);
                                        setNewBook('');
                                    }
                                }} className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg"><Plus className="w-6 h-6"/></button>
                            </div>

                            <div className="space-y-3">
                                {bookSuggestions.map((book, i) => (
                                    <div key={i} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 text-emerald-600" />
                                            <span className="font-bold text-slate-700">{book}</span>
                                        </div>
                                        <button onClick={() => setBookSuggestions(bookSuggestions.filter((_, idx) => idx !== i))} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button onClick={handleSaveBooks} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-slate-800 transition-all">
                                <Save className="w-6 h-6" /> Confirmar Indicações
                            </button>
                        </div>
                    </div>
                );
            }

            if (builderState === 'view_progress') {
                const logs = db.getProgress(selectedStudent.id);
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </button>
                        <h2 className="text-3xl font-black">Jornada de {selectedStudent.name}</h2>
                        
                        {logs.length === 0 ? (
                            <div className="p-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                                <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Sem registros</h3>
                                <p className="text-slate-500">O aluno ainda não registrou evolução no timelapse.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {logs.map(log => (
                                    <div key={log.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100">
                                        <div className="aspect-square bg-slate-100 overflow-hidden">
                                            {log.photoUrl && <img src={log.photoUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase">{new Date(log.date).toLocaleDateString()}</span>
                                                <span className="text-xl font-black text-slate-900">{log.weight} kg</span>
                                            </div>
                                            <p className="text-sm text-slate-600 italic">"{log.notes}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            if (builderState === 'edit_access') {
                return (
                    <div className="space-y-8 animate-fade-in pb-20">
                        <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Cancelar
                        </button>
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-xl mx-auto space-y-6">
                            <h2 className="text-2xl font-black mb-6">Credenciais do Aluno</h2>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Nome Exibido</label>
                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Login (Email)</label>
                                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Nova Senha (deixe vazio se não mudar)</label>
                                    <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold" />
                                </div>
                            </div>
                            <button onClick={handleUpdateAccess} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
                                <Save className="w-6 h-6" /> Atualizar Acesso
                            </button>
                        </div>
                    </div>
                );
            }
        }
    }

    if (activeTab === 'agenda') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-900">Agenda Compartilhada</h2>
                    <button onClick={() => setIsAddingEvent(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"><Plus className="w-4 h-4" /> Novo Evento</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-indigo-600">
                                     <span className="text-[10px] font-black uppercase">{new Date(event.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                     <span className="text-xl font-black leading-none">{new Date(event.date).getDate()}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${event.type === 'global' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {event.type === 'global' ? 'Público' : 'Individual'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{event.title}</h3>
                                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2"><Clock className="w-4 h-4"/> {event.time}</p>
                            </div>
                            {event.description && <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl italic">"{event.description}"</p>}
                        </div>
                    ))}
                </div>

                {isAddingEvent && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-slide-up space-y-6">
                            <h3 className="text-2xl font-black">Agendar Novo Evento</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-slate-400">Título</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black uppercase text-slate-400">Data</label>
                                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-black uppercase text-slate-400">Horário</label>
                                        <input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-slate-400">Visibilidade</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                                        <option value="global">Público (Aparece para todos)</option>
                                        <option value="assessment">Avaliação Individual</option>
                                        <option value="training">Treino Específico</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black uppercase text-slate-400">Descrição</label>
                                    <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium h-24" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsAddingEvent(false)} className="flex-1 font-bold text-slate-500">Cancelar</button>
                                <button onClick={handleAddEvent} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl hover:bg-slate-800">Confirmar Evento</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'messages') {
        return (
            <div className="bg-white h-[calc(100vh-200px)] rounded-[2.5rem] border border-slate-100 shadow-2xl flex overflow-hidden animate-fade-in">
                {/* Students Sidebar */}
                <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                    <div className="p-8 border-b border-slate-100">
                        <h3 className="font-black text-xl text-slate-900">Conversas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {students.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => setActiveChat(s)}
                                className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${activeChat?.id === s.id ? 'bg-white shadow-lg border border-slate-100' : 'hover:bg-slate-100'}`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 overflow-hidden">
                                    {s.avatarUrl ? <img src={s.avatarUrl} className="w-full h-full object-cover"/> : s.name.charAt(0)}
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-bold text-sm truncate text-slate-900">{s.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Aluno</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {activeChat ? (
                        <>
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold overflow-hidden">
                                        {activeChat.avatarUrl ? <img src={activeChat.avatarUrl} className="w-full h-full object-cover"/> : activeChat.name.charAt(0)}
                                    </div>
                                    <h3 className="font-bold text-slate-900">{activeChat.name}</h3>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                        <MessageCircle className="w-12 h-12 mb-4 opacity-10" />
                                        <p className="font-medium">Nenhuma mensagem ainda.</p>
                                    </div>
                                ) : (
                                    chatMessages.map(m => {
                                        const isMe = m.senderId === user.id;
                                        return (
                                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none shadow-sm'}`}>
                                                    <p className="font-medium text-sm">{m.content}</p>
                                                    <p className="text-[9px] mt-1 opacity-50 uppercase font-bold text-right">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                                <div className="flex gap-3">
                                    <input 
                                        className="flex-1 bg-white border border-slate-200 rounded-xl px-6 py-3 outline-none focus:border-indigo-500 font-medium" 
                                        placeholder={`Enviar mensagem para ${activeChat.name.split(' ')[0]}...`}
                                        value={msgInput}
                                        onChange={e => setMsgInput(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSendMsg()}
                                    />
                                    <button onClick={handleSendMsg} className="bg-slate-900 text-white p-4 rounded-xl shadow-lg hover:bg-indigo-600 transition-all">
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300">
                             <div className="text-center">
                                <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-5" />
                                <p className="font-bold">Selecione um aluno para conversar</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return <div className="p-10 text-center">Página em breve</div>;
};

// --- Trainer Sub-Components ---

const ModuleToggle = ({ icon: Icon, label, active, onToggle, color }: any) => {
    const activeColorMap: any = {
        indigo: 'bg-indigo-600',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
    };
    return (
        <button 
            onClick={onToggle}
            className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${active ? `border-${color}-500 bg-${color}-50` : 'border-slate-100 bg-white opacity-60'}`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${active ? `text-${color}-600` : 'text-slate-400'}`} />
                <span className={`font-bold ${active ? `text-${color}-900` : 'text-slate-500'}`}>{label}</span>
            </div>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${active ? activeColorMap[color] : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${active ? 'left-5' : 'left-1'}`} />
            </div>
        </button>
    );
};

const ActionCard = ({ icon: Icon, title, desc, onClick, color }: any) => {
    const colorMap: any = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
    };
    return (
        <button 
            onClick={onClick}
            className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
        >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all ${colorMap[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium">{desc}</p>
        </button>
    );
};

const ObjectiveItem = ({ label, active }: { label: string, active?: boolean }) => (
    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${active ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        {active ? <CheckSquare className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        <span className="text-[10px] font-bold uppercase">{label}</span>
    </div>
);

const MacroInput = ({ label, value, onChange, unit }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400">{label} ({unit})</label>
        <input 
            type="number" 
            value={value} 
            onChange={e => onChange(parseInt(e.target.value))} 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold focus:border-rose-500" 
        />
    </div>
);
