
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Droplets, Flame, Timer, Footprints, Send, Play, MapPin, StopCircle, 
    Pause, Heart, MessageCircle, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, Target, ChevronRight, Hash, Clock, History, Star, ThumbsUp,
    ShieldCheck, Bell, Info, Users, Flame as BurnIcon
} from 'lucide-react';

interface StudentViewProps {
    activeTab: string;
    user: User;
    onTabChange: (tab: string) => void;
}

export const StudentViewContent: React.FC<StudentViewProps> = ({ activeTab, user, onTabChange }) => {
    const [profile, setProfile] = useState<UserProfile | undefined>();
    const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
    const [diet, setDiet] = useState<DietPlan | undefined>();
    const [progress, setProgress] = useState<ProgressLog[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [spiritualPosts, setSpiritualPosts] = useState<SpiritualPost[]>([]);
    const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [trainer, setTrainer] = useState<User | undefined>();
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    
    useEffect(() => {
        const load = async () => {
            // FIX: db.getProfile is async
            const p = await db.getProfile(user.id);
            const allUsers = db.getUsers();
            const foundTrainer = allUsers.find(u => u.role === 'trainer');
            
            setTrainer(foundTrainer);
            setProfile(p);
            setWorkouts(db.getWorkouts(user.id));
            setDiet(db.getDiet(user.id));
            setProgress(db.getProgress(user.id));
            setActivityLogs(db.getActivity(user.id));
            
            if (foundTrainer) {
                setMessages(db.getMessages(user.id, foundTrainer.id));
            }
            
            setSpiritualPosts(db.getSpiritualPosts());
            setLeaderboard(db.getReadingLeaderboard());
            setEvents(db.getStudentEvents(user.id));
        };
        load();
        const interval = setInterval(load, 3000); 
        return () => clearInterval(interval);
    }, [user.id, activeTab]);

    if (!profile) return <DashboardSkeleton />;

    const isFitnessActive = profile.activeModules.fitness;
    const isSpiritualActive = profile.activeModules.spiritual;
    const isReadingActive = profile.activeModules.reading;

    const refreshMessages = () => {
        if (trainer) {
            setMessages(db.getMessages(user.id, trainer.id));
        }
    };

    const totalCaloriesToday = activityLogs
        .filter(log => log.date.split('T')[0] === new Date().toISOString().split('T')[0])
        .reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

    switch (activeTab) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-2">Olá, {user.name.split(' ')[0]}</h2>
                            <p className="text-slate-400">Sua jornada Corpo & Alma continua hoje.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isFitnessActive && (
                             <Card label="Peso Atual" value={`${profile.weight} kg`} icon={Scale} color="bg-indigo-500" />
                        )}
                        {isFitnessActive && (
                             <Card label="Calorias Ativas" value={`${Math.round(totalCaloriesToday)} kcal`} icon={BurnIcon} color="bg-rose-500" />
                        )}
                        {isSpiritualActive && (
                             <Card label="Dias Lidos" value={`${profile.readingStats?.daysCompleted || 0} dias`} icon={BookOpen} color="bg-amber-500" />
                        )}
                        {isReadingActive && (
                             <Card label="Livros Lidos" value={`${profile.onboardingChoices.extraReadingProgress || 0} / ${profile.onboardingChoices.extraReadingGoal || 0}`} icon={Target} color="bg-emerald-500" />
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {isFitnessActive && workouts.length > 0 && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-indigo-600"/> Próximo Treino</h3>
                                    <div className="space-y-4">
                                        {workouts.slice(0, 1).map(w => (
                                            <div key={w.id} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-all" onClick={() => onTabChange('workouts')}>
                                                <div>
                                                    <p className="font-bold text-lg">{w.title} (Split {w.split})</p>
                                                    <p className="text-sm text-slate-500">{w.exercises.length} exercícios • {w.durationMinutes} min</p>
                                                </div>
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <Play className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><CalendarIcon className="w-5 h-5 text-indigo-600"/> Agenda da Comunidade</h3>
                                <div className="space-y-4">
                                    {events.length === 0 ? (
                                        <p className="text-slate-400 text-sm italic">Nenhum evento agendado pelo personal.</p>
                                    ) : (
                                        events.slice(0, 3).map(e => (
                                            <div key={e.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                                <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                                    <span className="text-lg font-black leading-none">{new Date(e.date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{e.title}</p>
                                                    <p className="text-xs text-slate-500">{e.time} • {e.type === 'global' ? 'Evento Geral' : 'Sessão Individual'}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {isSpiritualActive && (
                                <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-amber-900"><BookOpen className="w-5 h-5 text-amber-600"/> Leitura Diária</h3>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-xs font-black uppercase text-amber-600 tracking-widest">Plano {profile.onboardingChoices.biblePlanDuration}</p>
                                            <p className="text-xs text-slate-400 font-bold">Streak: {profile.readingStats?.streak || 0} dias 🔥</p>
                                        </div>
                                        <button 
                                            onClick={() => { db.checkInReading(user.id); }}
                                            className="w-full bg-amber-500 text-white py-4 rounded-xl font-black shadow-lg shadow-amber-200 flex items-center justify-center gap-2 hover:bg-amber-600 transition-all active:scale-95"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Confirmar Leitura do Dia
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isReadingActive && profile.bookSuggestions && profile.bookSuggestions.length > 0 && (
                                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-900"><Star className="w-5 h-5 text-emerald-600"/> Sugestões do Personal</h3>
                                    <div className="space-y-3">
                                        {profile.bookSuggestions.map((book, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl flex items-center gap-3 border border-emerald-100 shadow-sm">
                                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                                    <Info className="w-4 h-4" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">{book}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );

        case 'workouts':
            if (!isFitnessActive) return <Inativo msg="Módulo de Treinos inativo." />;
            return <WorkoutView workouts={workouts} user={user} profile={profile} />;

        case 'diet':
            if (!isFitnessActive) return <Inativo msg="Módulo de Dieta inativo." />;
            return <DietView diet={diet} />;

        case 'progress':
            if (!isFitnessActive) return <Inativo msg="Módulo de Timelapse inativo." />;
            return <ProgressView progress={progress} user={user} onUpdate={() => setProgress(db.getProgress(user.id))} />;

        case 'spiritual':
            if (!isSpiritualActive) return <Inativo msg="Módulo Espiritual inativo." />;
            return <SpiritualView user={user} posts={spiritualPosts} leaderboard={leaderboard} />;

        case 'messages':
            return <ChatView messages={messages} user={user} trainer={trainer} onMessageSent={refreshMessages} />;
        
        case 'community':
            return <CommunityView posts={spiritualPosts} user={user} />;

        default: return <div>Em breve</div>;
    }
};

// --- Sub-Components ---

const Card = ({ label, value, icon: Icon, color }: any) => (
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

const WorkoutView = ({ workouts, user, profile }: { workouts: WorkoutPlan[], user: User, profile: UserProfile }) => {
    const [activeSplit, setActiveSplit] = useState(workouts[0]?.id || '');
    const [exerciseLoads, setExerciseLoads] = useState<Record<string, string>>({});
    const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
    
    const currentWorkout = workouts.find(w => w.id === activeSplit) || workouts[0];

    if (!currentWorkout) return <Inativo msg="Nenhum treino prescrito ainda." />;

    const calculateCalories = (sport: SportType, durationMins: number) => {
        // MET Values: Gym ~5, Running ~9.8, Walking ~3.5, Cycling ~8.0
        let met = 5;
        if (sport === SportType.RUNNING) met = 9.8;
        if (sport === SportType.WALKING) met = 3.5;
        if (sport === SportType.CYCLING) met = 8.0;

        // Calories = MET * Weight (kg) * Time (hrs)
        return met * (profile.weight || 70) * (durationMins / 60);
    };

    const handleCompleteWorkout = () => {
        const calories = calculateCalories(currentWorkout.sportType, currentWorkout.durationMinutes);
        db.logActivity({
            id: Date.now().toString(),
            userId: user.id,
            date: new Date().toISOString(),
            workoutId: currentWorkout.id,
            completedAt: new Date().toISOString(),
            durationActual: currentWorkout.durationMinutes,
            caloriesBurned: calories
        });
        alert(`Treino finalizado! Você queimou aproximadamente ${Math.round(calories)} calorias.`);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {workouts.map(w => (
                    <button 
                        key={w.id}
                        onClick={() => {
                            setActiveSplit(w.id);
                            setCompletedExercises(new Set());
                        }}
                        className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all ${activeSplit === w.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'}`}
                    >
                        Treino {w.split}
                    </button>
                ))}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">{currentWorkout.title}</h2>
                        <p className="text-slate-500 mt-2">{currentWorkout.specificGuidelines || 'Siga as orientações do seu treinador.'}</p>
                    </div>
                    <button 
                        onClick={handleCompleteWorkout}
                        className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-green-600 transition-all flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> Finalizar Treino
                    </button>
                </div>

                <div className="space-y-4">
                    {currentWorkout.exercises.map((ex, idx) => (
                        <div key={ex.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-lg flex items-center gap-2">
                                    <span className="text-indigo-600 font-black">#{idx + 1}</span> {ex.name}
                                </h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    {currentWorkout.sportType === SportType.GYM ? (
                                        `${ex.sets} séries x ${ex.reps} • ${ex.rest} descanso`
                                    ) : currentWorkout.sportType === SportType.RUNNING ? (
                                        `${ex.distance} km • ${ex.duration} min • Pace ${ex.pace}`
                                    ) : (
                                        `${ex.distance} km • ${ex.duration} min`
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {currentWorkout.sportType === SportType.GYM && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sua Carga (Kg)</p>
                                        <input 
                                            type="text" 
                                            value={exerciseLoads[ex.id] || ex.load || ''}
                                            onChange={(e) => setExerciseLoads({...exerciseLoads, [ex.id]: e.target.value})}
                                            placeholder="0"
                                            className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-center font-bold outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                )}
                                <button 
                                    onClick={() => {
                                        const next = new Set(completedExercises);
                                        if (next.has(ex.id)) next.delete(ex.id);
                                        else next.add(ex.id);
                                        setCompletedExercises(next);
                                    }}
                                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                                        completedExercises.has(ex.id) 
                                            ? 'bg-green-500 border-green-500 text-white' 
                                            : 'bg-white border-slate-200 text-slate-300'
                                    }`}
                                >
                                    <CheckCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DietView = ({ diet }: { diet: DietPlan | undefined }) => {
    if (!diet) return <Inativo msg="Sua dieta ainda não foi prescrita." />;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MacroCard label="Calorias" value={diet.macros.calories} unit="kcal" color="indigo" />
                <MacroCard label="Proteínas" value={diet.macros.protein} unit="g" color="rose" />
                <MacroCard label="Carbos" value={diet.macros.carbs} unit="g" color="amber" />
                <MacroCard label="Gorduras" value={diet.macros.fats} unit="g" color="emerald" />
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-2xl font-black mb-6">Plano Alimentar</h3>
                <div className="prose prose-slate max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: diet.content.replace(/\n/g, '<br/>') }} className="text-slate-600 leading-relaxed font-medium" />
                </div>
                
                {diet.guidelines && (
                    <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4"/> Orientações Específicas</h4>
                        <p className="text-sm text-indigo-700">{diet.guidelines}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProgressView = ({ progress, user, onUpdate }: { progress: ProgressLog[], user: User, onUpdate: () => void }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [newNote, setNewNote] = useState('');
    const [newPhoto, setNewPhoto] = useState<string | undefined>();

    const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        db.addProgress({
            id: Date.now().toString(),
            userId: user.id,
            date: new Date().toISOString(),
            weight: parseFloat(newWeight) || 0,
            notes: newNote,
            photoUrl: newPhoto,
            title: 'Registro de Evolução'
        });
        setIsAdding(false);
        onUpdate();
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900">Timelapse de Progresso</h2>
                <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"><Plus className="w-4 h-4" /> Novo Registro</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {progress.map(log => (
                    <div key={log.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group">
                        <div className="aspect-square bg-slate-100 relative overflow-hidden">
                            {log.photoUrl ? (
                                <img src={log.photoUrl} alt="Evolução" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-12 h-12" /></div>
                            )}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 shadow-sm">
                                {new Date(log.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-lg text-slate-900">{log.weight} kg</p>
                                <Scale className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2">{log.notes || 'Sem anotações.'}</p>
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-slide-up">
                        <h3 className="text-2xl font-black mb-6">Registrar Evolução</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden relative">
                                    {newPhoto ? (
                                        <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-slate-300" />
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhoto} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Clique para subir foto</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso Atual (kg)</label>
                                <input type="number" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold" value={newWeight} onChange={e => setNewWeight(e.target.value)} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observações</label>
                                <textarea className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 h-24 font-medium" placeholder="Como se sente hoje?" value={newNote} onChange={e => setNewNote(e.target.value)} />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsAdding(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancelar</button>
                                <button onClick={handleSave} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800">Salvar Registro</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SpiritualView = ({ user, posts, leaderboard }: { user: User, posts: SpiritualPost[], leaderboard: UserProfile[] }) => {
    const [newPost, setNewPost] = useState('');
    const [selectedPost, setSelectedPost] = useState<string | null>(null);
    const [commentInput, setCommentInput] = useState('');

    const handleSendPost = () => {
        if (!newPost.trim()) return;
        db.addSpiritualPost({
            id: Date.now().toString(),
            userId: user.id,
            content: newPost,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: []
        });
        setNewPost('');
    };

    const handleSendComment = (postId: string) => {
        if (!commentInput.trim()) return;
        // FIX: storage service now has addSpiritualComment
        db.addSpiritualComment(postId, {
            userId: user.id,
            content: commentInput,
            timestamp: new Date().toISOString()
        });
        setCommentInput('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black mb-4">Compartilhar Reflexão</h3>
                    <div className="relative">
                        <textarea 
                            className="w-full p-6 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:border-amber-500 min-h-[120px] font-medium text-slate-700" 
                            placeholder="Qual Rhema o Senhor te deu hoje?"
                            value={newPost}
                            onChange={e => setNewPost(e.target.value)}
                        />
                        <button onClick={handleSendPost} className="absolute bottom-4 right-4 bg-amber-500 text-white p-3 rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {posts.map(post => {
                        const author = db.getUsers().find(u => u.id === post.userId);
                        return (
                            <div key={post.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">{author?.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-slate-900">{author?.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(post.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-medium">{post.content}</p>
                                <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                    <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-amber-500 transition-colors"><ThumbsUp className="w-4 h-4"/> {post.likes} Curtir</button>
                                    <button 
                                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)} 
                                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4"/> {post.comments.length} Comentários
                                    </button>
                                </div>

                                {selectedPost === post.id && (
                                    <div className="pt-4 space-y-4 animate-fade-in">
                                        <div className="space-y-3">
                                            {post.comments.map((c, i) => {
                                                const cAuthor = db.getUsers().find(u => u.id === c.userId);
                                                return (
                                                    <div key={i} className="bg-slate-50 p-4 rounded-2xl text-sm">
                                                        <p className="font-bold text-slate-900 mb-1">{cAuthor?.name}</p>
                                                        <p className="text-slate-600">{c.content}</p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-amber-500 text-sm" 
                                                placeholder="Comentar..."
                                                value={commentInput}
                                                onChange={e => setCommentInput(e.target.value)}
                                            />
                                            <button onClick={() => handleSendComment(post.id)} className="bg-slate-900 text-white p-2 rounded-xl"><Send className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-900"><Trophy className="w-5 h-5 text-amber-500"/> Ranking Bíblico</h3>
                    <div className="space-y-4">
                        {leaderboard.slice(0, 5).map((p, idx) => {
                            const u = db.getUsers().find(user => user.id === p.userId);
                            return (
                                <div key={p.userId} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                        {idx + 1}º
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm truncate">{u?.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{p.readingStats?.daysCompleted || 0} dias</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
                    <Quote className="w-10 h-10 text-white/20 mb-4" />
                    <p className="font-medium text-lg leading-relaxed italic">"Lâmpada para os meus pés é a tua palavra e luz para o meu caminho."</p>
                    <p className="mt-4 text-indigo-200 font-bold uppercase tracking-widest text-xs">— Salmos 119:105</p>
                </div>
            </div>
        </div>
    );
};

const ChatView = ({ messages, user, trainer, onMessageSent }: { messages: ChatMessage[], user: User, trainer?: User, onMessageSent: () => void }) => {
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !trainer) return;
        db.sendMessage({
            id: Date.now().toString(),
            senderId: user.id,
            receiverId: trainer.id,
            content: input,
            timestamp: new Date().toISOString(),
            read: false
        });
        setInput('');
        onMessageSent();
    };

    return (
        <div className="bg-white h-[calc(100vh-200px)] rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    {trainer?.name.charAt(0) || 'P'}
                </div>
                <div>
                    <h3 className="font-black text-slate-900">{trainer?.name || 'Personal Trainer'}</h3>
                    <p className="text-xs text-green-500 font-bold uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Inicie uma conversa com seu treinador</p>
                    </div>
                ) : (
                    messages.map(m => {
                        const isMe = m.senderId === user.id;
                        return (
                            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                    <p className="font-medium text-sm leading-relaxed">{m.content}</p>
                                    <p className={`text-[9px] mt-1 font-bold uppercase opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={endRef} />
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="relative">
                    <input 
                        className="w-full pl-6 pr-20 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-medium" 
                        placeholder="Mensagem para o personal..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} className="absolute right-2 top-2 bg-slate-900 text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-all">
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CommunityView = ({ posts, user }: { posts: SpiritualPost[], user: User }) => {
    const [msgInput, setMsgInput] = useState('');
    
    const handleSend = () => {
        if (!msgInput.trim()) return;
        db.addSpiritualPost({
            id: Date.now().toString(),
            userId: user.id,
            content: msgInput,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: []
        });
        setMsgInput('');
    }

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] animate-fade-in pb-10">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900">Comunidade Corpo & Alma</h2>
                <div className="bg-indigo-100 px-4 py-2 rounded-full text-indigo-600 font-bold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4"/> Chat Interno
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6">
                {posts.map(post => {
                    const author = db.getUsers().find(u => u.id === post.userId);
                    const isMe = post.userId === user.id;
                    return (
                        <div key={post.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                             <div className={`max-w-[80%] p-6 rounded-3xl shadow-sm border border-slate-100 ${isMe ? 'bg-white rounded-tr-none' : 'bg-indigo-50/50 rounded-tl-none'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                        {author?.name.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{author?.name}</span>
                                </div>
                                <p className="text-slate-700 font-medium leading-relaxed">{post.content}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                        </div>
                    )
                })}
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl flex gap-4">
                <input 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 font-medium" 
                    placeholder="Diga algo para a comunidade..." 
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:bg-indigo-600 transition-all">
                    <Send className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}

// --- Helpers ---

const MacroCard = ({ label, value, unit, color }: any) => {
    const colorMap: any = {
        indigo: 'bg-indigo-500 shadow-indigo-100',
        rose: 'bg-rose-500 shadow-rose-100',
        amber: 'bg-amber-500 shadow-amber-100',
        emerald: 'bg-emerald-500 shadow-emerald-100',
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-bold text-slate-400">{unit}</p>
            </div>
            <div className={`mt-3 h-1.5 rounded-full w-full ${colorMap[color]} bg-opacity-20`}>
                <div className={`h-full rounded-full ${colorMap[color]}`} style={{ width: '75%' }}></div>
            </div>
        </div>
    );
};

const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-slate-200 rounded-[2.5rem]"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-3xl"></div>
            <div className="h-32 bg-slate-200 rounded-3xl"></div>
            <div className="h-32 bg-slate-200 rounded-3xl"></div>
        </div>
    </div>
);

const Inativo = ({ msg }: { msg: string }) => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
             <ShieldCheck className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-2">{msg}</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Fale com seu personal trainer para liberar o acesso a este módulo em sua jornada Corpo & Alma.</p>
    </div>
);
