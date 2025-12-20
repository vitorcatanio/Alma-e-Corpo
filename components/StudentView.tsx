import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment, BookReview, WishlistBook, LibraryComment, CommunityPost } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Droplets, Flame, Timer, Footprints, Send, Play, MapPin, StopCircle, 
    Pause, Heart, MessageCircle, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, Target, ChevronRight, Hash, Clock, History, Star, ThumbsUp,
    ShieldCheck, Bell, Info, Users, Flame as BurnIcon, XCircle, Bike, Library, 
    BookMarked, BookmarkPlus, MessageSquare, Trash2, Layers
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
                
                setTrainer(foundTrainer);
                setProfile(p);
                setWorkouts(db.getWorkouts(user.id));
                setDiet(db.getDiet(user.id));
                setProgress(db.getProgress(user.id));
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
                            <h2 className="text-4xl font-black mb-2">Olá, {user.name.split(' ')[0]}</h2>
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
        case 'progress': return <ProgressView progress={progress} user={user} onUpdate={() => setProgress(db.getProgress(user.id))} />;
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

const TabBtn = ({ active, onClick, label, icon: Icon }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}>
        <Icon className="w-4 h-4" /> {label}
    </button>
);

// Fix: Used React.FC to properly support intrinsic attributes like 'key' when mapping over reviews
const BookCard: React.FC<{ review: BookReview; isOwn?: boolean }> = ({ review, isOwn }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
        <div className={`h-40 bg-gradient-to-br ${isOwn ? 'from-indigo-600 to-violet-700' : 'from-slate-700 to-slate-900'} p-8 flex flex-col justify-end relative`}>
            <Quote className="absolute top-6 right-6 w-12 h-12 text-white/10" />
            <h4 className="text-white font-black text-xl leading-tight line-clamp-2">{review.title}</h4>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">{review.author}</p>
        </div>
        <div className="p-8 space-y-4 flex-1 flex flex-col">
            <div className="flex text-amber-400 gap-1">
                {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-4 italic flex-1">"{review.review}"</p>
            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(review.timestamp).toLocaleDateString()}</span>
                <div className="flex items-center gap-1.5 text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-full">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black">{review.comments?.length || 0}</span>
                </div>
            </div>
        </div>
    </div>
);

