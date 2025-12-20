
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment, BookReview, WishlistBook, LibraryComment, CommunityPost } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Flame, Timer, Send, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, ChevronRight, Layers, X, Save, Loader2, ArrowLeft,
    MessageSquare, Trash2, BookmarkPlus, BookMarked, Users, History, Info
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
    const [spiritualPosts, setSpiritualPosts] = useState<SpiritualPost[]>([]);
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
    const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [trainer, setTrainer] = useState<User | undefined>();
    const [loading, setLoading] = useState(true);
    
    const loadData = async () => {
        const allUsers = await db.getAllUsersFromDb();
        const foundTrainer = allUsers.find(u => u.role === 'trainer');
        const p = await db.getProfile(user.id);
        const prog = await db.getProgress(user.id);
        
        setTrainer(foundTrainer);
        setProfile(p);
        setProgress(prog);
        setWorkouts(db.getWorkouts(user.id));
        setDiet(db.getDiet(user.id));
        setSpiritualPosts(db.getSpiritualPosts());
        setCommunityPosts(db.getCommunityPosts());
        setLeaderboard(db.getReadingLeaderboard());
        setEvents(db.getStudentEvents(user.id));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); 
        return () => clearInterval(interval);
    }, [user.id, activeTab]);

    if (loading && !profile) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!profile) return null;

    const totalBibleChapters = 1189;

    const BackButton = () => (
        <button onClick={() => onTabChange('dashboard')} className="flex items-center gap-2 text-slate-400 font-bold mb-6 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5"/> Voltar ao Início
        </button>
    );

    switch (activeTab) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-2">Olá, {user.name.split(' ')[0]}</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">Seu corpo é o templo, sua mente é a força.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card label="Peso" value={`${profile.weight} kg`} icon={Scale} color="bg-indigo-500" />
                        <Card label="Evoluções" value={progress.length} icon={Activity} color="bg-emerald-500" />
                        <Card label="Ofensiva" value={`${profile.readingStats?.streak || 0} dias`} icon={Flame} color="bg-rose-500" />
                        <Card label="Nível" value={profile.level} icon={Trophy} color="bg-amber-500" />
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><History className="w-5 h-5 text-indigo-600"/> Atalhos Rápidos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => onTabChange('progress')} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-slate-900 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:bg-white/10 group-hover:text-white"><Camera /></div>
                                    <span className="font-bold group-hover:text-white">Registrar Evolução</span>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-white" />
                            </button>
                            <button onClick={() => onTabChange('workouts')} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl group hover:bg-slate-900 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:bg-white/10 group-hover:text-white"><Dumbbell /></div>
                                    <span className="font-bold group-hover:text-white">Ver Treino de Hoje</span>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'workouts': 
            return (
                <div className="space-y-6 animate-fade-in">
                    <BackButton />
                    <WorkoutView workouts={workouts} user={user} profile={profile} />
                </div>
            );

        case 'diet':
            return (
                <div className="space-y-6 animate-fade-in">
                    <BackButton />
                    <DietView diet={diet} />
                </div>
            );

        case 'progress':
            return <ProgressView progress={progress} user={user} onUpdate={loadData} onBack={() => onTabChange('dashboard')} />;

        case 'library':
            return (
                <div className="space-y-6 animate-fade-in">
                    <BackButton />
                    <LibraryView user={user} profile={profile} />
                </div>
            );

        case 'spiritual':
            return (
                <div className="space-y-6 animate-fade-in">
                    <BackButton />
                    <SpiritualView user={user} profile={profile} posts={spiritualPosts} leaderboard={leaderboard} totalChapters={totalBibleChapters} />
                </div>
            );

        case 'messages':
            return (
                <div className="space-y-6 animate-fade-in">
                    <BackButton />
                    <ChatView messages={db.getMessages(user.id, trainer?.id || '')} user={user} trainer={trainer} onMessageSent={loadData} />
                </div>
            );

        case 'community':
            return (
                <div className="space-y-6 animate-fade-in">
                    <BackButton />
                    <CommunityView posts={communityPosts} user={user} onUpdate={loadData} />
                </div>
            );
            
        default:
            return (
                <div className="p-10 text-center">
                    <BackButton />
                    <p className="text-slate-400">Conteúdo em construção para a aba {activeTab}</p>
                </div>
            );
    }
};

