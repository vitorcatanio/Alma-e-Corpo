
// Fix: Corrected property missing errors and added missing awaits for async storage calls

import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Droplets, Flame, Timer, Footprints, Send, Play, MapPin, StopCircle, 
    Pause, Heart, MessageCircle, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, Target, ChevronRight, Hash, Clock, History, Star, ThumbsUp,
    ShieldCheck, Bell, Info, Users, Flame as BurnIcon, XCircle
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
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const load = async () => {
            try {
                const allUsers = await db.getAllUsersFromDb();
                const foundTrainer = allUsers.find(u => u.role === 'trainer');
                const p = await db.getProfile(user.id);
                
                setTrainer(foundTrainer);
                setProfile(p);
                
                // Fix: Properly await async storage calls to populate state correctly
                setWorkouts(await db.getWorkouts(user.id));
                setDiet(await db.getDiet(user.id));
                setProgress(await db.getProgress(user.id));
                setActivityLogs(await db.getActivity(user.id));
                
                if (foundTrainer) {
                    setMessages(await db.getMessages(user.id, foundTrainer.id));
                }
                
                setSpiritualPosts(await db.getSpiritualPosts());
                setLeaderboard(await db.getReadingLeaderboard());
                setEvents(await db.getStudentEvents(user.id));
            } catch (err) {
                console.error("Erro ao sincronizar dados do aluno:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 5000); 
        return () => clearInterval(interval);
    }, [user.id, activeTab]);

    const handleRSVP = async (eventId: string, isAttending: boolean) => {
        await db.rsvpToEvent(eventId, user.id, isAttending);
        // Fix: Added await to the newly created getStudentEvents method
        setEvents(await db.getStudentEvents(user.id));
    };

    if (loading && !profile) return <DashboardSkeleton />;
    if (!profile) return <DashboardSkeleton />;

    const isFitnessActive = profile.activeModules.fitness;
    const isSpiritualActive = profile.activeModules.spiritual;
    const isReadingActive = profile.activeModules.reading;

    const totalCaloriesToday = activityLogs
        .filter(log => log.date.split('T')[0] === new Date().toISOString().split('T')[0])
        .reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

    switch (activeTab) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10"><h2 className="text-4xl font-black mb-2">Olá, {user.name.split(' ')[0]}</h2><p className="text-slate-400">Sua jornada Corpo & Alma continua hoje.</p></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isFitnessActive && <Card label="Peso Atual" value={`${profile.weight} kg`} icon={Scale} color="bg-indigo-500" />}
                        {isFitnessActive && <Card label="Calorias Ativas" value={`${Math.round(totalCaloriesToday)} kcal`} icon={BurnIcon} color="bg-rose-500" />}
                        {isSpiritualActive && <Card label="Dias Lidos" value={`${profile.readingStats?.daysCompleted || 0} dias`} icon={BookOpen} color="bg-amber-500" />}
                        {isReadingActive && <Card label="Livros Lidos" value={`${profile.onboardingChoices.extraReadingProgress || 0} / ${profile.onboardingChoices.extraReadingGoal || 0}`} icon={Target} color="bg-emerald-500" />}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {isFitnessActive && workouts.length > 0 && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><Dumbbell className="w-5 h-5 text-indigo-600"/> Próximo Treino</h3>
                                    {workouts.slice(0, 1).map(w => (
                                        <div key={w.id} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-all" onClick={() => onTabChange('workouts')}>
                                            <div><p className="font-bold text-lg">{w.title}</p><p className="text-sm text-slate-500">{w.exercises.length} exercícios</p></div>
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"><Play className="w-4 h-4" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><CalendarIcon className="w-5 h-5 text-indigo-600"/> Agenda e Eventos</h3>
                                <div className="space-y-4">
                                    {events.length === 0 ? (
                                        <p className="text-slate-400 text-sm italic text-center py-6">Nenhum evento agendado.</p>
                                    ) : (
                                        events.slice(0, 3).map(e => {
                                            const isConfirmed = e.attendees?.includes(user.id);
                                            return (
                                                <div key={e.id} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${isConfirmed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent'}`}>
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span>
                                                        <span className="text-lg font-black leading-none">{new Date(e.date).getDate()}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-900 text-sm">{e.title}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{e.time}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleRSVP(e.id, !isConfirmed)}
                                                        className={`p-3 rounded-xl transition-all ${isConfirmed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200 hover:border-indigo-400 hover:text-indigo-400'}`}
                                                    >
                                                        {isConfirmed ? <CheckCircle className="w-5 h-5" /> : <Star className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {isSpiritualActive && (
                                <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-amber-900"><BookOpen className="w-5 h-5 text-amber-600"/> Leitura Diária</h3>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                                        <p className="text-xs text-slate-400 font-bold mb-4">Streak: {profile.readingStats?.streak || 0} dias 🔥</p>
                                        <button onClick={() => db.checkInReading(user.id)} className="w-full bg-amber-500 text-white py-4 rounded-xl font-black shadow-lg hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Confirmar Leitura</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );

        case 'workouts': return <WorkoutView workouts={workouts} user={user} profile={profile} />;
        case 'diet': return <DietView diet={diet} />;
        case 'progress': return <ProgressView progress={progress} user={user} onUpdate={async () => setProgress(await db.getProgress(user.id))} />;
        case 'spiritual': return <SpiritualView user={user} posts={spiritualPosts} leaderboard={leaderboard} />;
        case 'messages': return <ChatView messages={messages} user={user} trainer={trainer} onMessageSent={async () => setMessages(await db.getMessages(user.id, trainer?.id || ''))} />;
        case 'community': return <CommunityView posts={spiritualPosts} user={user} />;
        default: return <div>Em breve</div>;
    }
};

// --- Sub-Components ---
const Card = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6"><div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><Icon className="w-7 h-7" /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div></div>
);

const WorkoutView = ({ workouts, user, profile }: any) => {
    const [activeSplit, setActiveSplit] = useState(workouts[0]?.id || '');
    const currentWorkout = workouts.find((w: any) => w.id === activeSplit) || workouts[0];
    if (!currentWorkout) return <Inativo msg="Nenhum treino prescrito." />;
    return (<div className="space-y-6 animate-fade-in pb-20"><div className="flex gap-2 overflow-x-auto pb-4">{workouts.map((w: any) => (<button key={w.id} onClick={() => setActiveSplit(w.id)} className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all ${activeSplit === w.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100'}`}>Treino {w.split}</button>))}</div><div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"><div className="flex justify-between items-start mb-8"><div><h2 className="text-3xl font-black text-slate-900">{currentWorkout.title}</h2></div><button onClick={() => alert('Treino finalizado!')} className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Finalizar</button></div><div className="space-y-4">{currentWorkout.exercises.map((ex: any, idx: number) => (<div key={ex.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4"><div className="flex-1"><h4 className="font-bold text-lg"><span className="text-indigo-600 font-black">#{idx + 1}</span> {ex.name}</h4><p className="text-sm text-slate-500 mt-1">{ex.sets} séries x {ex.reps}</p></div><button className="w-10 h-10 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></button></div>))}</div></div></div>);
};

const DietView = ({ diet }: any) => {
    if (!diet) return <Inativo msg="Dieta pendente." />;
    return (<div className="space-y-6 animate-fade-in pb-20"><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><MacroCard label="Calorias" value={diet.macros.calories} unit="kcal" color="indigo" /><MacroCard label="Proteínas" value={diet.macros.protein} unit="g" color="rose" /><MacroCard label="Carbos" value={diet.macros.carbs} unit="g" color="amber" /><MacroCard label="Gorduras" value={diet.macros.fats} unit="g" color="emerald" /></div><div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100"><h3 className="text-2xl font-black mb-6">Plano Alimentar</h3><div className="text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: diet.content.replace(/\n/g, '<br/>') }} /></div></div>);
};

const ProgressView = ({ progress, user, onUpdate }: any) => {
    const [isAdding, setIsAdding] = useState(false);
    return (<div className="space-y-8 animate-fade-in pb-20"><div className="flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">Timelapse</h2><button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Novo Registro</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{progress.map((log: any) => (<div key={log.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 group"><div className="aspect-square bg-slate-100 relative overflow-hidden">{log.photoUrl ? <img src={log.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-12 h-12" /></div>}</div><div className="p-6"><p className="font-bold text-lg text-slate-900">{log.weight} kg</p></div></div>))}</div></div>);
};

const SpiritualView = ({ user, posts, leaderboard }: any) => {
    const [newPost, setNewPost] = useState('');
    return (<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20"><div className="lg:col-span-2 space-y-6"><div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><h3 className="text-xl font-black mb-4">Compartilhar Reflexão</h3><div className="relative"><textarea className="w-full p-6 bg-slate-50 rounded-2xl border border-slate-200 min-h-[120px]" placeholder="Qual Rhema o Senhor te deu hoje?" value={newPost} onChange={e => setNewPost(e.target.value)} /><button onClick={async () => { await db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, content: newPost, timestamp: new Date().toISOString(), likes: 0, comments: [] }); setNewPost(''); }} className="absolute bottom-4 right-4 bg-amber-500 text-white p-3 rounded-xl shadow-lg"><Send className="w-5 h-5" /></button></div></div><div className="space-y-6">{posts.map((post: any) => (<div key={post.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><p className="text-slate-600 leading-relaxed font-medium">{post.content}</p></div>))}</div></div><div className="space-y-6"><div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"><h3 className="text-xl font-black mb-6">Ranking Bíblico</h3><div className="space-y-4">{leaderboard.slice(0, 5).map((p: any, idx: number) => (<div key={p.userId} className="flex items-center gap-4"><div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-slate-100">{idx + 1}º</div><div className="flex-1"><p className="text-[10px] text-slate-400 font-bold uppercase">{p.readingStats?.daysCompleted || 0} dias</p></div></div>))}</div></div></div></div>);
};

const ChatView = ({ messages, user, trainer, onMessageSent }: any) => {
    const [input, setInput] = useState('');
    return (<div className="bg-white h-[calc(100vh-200px)] rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-fade-in"><div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50"><div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">{trainer?.name.charAt(0) || 'P'}</div><div><h3 className="font-black text-slate-900">{trainer?.name || 'Personal'}</h3></div></div><div className="flex-1 overflow-y-auto p-8 space-y-4">{messages.map((m: any) => (<div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}><p className="font-medium text-sm leading-relaxed">{m.content}</p></div></div>))}</div><div className="p-6 bg-slate-50/50 border-t border-slate-100"><div className="relative"><input className="w-full pl-6 pr-20 py-4 bg-white border border-slate-200 rounded-2xl outline-none" placeholder="Mensagem..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={async e => e.key === 'Enter' && (await db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} /><button onClick={async () => (await db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} className="absolute right-2 top-2 bg-slate-900 text-white p-3 rounded-xl"><Send className="w-5 h-5" /></button></div></div></div>);
};

const CommunityView = ({ posts, user }: any) => {
    const [msgInput, setMsgInput] = useState('');
    return (<div className="flex flex-col h-[calc(100vh-200px)] animate-fade-in pb-10"><div className="mb-6 flex justify-between items-center"><h2 className="text-3xl font-black text-slate-900">Comunidade</h2></div><div className="flex-1 overflow-y-auto space-y-4 mb-6">{posts.map((post: any) => (<div key={post.id} className={`flex ${post.userId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-6 rounded-3xl shadow-sm border border-slate-100 ${post.userId === user.id ? 'bg-white' : 'bg-indigo-50/50'}`}><p className="text-slate-700 font-medium">{post.content}</p></div></div>))}</div><div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl flex gap-4"><input className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none" placeholder="Diga algo..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={async e => e.key === 'Enter' && (await db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, content: msgInput, timestamp: new Date().toISOString(), likes: 0, comments: [] }), setMsgInput(''))} /><button onClick={async () => (await db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, content: msgInput, timestamp: new Date().toISOString(), likes: 0, comments: [] }), setMsgInput(''))} className="bg-slate-900 text-white p-4 rounded-2xl"><Send className="w-6 h-6" /></button></div></div>);
};

// --- Helpers ---
const MacroCard = ({ label, value, unit, color }: any) => (<div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><div className="flex items-baseline gap-1"><p className="text-2xl font-black text-slate-900">{value}</p><p className="text-xs font-bold text-slate-400">{unit}</p></div></div>);
const DashboardSkeleton = () => (<div className="space-y-8 animate-pulse"><div className="h-48 bg-slate-200 rounded-[2.5rem]"></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="h-32 bg-slate-200 rounded-3xl"></div><div className="h-32 bg-slate-200 rounded-3xl"></div><div className="h-32 bg-slate-200 rounded-3xl"></div></div></div>);
const Inativo = ({ msg }: any) => (<div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center"><div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4"><ShieldCheck className="w-10 h-10 text-slate-300" /></div><h3 className="text-2xl font-black text-slate-900 mb-2">{msg}</h3><p className="text-slate-500 max-w-xs mx-auto">Fale com seu personal trainer.</p></div>);