// Fix: Used React.FC to properly support intrinsic attributes like 'key' when mapping over reviews
const CommunityReviewCard: React.FC<{ review: BookReview; onAddToWishlist: () => void; onComment: (c: string) => void; currentUserId: string }> = ({ review, onAddToWishlist, onComment, currentUserId }) => {
    const [commentInput, setCommentInput] = useState('');
    const [showComments, setShowComments] = useState(false);

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="p-8 flex flex-col sm:flex-row gap-8">
                <div className="w-full sm:w-28 h-40 bg-slate-900 rounded-2xl flex-shrink-0 shadow-lg flex flex-col justify-center items-center text-center p-4 text-white relative group-hover:rotate-1 transition-transform">
                    <Library className="absolute top-4 opacity-10 w-10 h-10" />
                    <p className="text-[9px] font-black uppercase opacity-60 leading-tight mt-4">{review.title}</p>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs overflow-hidden border border-indigo-100">
                            {review.userAvatar ? <img src={review.userAvatar} className="w-full h-full object-cover" /> : review.userName.charAt(0)}
                        </div>
                        <p className="text-xs font-black text-slate-900">{review.userName}</p>
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 leading-tight">{review.title}</h4>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{review.author}</p>
                    </div>
                    <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                    </div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-4">"{review.review}"</p>
                    
                    <div className="flex flex-wrap gap-4 pt-2">
                        {review.userId !== currentUserId && (
                            <button onClick={onAddToWishlist} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                                <BookmarkPlus className="w-4 h-4" /> Quero Ler
                            </button>
                        )}
                        <button onClick={() => setShowComments(!showComments)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showComments ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                            <MessageSquare className="w-4 h-4" /> {review.comments?.length || 0} Comentários
                        </button>
                    </div>
                </div>
            </div>

            {showComments && (
                <div className="px-8 pb-8 space-y-6 animate-fade-in">
                    <div className="border-t border-slate-50 pt-6 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {review.comments?.length === 0 ? <p className="text-xs text-slate-400 italic">Nenhum comentário ainda. Seja o primeiro!</p> : review.comments?.map(c => (
                            <div key={c.id} className="flex gap-4 items-start bg-slate-50 p-5 rounded-2xl">
                                <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-500 shadow-sm">{c.userName.charAt(0)}</div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900 leading-none mb-1">{c.userName}</p>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{c.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        <input className="w-full pl-6 pr-16 py-5 bg-slate-50 rounded-[1.5rem] outline-none focus:bg-white border-2 border-transparent focus:border-indigo-500 font-bold text-sm transition-all" placeholder="Deixe um comentário para o leitor..." value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (onComment(commentInput), setCommentInput(''))} />
                        <button onClick={() => { if(commentInput) { onComment(commentInput); setCommentInput(''); } }} className="absolute right-2 top-2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-90">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Card = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all"><div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}><Icon className="w-7 h-7" /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div></div>
);

const WorkoutView = ({ workouts, user, profile }: any) => {
    const [activeSplit, setActiveSplit] = useState(workouts[0]?.id || '');
    const currentWorkout = workouts.find((w: any) => w.id === activeSplit) || workouts[0];
    if (!currentWorkout) return <Inativo msg="Ficha em preparação." />;
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex gap-3 overflow-x-auto pb-4 px-1 custom-scrollbar">{workouts.map((w: any) => (<button key={w.id} onClick={() => setActiveSplit(w.id)} className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all shadow-sm border-2 ${activeSplit === w.id ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-500 border-slate-50 hover:border-indigo-100'}`}>Treino {w.split}</button>))}</div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-50 pb-8">
                    <div><div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">{currentWorkout.sportType}</span></div><h2 className="text-4xl font-black text-slate-900 tracking-tight">{currentWorkout.title}</h2></div>
                    <button onClick={() => alert('Parabéns! Treino concluído.')} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 active:scale-95"><CheckCircle className="w-6 h-6" /> Concluir Treino</button>
                </div>
                <div className="grid grid-cols-1 gap-5">
                    {currentWorkout.exercises.map((ex: any, idx: number) => (
                        <div key={ex.id} className="p-8 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all group">
                            <div className="flex-1 w-full text-center sm:text-left"><div className="flex items-center justify-center sm:justify-start gap-3 mb-3"><span className="text-indigo-600 font-black text-lg">#{idx + 1}</span><h4 className="font-black text-xl text-slate-900">{ex.name}</h4></div>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                    {ex.sets && <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">Séries</span><span className="font-black text-slate-900">{ex.sets}</span></div>}
                                    {ex.reps && <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2"><span className="text-[10px] font-black text-slate-400 uppercase">Reps</span><span className="font-black text-slate-900">{ex.reps}</span></div>}
                                    {ex.load && <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white flex items-center gap-2"><span className="text-[10px] font-black opacity-60 uppercase">Carga</span><span className="font-black">{ex.load}</span></div>}
                                    {ex.distance && <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white flex items-center gap-2"><span className="text-[10px] font-black opacity-60 uppercase">Km</span><span className="font-black">{ex.distance}</span></div>}
                                </div>
                            </div>
                            <button className="w-16 h-16 rounded-[1.5rem] bg-white border-2 border-slate-100 text-slate-200 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm active:scale-90 group-hover:shadow-md"><CheckCircle className="w-8 h-8" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DietView = ({ diet }: any) => {
    if (!diet) return <Inativo msg="Nutrição em análise." />;
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MacroCard label="Calorias" value={diet.macros.calories} unit="kcal" color="indigo" />
                <MacroCard label="Proteínas" value={diet.macros.protein} unit="g" color="rose" />
                <MacroCard label="Carbos" value={diet.macros.carbs} unit="g" color="amber" />
                <MacroCard label="Gorduras" value={diet.macros.fats} unit="g" color="emerald" />
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Utensils className="w-6 h-6" /></div>
                    <div><h3 className="text-3xl font-black text-slate-900">Seu Plano</h3><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Recomendação personalizada</p></div>
                </div>
                <div className="text-slate-700 leading-relaxed font-medium text-lg bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 whitespace-pre-wrap italic shadow-inner">"{diet.content}"</div>
            </div>
        </div>
    );
};

const ProgressView = ({ progress, user, onUpdate }: any) => {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div><h2 className="text-4xl font-black text-slate-900 tracking-tight">Evolução</h2><p className="text-slate-500 font-medium">Histórico visual do seu progresso.</p></div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all"><Camera className="w-5 h-5 text-indigo-400" /> Registrar Hoje</button>
            </div>
            {progress.length === 0 ? <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100"><Camera className="w-16 h-16 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-black">Você ainda não tem fotos. Vamos começar?</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{progress.map((log: any) => (<div key={log.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group"><div className="aspect-square bg-slate-100 relative overflow-hidden">{log.photoUrl ? <img src={log.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-16 h-16" /></div>}</div><div className="p-8 flex justify-between items-center bg-white relative z-10 shadow-[0_-20px_40px_rgba(255,255,255,1)]"><div><p className="font-black text-2xl text-slate-900 tracking-tight">{log.weight} kg</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</p></div><div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><Activity className="w-6 h-6" /></div></div></div>))}</div>}
        </div>
    );
};

const SpiritualView = ({ user, profile, posts, leaderboard, totalChapters }: any) => {
    const [newPost, setNewPost] = useState('');
    const [chaptersInput, setChaptersInput] = useState(1);
    const readChapters = profile.readingStats?.totalChaptersRead || 0;
    const progressPercent = Math.min(100, (readChapters / totalChapters) * 100);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity"><Layers className="w-48 h-48 text-slate-900" /></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Caminho ao Ápice</h3>
                                <p className="text-slate-400 font-medium italic mt-1">Meta de leitura: 1.189 capítulos.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-5xl font-black text-indigo-600 leading-none">{readChapters}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Caps Lidos</p>
                            </div>
                        </div>
                        <div className="w-full h-8 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1.5 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-600 to-indigo-700 rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-4 px-1">
                            <span className="text-[10px] font-black text-slate-300 uppercase">Início</span>
                            <div className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /><span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">{progressPercent.toFixed(1)}% Concluído</span></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase">Ápice</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-emerald-500" /> Registro de Estudo</h3>
                    <div className="flex flex-col md:flex-row items-center gap-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex-1 w-full space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Volume de leitura desta sessão:</label>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setChaptersInput(Math.max(1, chaptersInput - 1))} className="w-14 h-14 bg-white rounded-2xl border border-slate-200 shadow-sm font-black text-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90">-</button>
                                <input type="number" className="flex-1 text-center bg-white border-2 border-indigo-100 rounded-[1.5rem] py-4 font-black text-3xl text-indigo-600 outline-none shadow-sm" value={chaptersInput} onChange={e => setChaptersInput(parseInt(e.target.value) || 1)} />
                                <button onClick={() => setChaptersInput(chaptersInput + 1)} className="w-14 h-14 bg-white rounded-2xl border border-slate-200 shadow-sm font-black text-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90">+</button>
                            </div>
                        </div>
                        <button onClick={() => { db.checkInReading(user.id, chaptersInput); alert(`${chaptersInput} capítulos adicionados ao seu Ápice!`); }} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-6 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"><Flame className="w-6 h-6 text-amber-400" /> Marcar Lidos</button>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><Sparkles className="w-6 h-6 text-amber-500" /> Rhema do Dia (Reflexão)</h3>
                    <div className="relative"><textarea className="w-full p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white min-h-[180px] outline-none transition-all font-medium text-lg italic shadow-inner" placeholder="O que o Senhor falou ao seu coração hoje?" value={newPost} onChange={e => setNewPost(e.target.value)} /><button onClick={() => { if(newPost) { db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, userName: user.name, content: newPost, timestamp: new Date().toISOString(), likes: 0, comments: [] }); setNewPost(''); } }} className="absolute bottom-6 right-6 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-xl font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"><Send className="w-5 h-5" /> Enviar</button></div>
                </div>
                
                <div className="space-y-6">
                    {posts.map((post: any) => (
                        <div key={post.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-black text-indigo-500 text-xs shadow-sm">{post.userName?.charAt(0) || '?'}</div>
                                <div><p className="font-black text-slate-900 text-sm">{post.userName || 'Leitor Treyo'}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</p></div>
                            </div>
                            <p className="text-slate-600 leading-relaxed font-medium text-lg italic bg-slate-50/50 p-6 rounded-2xl border-l-4 border-amber-400">"{post.content}"</p>
                        </div>
                    ))}
                    {posts.length === 0 && <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold">Nenhum Rhema compartilhado ainda.</div>}
                </div>
            </div>

            <div className="space-y-8 h-fit">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" /> Ranking do Ápice</h3>
                    <div className="space-y-6">
                        {leaderboard.slice(0, 8).map((p: any, idx: number) => (
                            <div key={p.userId} className={`flex items-center gap-4 group p-4 rounded-2xl transition-all ${p.userId === user.id ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-slate-50'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm transition-all ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-400' : idx === 2 ? 'bg-orange-50 text-orange-400' : 'bg-slate-50 text-slate-300'}`}>{idx + 1}º</div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-black text-slate-900 truncate text-sm">Usuário Treyo</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{p.readingStats?.totalChaptersRead || 0} caps</p>
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.readingStats?.streak || 0} dias</p>
                                    </div>
                                </div>
                                {idx === 0 && <Star className="w-5 h-5 text-amber-500 fill-current" />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Info className="w-24 h-24" /></div>
                    <div className="relative z-10">
                        <h4 className="font-black mb-4 flex items-center gap-2 text-indigo-400"><Info className="w-5 h-5" /> Regras do Ápice</h4>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">O ranking prioriza o **Volume Total** (meta de 1.189 capítulos). Em caso de empate, a sua **Ofensiva Diária** (streak) serve como critério de desempate!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChatView = ({ messages, user, trainer, onMessageSent }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="bg-white h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-fade-in relative z-10">
            <div className="p-8 border-b border-slate-50 flex items-center gap-4 bg-white/80 backdrop-blur-md"><div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg border border-slate-800">{trainer?.name.charAt(0) || 'P'}</div><div><h3 className="font-black text-slate-900 text-xl tracking-tight">{trainer?.name || 'Suporte Treyo'}</h3><div className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span><span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Sincronizado</span></div></div></div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/20">{messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 italic"><MessageCircle className="w-12 h-12 opacity-20" /><p className="text-sm font-medium">Envie uma mensagem para o seu Personal.</p></div>}
                {messages.map((m: any) => (<div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] sm:max-w-[70%] p-6 rounded-3xl shadow-sm font-medium leading-relaxed ${m.senderId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}><p className="text-sm sm:text-base">{m.content}</p></div></div>))}
            </div>
            <div className="p-8 bg-white border-t border-slate-50"><div className="relative"><input className="w-full pl-8 pr-24 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none shadow-inner focus:bg-white focus:border-indigo-500 font-bold transition-all" placeholder="Escreva aqui..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && input && (db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} /><button onClick={() => input && (db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} className="absolute right-3 top-3 bg-indigo-600 text-white p-4 rounded-2xl shadow-xl hover:bg-indigo-700 active:scale-90 transition-all"><Send className="w-6 h-6" /></button></div></div>
        </div>
    );
};

const CommunityView = ({ posts, user, onUpdate }: { posts: CommunityPost[], user: User, onUpdate: () => void }) => {
    const [msgInput, setMsgInput] = useState('');
    
    useEffect(() => {
        const int = setInterval(onUpdate, 5000);
        return () => clearInterval(int);
    }, []);

    const handleSend = () => {
        if (!msgInput) return;
        db.addCommunityPost({
            id: Date.now().toString(),
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatarUrl,
            content: msgInput,
            timestamp: new Date().toISOString()
        });
        setMsgInput('');
        onUpdate();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] animate-fade-in pb-10">
            <div className="mb-6 flex justify-between items-end"><div className="space-y-1"><h2 className="text-4xl font-black text-slate-900 tracking-tight">Comunidade</h2><p className="text-slate-500 font-medium">Chat global interno para troca de ideias.</p></div><div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4" /> Ativa</div></div>
            <div className="flex-1 overflow-y-auto space-y-4 mb-8 px-2 custom-scrollbar flex flex-col pt-4">
                {posts.map((post) => (
                    <div key={post.id} className={`flex ${post.userId === user.id ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`flex gap-3 max-w-[85%] ${post.userId === user.id ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 shadow-sm flex-shrink-0 flex items-center justify-center font-black text-[10px] text-slate-400 overflow-hidden">
                                {post.userAvatar ? <img src={post.userAvatar} className="w-full h-full object-cover" /> : post.userName.charAt(0)}
                            </div>
                            <div className={`p-5 rounded-3xl shadow-sm ${post.userId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                                <p className="text-[10px] font-black opacity-40 mb-1 uppercase tracking-widest">{post.userName}</p>
                                <p className="font-medium text-sm leading-relaxed">{post.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4"><MessageSquare className="w-16 h-16 opacity-10" /><p className="font-medium italic">Silêncio na sala. Comece uma conversa!</p></div>}
            </div>
            <div className="bg-white p-4 rounded-[2.5rem] border-2 border-slate-50 shadow-2xl flex gap-4 ring-8 ring-slate-100/50"><input className="flex-1 bg-slate-50 border-2 border-transparent rounded-[1.5rem] px-8 py-5 outline-none font-bold focus:border-indigo-500 focus:bg-white transition-all shadow-inner text-sm" placeholder="O que você quer compartilhar com a rede?" value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} /><button onClick={handleSend} className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl hover:bg-slate-800 active:scale-90 transition-all"><Send className="w-7 h-7" /></button></div>
        </div>
    );
};

// --- Helpers ---
const MacroCard = ({ label, value, unit, color }: any) => (<div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-indigo-100 transition-all"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 ml-1">{label}</p><div className="flex items-baseline gap-1.5"><p className={`text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors`}>{value}</p><p className="text-xs font-black text-slate-300 uppercase">{unit}</p></div><div className={`h-1.5 w-14 mt-6 rounded-full bg-${color}-500/10 overflow-hidden shadow-inner`}><div className={`h-full bg-${color}-500 w-1/2`}></div></div></div>);
const DashboardSkeleton = () => (<div className="space-y-10 animate-pulse"><div className="h-64 bg-slate-100 rounded-[3rem]"></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="h-36 bg-slate-100 rounded-3xl"></div><div className="h-36 bg-slate-100 rounded-3xl"></div><div className="h-36 bg-slate-100 rounded-3xl"></div><div className="h-36 bg-slate-100 rounded-3xl"></div></div></div>);
const Inativo = ({ msg }: any) => (<div className="min-h-[65vh] flex flex-col items-center justify-center p-10 text-center"><div className="w-28 h-28 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-slate-100 animate-pulse"><ShieldCheck className="w-14 h-14 text-slate-200" /></div><h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{msg}</h3><p className="text-slate-400 max-w-xs mx-auto font-medium leading-relaxed">Este módulo requer sincronização com o seu Personal Trainer.</p></div>);
