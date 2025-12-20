
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment, BookReview, WishlistBook, LibraryComment, CommunityPost } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Droplets, Flame, Timer, Footprints, Send, Play, MapPin, StopCircle, 
    Pause, Heart, MessageCircle, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, Target, ChevronRight, Hash, Clock, History, Star, ThumbsUp,
    ShieldCheck, Bell, Info, Users, Flame as BurnIcon, XCircle, Bike, Library, 
    BookMarked, BookmarkPlus, MessageSquare, Trash2, Layers, X, Save, Loader2
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
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
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
                const prog = await db.getProgress(user.id);
                
                setTrainer(foundTrainer);
                setProfile(p);
                setWorkouts(db.getWorkouts(user.id));
                setDiet(db.getDiet(user.id));
                setProgress(prog);
                setActivityLogs(db.getActivity(user.id));
                
                if (foundTrainer) setMessages(db.getMessages(user.id, foundTrainer.id));
                setSpiritualPosts(db.getSpiritualPosts());
                setCommunityPosts(db.getCommunityPosts());
                setLeaderboard(db.getReadingLeaderboard());
                setEvents(db.getStudentEvents(user.id));
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        load();
        const interval = setInterval(load, 10000); 
        return () => clearInterval(interval);
    }, [user.id, activeTab]);

    if (loading && !profile) return <DashboardSkeleton />;
    if (!profile) return <DashboardSkeleton />;

    const totalCaloriesToday = activityLogs
        .filter(log => log.date.split('T')[0] === new Date().toISOString().split('T')[0])
        .reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

    const totalBibleChapters = 1189;
    const readChapters = profile.readingStats?.totalChaptersRead || 0;
    const progressPercent = Math.min(100, (readChapters / totalBibleChapters) * 100);

    switch (activeTab) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-2 text-white">Olá, {user.name.split(' ')[0]}</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">Seu corpo é o templo, sua mente é a força.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card label="Peso Atual" value={`${profile.weight} kg`} icon={Scale} color="bg-indigo-500 shadow-indigo-100" />
                        <Card label="Calorias Ativas" value={`${Math.round(totalCaloriesToday)} kcal`} icon={BurnIcon} color="bg-rose-500 shadow-rose-100" />
                        <Card label="Capítulos Lidos" value={`${readChapters} / ${totalBibleChapters}`} icon={Layers} color="bg-amber-500 shadow-amber-100" />
                        <Card label="Ofensiva" value={`${profile.readingStats?.streak || 0} dias`} icon={Flame} color="bg-emerald-500 shadow-emerald-100" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {workouts.length > 0 && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><Dumbbell className="w-5 h-5 text-indigo-600"/> Treinos Prescritos</h3>
                                    <div className="space-y-4">
                                        {workouts.slice(0, 2).map(w => (
                                            <div key={w.id} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-slate-900 hover:text-white transition-all shadow-sm" onClick={() => onTabChange('workouts')}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-white/10 group-hover:text-white shadow-sm transition-all border border-slate-100">
                                                        {w.sportType === SportType.GYM ? <Dumbbell className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg">{w.title}</p>
                                                        <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">{w.sportType} • {w.split}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><CalendarIcon className="w-5 h-5 text-indigo-600"/> Próximos Eventos</h3>
                                <div className="space-y-4">
                                    {events.length === 0 ? <p className="text-slate-400 text-sm italic text-center py-6 font-medium">Sua agenda está livre.</p> : events.slice(0, 3).map(e => {
                                        const isConfirmed = e.attendees?.includes(user.id);
                                        return (
                                            <div key={e.id} className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${isConfirmed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                                                <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm text-slate-900"><span className="text-[9px] font-black uppercase text-indigo-600 leading-none">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span><span className="text-xl font-black">{new Date(e.date).getDate()}</span></div>
                                                <div className="flex-1"><p className="font-bold text-slate-900 text-sm leading-tight">{e.title}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{e.time}</p></div>
                                                <button onClick={() => db.rsvpToEvent(e.id, user.id, !isConfirmed)} className={`p-3 rounded-2xl transition-all ${isConfirmed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-slate-300 border border-slate-100 hover:text-indigo-600 hover:border-indigo-100 shadow-sm active:scale-90'}`}>{isConfirmed ? <CheckCircle className="w-5 h-5" /> : <Star className="w-5 h-5" />}</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-amber-900"><BookOpen className="w-6 h-6 text-amber-600"/> Frequência Bíblica</h3>
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Jornada</span>
                                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black">{readChapters} / {totalBibleChapters} CAPS</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1">
                                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000 shadow-inner" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                    <button onClick={() => onTabChange('spiritual')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3">
                                        <Layers className="w-5 h-5 text-amber-400" /> Registrar Capítulos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case 'library': return <LibraryView user={user} profile={profile} />;
        case 'workouts': return <WorkoutView workouts={workouts} user={user} profile={profile} />;
        case 'diet': return <DietView diet={diet} />;
        case 'progress': return <ProgressView progress={progress} user={user} onUpdate={async () => setProgress(await db.getProgress(user.id))} />;
        case 'spiritual': return <SpiritualView user={user} profile={profile} posts={spiritualPosts} leaderboard={leaderboard} totalChapters={totalBibleChapters} />;
        case 'messages': return <ChatView messages={messages} user={user} trainer={trainer} onMessageSent={() => setMessages(db.getMessages(user.id, trainer?.id || ''))} />;
        case 'community': return <CommunityView posts={communityPosts} user={user} onUpdate={() => setCommunityPosts(db.getCommunityPosts())} />;
        default: return <Inativo msg="Módulo em desenvolvimento." />;
    }
};

const LibraryView = ({ user, profile }: { user: User, profile: UserProfile }) => {
    const [view, setView] = useState<'shelf' | 'community' | 'wishlist'>('shelf');
    const [reviews, setReviews] = useState<BookReview[]>([]);
    const [wishlist, setWishlist] = useState<WishlistBook[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBook, setNewBook] = useState({ title: '', author: '', review: '', rating: 5 });

    useEffect(() => {
        setReviews(db.getBookReviews());
        setWishlist(db.getWishlist(user.id));
    }, [user.id, view]);

    const handleSaveReview = () => {
        if (!newBook.title || !newBook.author) return;
        const review: BookReview = {
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatarUrl,
            title: newBook.title,
            author: newBook.author,
            review: newBook.review,
            rating: newBook.rating,
            timestamp: new Date().toISOString(),
            comments: []
        };
        db.saveBookReview(review);
        setShowAddModal(false);
        setNewBook({ title: '', author: '', review: '', rating: 5 });
        setReviews(db.getBookReviews());
    };

    const addToWishlistFromReview = (review: BookReview) => {
        db.addToWishlist({
            id: Date.now().toString(),
            userId: user.id,
            title: review.title,
            author: review.author,
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            addedAt: new Date().toISOString()
        });
        alert('Livro adicionado à sua Área de Desejos!');
    };

    const addComment = (reviewId: string, content: string) => {
        if (!content) return;
        db.addReviewComment(reviewId, {
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            content: content,
            timestamp: new Date().toISOString()
        });
        setReviews(db.getBookReviews());
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Biblioteca Social</h2>
                    <p className="text-slate-500 font-medium italic">Compartilhe conhecimento, multiplique evolução.</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-auto overflow-x-auto">
                    <TabBtn active={view === 'shelf'} onClick={() => setView('shelf')} label="Minha Estante" icon={Library} />
                    <TabBtn active={view === 'community'} onClick={() => setView('community')} label="Explorar" icon={Users} />
                    <TabBtn active={view === 'wishlist'} onClick={() => setView('wishlist')} label="Desejos" icon={BookMarked} />
                </div>
            </div>

            {view === 'shelf' && (
                <div className="space-y-8">
                    <button onClick={() => setShowAddModal(true)} className="w-full bg-indigo-600 text-white py-8 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all active:scale-[0.98]">
                        <Plus className="w-7 h-7" /> Registrar Novo Livro Lido
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.filter(r => r.userId === user.id).map(r => (
                            <BookCard key={r.id} review={r} isOwn />
                        ))}
                        {reviews.filter(r => r.userId === user.id).length === 0 && (
                            <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-4">
                                <Library className="w-16 h-16 text-slate-200" />
                                <p className="text-slate-400 font-bold">Você ainda não registrou leituras. Comece agora!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {view === 'community' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {reviews.map(r => (
                        <CommunityReviewCard key={r.id} review={r} onAddToWishlist={() => addToWishlistFromReview(r)} onComment={(c) => addComment(r.id, c)} currentUserId={user.id} />
                    ))}
                    {reviews.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-bold">Nenhuma resenha na comunidade ainda.</div>}
                </div>
            )}

            {view === 'wishlist' && (
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><BookMarked className="w-8 h-8" /></div>
                        <h3 className="text-3xl font-black text-slate-900">Quero Ler em Breve</h3>
                    </div>
                    {wishlist.length === 0 ? (
                        <div className="text-center py-20 text-slate-300 font-bold italic">Sua lista de desejos está vazia. Explore o feed para encontrar inspiração!</div>
                    ) : (
                        <div className="space-y-4">
                            {wishlist.map(w => (
                                <div key={w.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-16 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center font-black text-indigo-600/30">📖</div>
                                        <div>
                                            <p className="font-black text-lg text-slate-900">{w.title}</p>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{w.author}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:block text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Meta Estimada</p>
                                            <p className="font-bold text-indigo-600">{new Date(w.targetDate).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => db.removeFromWishlist(w.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors active:scale-90"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-8 slide-up">
                        <h2 className="text-3xl font-black text-slate-900 text-center">Registrar Livro</h2>
                        <div className="space-y-4">
                            <input className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all" placeholder="Título do Livro" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                            <input className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all" placeholder="Autor" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                            <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-6 rounded-2xl">
                                <span className="text-[10px] font-black uppercase text-slate-400">Sua Nota:</span>
                                <div className="flex gap-2">
                                    {[1,2,3,4,5].map(star => (
                                        <button key={star} onClick={() => setNewBook({...newBook, rating: star})} className={`transition-all active:scale-90 ${newBook.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}>
                                            <Star className={`w-8 h-8 ${newBook.rating >= star ? 'fill-current' : ''}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-medium h-40 transition-all" placeholder="Escreva uma breve resenha ou o que mais te impactou..." value={newBook.review} onChange={e => setNewBook({...newBook, review: e.target.value})} />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-500 font-black hover:bg-slate-200 transition-all">Cancelar</button>
                            <button onClick={handleSaveReview} className="flex-2 bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 px-10 hover:bg-indigo-700 transition-all">Publicar na Minha Estante</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
// ... rest of file unchanged