const ProgressView = ({ progress, user, onUpdate, onBack }: { progress: ProgressLog[], user: User, onUpdate: () => void, onBack: () => void }) => {
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [newLog, setNewLog] = useState<{
        weight: string; waist: string; hips: string; arm: string; leg: string; photoUrl: string; notes: string;
    }>({
        weight: '', waist: '', hips: '', arm: '', leg: '', photoUrl: '', notes: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewLog(p => ({ ...p, photoUrl: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!newLog.weight) return alert('Informe ao menos o seu peso.');
        setIsSaving(true);
        try {
            await db.addProgress({
                id: Date.now().toString(),
                userId: user.id,
                date: new Date().toISOString(),
                weight: parseFloat(newLog.weight),
                measurements: {
                    waist: parseFloat(newLog.waist) || 0,
                    hips: parseFloat(newLog.hips) || 0,
                    arm: parseFloat(newLog.arm) || 0,
                    leg: parseFloat(newLog.leg) || 0
                },
                photoUrl: newLog.photoUrl,
                notes: newLog.notes
            });
            setShowModal(false);
            setNewLog({ weight: '', waist: '', hips: '', arm: '', leg: '', photoUrl: '', notes: '' });
            onUpdate();
        } catch (e) {
            alert('Erro ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold mb-2"><ArrowLeft className="w-4 h-4"/> Voltar</button>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Timelapse</h2>
                    <p className="text-slate-500 font-medium">Sua evolução registrada dia a dia.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 text-white p-4 md:px-8 md:py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                >
                    <Plus className="w-5 h-5 text-indigo-400" /> <span className="hidden md:inline">Novo Registro</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {progress.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-300 font-bold italic border-2 border-dashed border-slate-100 rounded-[3rem]">
                        Nenhum registro ainda. Comece hoje!
                    </div>
                ) : progress.map(log => (
                    <div key={log.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group">
                        <div className="aspect-[3/4] bg-slate-100 relative">
                            {log.photoUrl ? (
                                <img src={log.photoUrl} className="w-full h-full object-cover" alt="Progresso" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200"><Camera className="w-12 h-12" /></div>
                            )}
                            <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
                                {new Date(log.date).toLocaleDateString('pt-BR')}
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-4">
                                <p className="font-black text-2xl">{log.weight} kg</p>
                                <Scale className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase text-slate-400">
                                <span className="bg-slate-50 p-2 rounded-lg">Cintura: {log.measurements?.waist}cm</span>
                                <span className="bg-slate-50 p-2 rounded-lg">Braço: {log.measurements?.arm}cm</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black">Novo Registro</h2>
                            <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-slate-300"/></button>
                        </div>
                        <div className="space-y-4">
                            <label className="block w-full aspect-video bg-slate-50 border-4 border-dashed border-slate-100 rounded-[2rem] relative overflow-hidden cursor-pointer group hover:bg-slate-100 transition-all">
                                {newLog.photoUrl ? <img src={newLog.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300"><Camera className="w-8 h-8 group-hover:scale-110"/><span className="text-[10px] font-black uppercase">Foto</span></div>}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <div className="grid grid-cols-1 gap-4">
                                <input type="number" placeholder="Peso Atual (kg)" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-lg" value={newLog.weight} onChange={e => setNewLog(p => ({...p, weight: e.target.value}))} />
                                <div className="grid grid-cols-2 gap-4">
                                    <MedidaInput label="Cintura" value={newLog.waist} onChange={v => setNewLog(p => ({...p, waist: v}))} />
                                    <MedidaInput label="Braço" value={newLog.arm} onChange={v => setNewLog(p => ({...p, arm: v}))} />
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={isSaving} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin"/> : <Save/>} Salvar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const WorkoutView = ({ workouts, user }: any) => {
    const [activeSplit, setActiveSplit] = useState(workouts[0]?.id || '');
    const currentWorkout = workouts.find((w: any) => w.id === activeSplit) || workouts[0];
    if (!currentWorkout) return <div className="p-20 text-center text-slate-400 font-bold">Ficha em preparação.</div>;
    return (
        <div className="space-y-6">
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {workouts.map((w: any) => (<button key={w.id} onClick={() => setActiveSplit(w.id)} className={`px-6 py-3 rounded-xl font-black whitespace-nowrap border-2 ${activeSplit === w.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-400 border-slate-50'}`}>{w.split}</button>))}
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <h3 className="text-3xl font-black mb-8">{currentWorkout.title}</h3>
                <div className="space-y-4">
                    {currentWorkout.exercises.map((ex: any, idx: number) => (
                        <div key={ex.id} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between gap-4">
                            <div><p className="font-black text-lg">{ex.name}</p><p className="text-xs text-slate-400 font-bold uppercase">{ex.sets}x {ex.reps} • {ex.load}</p></div>
                            <CheckCircle className="w-8 h-8 text-slate-200" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DietView = ({ diet }: any) => {
    if (!diet) return <div className="p-20 text-center text-slate-400 font-bold">Dieta em análise.</div>;
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MacroCard label="Calorias" value={diet.macros.calories} unit="kcal" color="indigo" />
                <MacroCard label="Proteínas" value={diet.macros.protein} unit="g" color="rose" />
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100"><p className="text-slate-700 leading-relaxed italic whitespace-pre-wrap">"{diet.content}"</p></div>
        </div>
    );
};

const LibraryView = ({ user, profile }: any) => {
    const [view, setView] = useState<'shelf' | 'community' | 'wishlist'>('shelf');
    const reviews = db.getBookReviews();
    return (
        <div className="space-y-8">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 w-fit">
                <button onClick={() => setView('shelf')} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase ${view === 'shelf' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Estante</button>
                <button onClick={() => setView('community')} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase ${view === 'community' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Comunidade</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map(r => <div key={r.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><h4 className="font-black mb-1">{r.title}</h4><p className="text-xs text-slate-400 mb-4">{r.author}</p><p className="text-sm italic text-slate-600 line-clamp-3">"{r.review}"</p></div>)}
            </div>
        </div>
    );
};

const SpiritualView = ({ profile, leaderboard, posts, totalChapters, user }: any) => {
    const progressPercent = Math.min(100, ((profile.readingStats?.totalChaptersRead || 0) / totalChapters) * 100);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-2xl font-black mb-6">Meu Ápice</h3>
                    <div className="w-full h-4 bg-slate-50 rounded-full p-1"><div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progressPercent}%` }}></div></div>
                    <p className="mt-4 font-black text-indigo-600">{profile.readingStats?.totalChaptersRead || 0} de {totalChapters} capítulos lidos.</p>
                </div>
                <div className="space-y-6">{posts.map((p:any) => <div key={p.id} className="bg-white p-8 rounded-[2rem] border border-slate-100"><p className="font-bold text-sm mb-2">{p.userName}</p><p className="italic text-slate-600">"{p.content}"</p></div>)}</div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] h-fit border border-slate-100 shadow-sm">
                <h3 className="font-black text-lg mb-6 flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Ranking</h3>
                <div className="space-y-4">{leaderboard.slice(0, 5).map((l:any, i:number) => <div key={l.userId} className="flex items-center gap-3"><span className="font-black text-slate-300 w-6">{i+1}º</span><span className="font-bold text-sm flex-1">{l.userId === user.id ? 'Você' : 'Membro'}</span><span className="font-black text-indigo-600 text-xs">{l.readingStats?.totalChaptersRead || 0}</span></div>)}</div>
            </div>
        </div>
    );
};

const ChatView = ({ messages, user, trainer, onMessageSent }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="bg-white h-[60vh] rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="p-6 border-b font-black">{trainer?.name || 'Personal'}</div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {messages.map((m: any) => (<div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${m.senderId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>{m.content}</div></div>))}
            </div>
            <div className="p-6 bg-white border-t flex gap-3"><input className="flex-1 bg-slate-50 p-4 rounded-xl outline-none font-bold text-sm" placeholder="Mensagem..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && input && (db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} /><button onClick={() => input && (db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg"><Send className="w-5 h-5" /></button></div>
        </div>
    );
};

const CommunityView = ({ posts, user, onUpdate }: any) => {
    const [msgInput, setMsgInput] = useState('');
    return (
        <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-6 custom-scrollbar">
                {posts.map((post: any) => (
                    <div key={post.id} className={`flex ${post.userId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl shadow-sm text-sm ${post.userId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}><p className="text-[9px] font-black opacity-40 uppercase mb-1">{post.userName}</p><p className="font-medium">{post.content}</p></div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-3 rounded-2xl border flex gap-3"><input className="flex-1 bg-slate-50 px-6 py-4 rounded-xl outline-none font-bold text-sm" placeholder="Postar na comunidade..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (db.addCommunityPost({ id: Date.now().toString(), userId: user.id, userName: user.name, content: msgInput, timestamp: new Date().toISOString() }), setMsgInput(''), onUpdate())} /><button onClick={() => { if(msgInput) { db.addCommunityPost({ id: Date.now().toString(), userId: user.id, userName: user.name, content: msgInput, timestamp: new Date().toISOString() }); setMsgInput(''); onUpdate(); } }} className="bg-slate-900 text-white p-4 rounded-xl"><Send className="w-6 h-6" /></button></div>
        </div>
    );
};

const MedidaInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div><label className="text-[9px] font-black uppercase text-slate-400 mb-1 block ml-1">{label}</label>
    <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={value} onChange={e => onChange(e.target.value)} /></div>
);

const MacroCard = ({ label, value, unit, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 mb-2">{label}</p><p className="text-xl font-black text-slate-900">{value} <span className="text-[10px] font-bold text-slate-300">{unit}</span></p></div>
);

const Card = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}><Icon className="w-5 h-5" /></div>
        <div><p className="text-[10px] font-black uppercase text-slate-400 leading-tight">{label}</p><p className="text-lg font-black text-slate-900">{value}</p></div>
    </div>
);
