
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
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
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
        const load = async () => {
            try {
                // BUSCA REAL DO FIREBASE
                const allUsers = await db.getAllUsersFromDb();
                setStudents(allUsers.filter(u => u.role === UserRole.STUDENT));
                setEvents(db.getEvents(user.id));
                
                if (activeChat) {
                    setChatMessages(db.getMessages(user.id, activeChat.id));
                }
            } catch (err) {
                console.error("Falha ao carregar alunos do banco de dados:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 5000); // Sincroniza a cada 5 segundos
        return () => clearInterval(interval);
    }, [user.id, activeTab, builderState, activeChat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSelectStudent = async (student: User) => {
        setSelectedStudent(student);
        setLoading(true);
        const profile = await db.getProfile(student.id);
        setSelectedProfile(profile || null);
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
        setLoading(false);
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

    const toggleModule = async (module: 'fitness' | 'spiritual' | 'reading') => {
        if (!selectedStudent) return;
        const profile = await db.getProfile(selectedStudent.id);
        if (profile) {
            profile.activeModules[module] = !profile.activeModules[module];
            await db.saveProfile(profile);
            setSelectedProfile({...profile});
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
            setSelectedProfile(null);
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

    if (loading && builderState === 'list') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                <Activity className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="font-bold">Sincronizando com a nuvem...</p>
            </div>
        );
    }

    if (activeTab === 'dashboard') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400">Total Alunos</p>
                                <p className="text-2xl font-black">{students.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black">Agenda do Personal</h3>
                        <button onClick={() => setIsAddingEvent(true)} className="bg-slate-900 text-white p-2 rounded-xl"><Plus className="w-5 h-5"/></button>
                    </div>
                    <div className="space-y-3">
                        {events.length === 0 ? (
                            <p className="text-slate-400 text-sm italic">Nenhum evento agendado.</p>
                        ) : (
                            events.map(e => (
                                <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-indigo-600 font-bold text-sm">
                                            {new Date(e.date).getDate()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{e.title}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{e.time} • {e.type}</p>
                                        </div>
                                    </div>
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
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-900">Gestão de Alunos</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map(student => (
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
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Dumbbell className="w-3 h-3"/> Fitness</span>
                                    <span className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><BookOpen className="w-3 h-3"/> Rhema</span>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                        <ChevronRight className="w-5 h-5" />
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
                    <button onClick={() => setBuilderState('list')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar para Lista
                    </button>

                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10 items-center">
                        <div className="w-32 h-32 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-xl">
                            {selectedStudent.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedStudent.name}</h2>
                            <p className="text-slate-500 mb-6 font-medium">{selectedStudent.email}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <ModuleToggle 
                                    label="Módulo Fitness" 
                                    active={selectedProfile?.activeModules.fitness} 
                                    onClick={() => toggleModule('fitness')} 
                                    icon={Dumbbell}
                                />
                                <ModuleToggle 
                                    label="Módulo Espiritual" 
                                    active={selectedProfile?.activeModules.spiritual} 
                                    onClick={() => toggleModule('spiritual')} 
                                    icon={Sparkles}
                                />
                                <ModuleToggle 
                                    label="Módulo Leitura" 
                                    active={selectedProfile?.activeModules.reading} 
                                    onClick={() => toggleModule('reading')} 
                                    icon={BookOpen}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                             <button onClick={() => setBuilderState('edit_access')} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Settings2 className="w-6 h-6"/></button>
                             <button onClick={handleDeleteStudent} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 className="w-6 h-6"/></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ToolCard 
                            icon={CheckSquare} 
                            title="Prescrever Treino" 
                            desc="Crie splits de treinamento personalizados." 
                            onClick={() => setBuilderState('create_workout')}
                        />
                        <ToolCard 
                            icon={Utensils} 
                            title="Ajustar Dieta" 
                            desc="Configure macros e plano alimentar." 
                            onClick={() => setBuilderState('edit_diet')}
                        />
                        <ToolCard 
                            icon={ListTodo} 
                            title="Sugestão de Livros" 
                            desc="Indique leituras para o módulo extra." 
                            onClick={() => setBuilderState('edit_books')}
                        />
                        <ToolCard 
                            icon={ImageIcon} 
                            title="Ver Evolução" 
                            desc="Acompanhe o timelapse de fotos e medidas." 
                            onClick={() => setBuilderState('view_progress')}
                        />
                    </div>
                </div>
            );
        }

        if (selectedStudent && builderState === 'create_workout') {
             return (
                 <div className="space-y-8 animate-fade-in pb-20">
                     <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar ao Perfil
                    </button>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-2xl font-black mb-8">Novo Plano de Treino</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título do Treino</label>
                                <input className="w-full p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" placeholder="Ex: Hipertrofia Pernas" value={workoutTitle} onChange={e => setWorkoutTitle(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Split</label>
                                    <select className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold" value={selectedSplit} onChange={e => setSelectedSplit(e.target.value)}>
                                        {['A', 'B', 'C', 'D', 'E', 'F'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Esporte</label>
                                    <select className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold" value={selectedSport} onChange={e => setSelectedSport(e.target.value as SportType)}>
                                        {Object.values(SportType).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            {exercises.map((ex, i) => (
                                <div key={i} className="p-6 bg-slate-50 rounded-2xl flex flex-wrap gap-4 items-end border border-slate-100">
                                    <div className="flex-1 min-w-[200px] space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Exercício</label>
                                        <input className="w-full bg-white p-3 rounded-lg border border-slate-200" value={ex.name || ''} onChange={e => {
                                            const next = [...exercises];
                                            next[i].name = e.target.value;
                                            setExercises(next);
                                        }} />
                                    </div>
                                    <div className="w-20 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Séries</label>
                                        <input type="number" className="w-full bg-white p-3 rounded-lg border border-slate-200 text-center" value={ex.sets || ''} onChange={e => {
                                            const next = [...exercises];
                                            next[i].sets = parseInt(e.target.value);
                                            setExercises(next);
                                        }} />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Reps</label>
                                        <input className="w-full bg-white p-3 rounded-lg border border-slate-200 text-center" value={ex.reps || ''} onChange={e => {
                                            const next = [...exercises];
                                            next[i].reps = e.target.value;
                                            setExercises(next);
                                        }} />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Descanso</label>
                                        <input className="w-full bg-white p-3 rounded-lg border border-slate-200 text-center" value={ex.rest || ''} onChange={e => {
                                            const next = [...exercises];
                                            next[i].rest = e.target.value;
                                            setExercises(next);
                                        }} />
                                    </div>
                                    <button onClick={() => setExercises(exercises.filter((_, idx) => idx !== i))} className="p-3 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            ))}
                            <button onClick={() => setExercises([...exercises, { rest: '60s' }])} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4"/> Adicionar Exercício</button>
                        </div>

                        <button onClick={handleSaveWorkout} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                             <Save className="w-6 h-6" /> Salvar Treino Prescrito
                        </button>
                    </div>
                 </div>
             )
        }

        if (selectedStudent && builderState === 'edit_diet') {
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                     <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar ao Perfil
                    </button>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-2xl font-black mb-8">Configurar Plano Alimentar</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <MacroInput label="Calorias" value={dietMacros.calories} onChange={v => setDietMacros({...dietMacros, calories: parseInt(v)})} />
                            <MacroInput label="Proteínas (g)" value={dietMacros.protein} onChange={v => setDietMacros({...dietMacros, protein: parseInt(v)})} />
                            <MacroInput label="Carbos (g)" value={dietMacros.carbs} onChange={v => setDietMacros({...dietMacros, carbs: parseInt(v)})} />
                            <MacroInput label="Gorduras (g)" value={dietMacros.fats} onChange={v => setDietMacros({...dietMacros, fats: parseInt(v)})} />
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cardápio Sugerido</label>
                                <textarea className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium min-h-[300px]" placeholder="Refeição 1: ... Refeição 2: ..." value={dietContent} onChange={e => setDietContent(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orientações Finais</label>
                                <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold" placeholder="Dicas de hidratação, sono, etc." value={dietGuidelines} onChange={e => setDietGuidelines(e.target.value)} />
                            </div>
                            <button onClick={handleSaveDiet} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                                 <Save className="w-6 h-6" /> Salvar Dieta e Macros
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        if (selectedStudent && builderState === 'edit_books') {
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                     <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar ao Perfil
                    </button>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-2xl font-black mb-8">Sugestões de Leitura</h3>
                        <div className="flex gap-4 mb-8">
                             <input className="flex-1 p-4 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-indigo-500 font-bold" placeholder="Título do Livro / Autor" value={newBook} onChange={e => setNewBook(e.target.value)} />
                             <button onClick={() => { if(newBook) { setBookSuggestions([...bookSuggestions, newBook]); setNewBook(''); } }} className="bg-indigo-600 text-white px-6 rounded-xl font-bold">Adicionar</button>
                        </div>
                        <div className="space-y-3 mb-10">
                            {bookSuggestions.map((b, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="font-bold text-slate-700">{b}</span>
                                    <button onClick={() => setBookSuggestions(bookSuggestions.filter((_, idx) => idx !== i))} className="text-red-400 p-2"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleSaveBooks} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                                <Save className="w-6 h-6" /> Atualizar Lista de Livros
                        </button>
                    </div>
                </div>
            )
        }

        if (selectedStudent && builderState === 'view_progress') {
             const progress = db.getProgress(selectedStudent.id);
             return (
                 <div className="space-y-8 animate-fade-in pb-20">
                     <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar ao Perfil
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {progress.length === 0 ? (
                            <div className="col-span-full p-20 text-center text-slate-400">Aluno ainda não enviou registros de progresso.</div>
                        ) : (
                            progress.map(log => (
                                <div key={log.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                                    <div className="aspect-square bg-slate-100">
                                        {log.photoUrl && <img src={log.photoUrl} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-black text-xl">{log.weight} kg</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(log.date).toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-sm text-slate-500 italic">"{log.notes}"</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>
             )
        }

        if (selectedStudent && builderState === 'edit_access') {
             return (
                 <div className="space-y-8 animate-fade-in pb-20">
                     <button onClick={() => setBuilderState('manage')} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Voltar ao Perfil
                    </button>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-xl">
                        <h3 className="text-2xl font-black mb-8">Editar Acesso do Aluno</h3>
                        <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                                <input className="w-full p-4 bg-slate-50 rounded-xl outline-none" defaultValue={selectedStudent.name} onChange={e => setEditName(e.target.value)} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                                <input className="w-full p-4 bg-slate-50 rounded-xl outline-none" defaultValue={selectedStudent.email} onChange={e => setEditEmail(e.target.value)} />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Redefinir Senha (Opcional)</label>
                                <input className="w-full p-4 bg-slate-50 rounded-xl outline-none" placeholder="Deixe vazio para manter" onChange={e => setEditPassword(e.target.value)} />
                             </div>
                             <button onClick={handleUpdateAccess} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg mt-6">Atualizar Credenciais</button>
                        </div>
                    </div>
                 </div>
             )
        }
    }

    if (activeTab === 'agenda') {
        return (
            <div className="space-y-8 animate-fade-in pb-20">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black text-slate-900">Agenda de Atendimentos</h2>
                    <button onClick={() => setIsAddingEvent(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Plus className="w-4 h-4" /> Novo Evento</button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-slate-50">
                        {events.length === 0 ? (
                            <div className="p-20 text-center text-slate-300 font-medium">Nenhum evento agendado para o futuro.</div>
                        ) : (
                            events.map(e => (
                                <div key={e.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                            <span className="text-2xl font-black leading-none">{new Date(e.date).getDate()}</span>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900">{e.title}</h4>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-sm font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {e.time}</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold uppercase rounded-full tracking-wider">{e.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                         <button className="p-3 text-slate-300 hover:text-slate-600 transition-colors"><Edit3 className="w-5 h-5"/></button>
                                         <button className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {isAddingEvent && (
                    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 animate-slide-up shadow-2xl relative">
                            <h3 className="text-2xl font-black mb-8">Criar Novo Evento</h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-bold" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</label>
                                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horário</label>
                                        <input type="time" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibilidade</label>
                                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}>
                                        <option value="global">Todos os Alunos</option>
                                        <option value="training">Sessão de Treino</option>
                                        <option value="assessment">Avaliação</option>
                                        <option value="personal">Bloqueio Pessoal</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 mt-6">
                                     <button onClick={() => setIsAddingEvent(false)} className="flex-1 py-4 font-bold text-slate-400">Cancelar</button>
                                     <button onClick={handleAddEvent} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl">Criar Evento</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'messages') {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-180px)] animate-fade-in">
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-black text-lg">Conversas</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {students.map(s => (
                            <button 
                                key={s.id}
                                onClick={() => setActiveChat(s)}
                                className={`w-full p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${activeChat?.id === s.id ? 'bg-indigo-50/50' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400">{s.name.charAt(0)}</div>
                                <div className="text-left flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 truncate">{s.name}</p>
                                    <p className="text-xs text-slate-400 truncate">Clique para responder</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            </button>
                        ))}
                    </div>
                 </div>

                 <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
                    {activeChat ? (
                        <>
                            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">{activeChat.name.charAt(0)}</div>
                                <div>
                                    <h3 className="font-black">{activeChat.name}</h3>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sessão Ativa</p>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                {chatMessages.map(m => {
                                    const isMe = m.senderId === user.id;
                                    return (
                                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                             <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                                <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                                                <p className={`text-[9px] mt-1 font-bold uppercase opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                             </div>
                                        </div>
                                    )
                                })}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex gap-4">
                                <input 
                                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-medium" 
                                    placeholder="Escreva sua resposta..."
                                    value={msgInput}
                                    onChange={e => setMsgInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendMsg()}
                                />
                                <button onClick={handleSendMsg} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:bg-indigo-600 transition-all"><Send className="w-6 h-6"/></button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                             <MessageCircle className="w-20 h-20 mb-6 opacity-10" />
                             <p className="font-bold text-lg">Selecione uma conversa para começar</p>
                        </div>
                    )}
                 </div>
            </div>
        );
    }

    return null;
};

// --- Helpers ---

const ModuleToggle = ({ label, active, onClick, icon: Icon }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-[11px] uppercase tracking-widest transition-all ${
            active 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                : 'border-slate-100 bg-slate-50 text-slate-300'
        }`}
    >
        <Icon className="w-4 h-4" /> {label} {active ? '(Ativo)' : '(Inativo)'}
    </button>
);

const ToolCard = ({ icon: Icon, title, desc, onClick }: any) => (
    <button 
        onClick={onClick}
        className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-left hover:shadow-xl hover:border-indigo-100 transition-all group"
    >
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="font-black text-slate-900 mb-2">{title}</h4>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
    </button>
);

const MacroInput = ({ label, value, onChange }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-indigo-500 font-black text-center" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);
