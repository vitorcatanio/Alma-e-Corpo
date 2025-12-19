
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment, BookReview, WishlistBook, LibraryComment } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Droplets, Flame, Timer, Footprints, Send, Play, MapPin, StopCircle, 
    Pause, Heart, MessageCircle, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, Target, ChevronRight, Hash, Clock, History, Star, ThumbsUp,
    ShieldCheck, Bell, Info, Users, Flame as BurnIcon, XCircle, Bike, Library, 
    BookMarked, BookmarkPlus, MessageSquare, Trash2
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
                setWorkouts(db.getWorkouts(user.id));
                setDiet(db.getDiet(user.id));
                setProgress(db.getProgress(user.id));
                setActivityLogs(db.getActivity(user.id));
                
                if (foundTrainer) setMessages(db.getMessages(user.id, foundTrainer.id));
                setSpiritualPosts(db.getSpiritualPosts());
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

    switch (activeTab) {
        case 'dashboard':
            return (
                <div className="space-y-8 animate-fade-in pb-20">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-2">Olá, {user.name.split(' ')[0]}</h2>
                            <p className="text-slate-400 font-medium">Seu ecossistema de evolução Corpo & Alma.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card label="Peso Atual" value={`${profile.weight} kg`} icon={Scale} color="bg-indigo-500" />
                        <Card label="Calorias Ativas" value={`${Math.round(totalCaloriesToday)} kcal`} icon={BurnIcon} color="bg-rose-500" />
                        <Card label="Dias Lidos" value={`${profile.readingStats?.daysCompleted || 0} dias`} icon={BookOpen} color="bg-amber-500" />
                        <Card label="Livros Lidos" value={`${profile.onboardingChoices.extraReadingProgress || 0} / ${profile.onboardingChoices.extraReadingGoal || 0}`} icon={Target} color="bg-emerald-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            {workouts.length > 0 && (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><Dumbbell className="w-5 h-5 text-indigo-600"/> Treinos Prescritos</h3>
                                    <div className="space-y-4">
                                        {workouts.slice(0, 2).map(w => (
                                            <div key={w.id} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-indigo-600 hover:text-white transition-all shadow-sm" onClick={() => onTabChange('workouts')}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white shadow-sm transition-all">
                                                        {w.sportType === SportType.GYM ? <Dumbbell className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg">{w.title}</p>
                                                        <p className="text-xs opacity-60 font-bold uppercase tracking-widest">{w.sportType} • {w.split}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><CalendarIcon className="w-5 h-5 text-indigo-600"/> Agenda e Eventos</h3>
                                <div className="space-y-4">
                                    {events.length === 0 ? <p className="text-slate-400 text-sm italic text-center py-6 font-medium">Nenhum evento agendado para você.</p> : events.slice(0, 3).map(e => {
                                        const isConfirmed = e.attendees?.includes(user.id);
                                        return (
                                            <div key={e.id} className={`flex items-center gap-4 p-4 rounded-3xl border-2 transition-all ${isConfirmed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent shadow-sm'}`}>
                                                <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-100 shadow-sm text-slate-900"><span className="text-[10px] font-black uppercase text-indigo-600">{new Date(e.date).toLocaleString('pt-BR', { month: 'short' })}</span><span className="text-lg font-black">{new Date(e.date).getDate()}</span></div>
                                                <div className="flex-1"><p className="font-bold text-slate-900 text-sm">{e.title}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{e.time}</p></div>
                                                <button onClick={() => db.rsvpToEvent(e.id, user.id, !isConfirmed)} className={`p-3 rounded-xl transition-all ${isConfirmed ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-slate-300 border border-slate-100 hover:text-indigo-400 shadow-sm'}`}>{isConfirmed ? <CheckCircle className="w-5 h-5" /> : <Star className="w-5 h-5" />}</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100 shadow-sm">
                                <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-amber-900"><BookOpen className="w-6 h-6 text-amber-600"/> Check-in Espiritual</h3>
                                <div className="bg-white p-8 rounded-3xl shadow-sm space-y-4">
                                    <div className="flex justify-between items-center mb-2"><span className="text-xs font-black text-slate-400 uppercase tracking-widest">Leitura Diária</span><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black">{profile.readingStats?.streak || 0} DIAS 🔥</span></div>
                                    <button onClick={() => db.checkInReading(user.id)} className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-3"><CheckCircle className="w-6 h-6" /> Marcar Lida Hoje</button>
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
        case 'spiritual': return <SpiritualView user={user} posts={spiritualPosts} leaderboard={leaderboard} />;
        case 'messages': return <ChatView messages={messages} user={user} trainer={trainer} onMessageSent={() => setMessages(db.getMessages(user.id, trainer?.id || ''))} />;
        case 'community': return <CommunityView posts={spiritualPosts} user={user} />;
        default: return <Inativo msg="Módulo em desenvolvimento." />;
    }
};

// --- Library Module Components ---
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
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Minha Biblioteca</h2>
                    <p className="text-slate-500 font-medium italic">O conhecimento é a musculação da mente.</p>
                </div>
                <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100">
                    <TabBtn active={view === 'shelf'} onClick={() => setView('shelf')} label="Minha Estante" icon={Library} />
                    <TabBtn active={view === 'community'} onClick={() => setView('community')} label="Explorar" icon={Users} />
                    <TabBtn active={view === 'wishlist'} onClick={() => setView('wishlist')} label="Desejos" icon={BookMarked} />
                </div>
            </div>

            {view === 'shelf' && (
                <div className="space-y-8">
                    <button onClick={() => setShowAddModal(true)} className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:scale-[1.01] transition-all">
                        <Plus className="w-7 h-7" /> Registrar Novo Livro Lido
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.filter(r => r.userId === user.id).map(r => (
                            <BookCard key={r.id} review={r} isOwn />
                        ))}
                    </div>
                </div>
            )}

            {view === 'community' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {reviews.map(r => (
                        <CommunityReviewCard key={r.id} review={r} onAddToWishlist={() => addToWishlistFromReview(r)} onComment={(c) => addComment(r.id, c)} currentUserId={user.id} />
                    ))}
                </div>
            )}

            {view === 'wishlist' && (
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><BookMarked className="w-8 h-8" /></div>
                        <h3 className="text-3xl font-black text-slate-900">Plano de Próximas Leituras</h3>
                    </div>
                    {wishlist.length === 0 ? (
                        <div className="text-center py-20 text-slate-300 font-bold italic">Sua lista de desejos está vazia. Explore as resenhas da comunidade!</div>
                    ) : (
                        <div className="space-y-4">
                            {wishlist.map(w => (
                                <div key={w.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-transparent hover:border-indigo-100 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-16 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-200">📖</div>
                                        <div>
                                            <p className="font-black text-lg text-slate-900">{w.title}</p>
                                            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{w.author}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Meta de Leitura</p>
                                            <p className="font-bold text-indigo-600">{new Date(w.targetDate).toLocaleDateString()}</p>
                                        </div>
                                        <button onClick={() => db.removeFromWishlist(w.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Cadastro */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-8">
                        <h2 className="text-3xl font-black text-slate-900 text-center">Registrar Leitura</h2>
                        <div className="space-y-4">
                            <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="Título do Livro" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                            <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="Autor" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl">
                                <span className="text-xs font-black uppercase text-slate-400">Avaliação:</span>
                                {[1,2,3,4,5].map(star => (
                                    <button key={star} onClick={() => setNewBook({...newBook, rating: star})} className={`transition-all ${newBook.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}>
                                        <Star className={`w-8 h-8 ${newBook.rating >= star ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-medium h-40" placeholder="O que você achou desse livro? Escreva uma breve resenha..." value={newBook.review} onChange={e => setNewBook({...newBook, review: e.target.value})} />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 rounded-2xl bg-slate-50 text-slate-500 font-black">Cancelar</button>
                            <button onClick={handleSaveReview} className="flex-2 bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 px-10">Salvar Resenha</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TabBtn = ({ active, onClick, label, icon: Icon }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>
        <Icon className="w-4 h-4" /> {label}
    </button>
);

const BookCard = ({ review, isOwn }: { review: BookReview, isOwn?: boolean }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
        <div className={`h-40 bg-gradient-to-br ${isOwn ? 'from-indigo-500 to-indigo-700' : 'from-slate-700 to-slate-900'} p-8 flex flex-col justify-end relative`}>
            <Quote className="absolute top-6 right-6 w-10 h-10 text-white/10" />
            <h4 className="text-white font-black text-xl leading-tight line-clamp-2">{review.title}</h4>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">{review.author}</p>
        </div>
        <div className="p-8 space-y-4">
            <div className="flex text-amber-400 gap-1">
                {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
            </div>
            <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-4 italic">"{review.review}"</p>
            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(review.timestamp).toLocaleDateString()}</span>
                <div className="flex items-center gap-2 text-indigo-600">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-black">{review.comments?.length || 0}</span>
                </div>
            </div>
        </div>
    </div>
);

const CommunityReviewCard = ({ review, onAddToWishlist, onComment, currentUserId }: { review: BookReview, onAddToWishlist: () => void, onComment: (c: string) => void, currentUserId: string }) => {
    const [commentInput, setCommentInput] = useState('');
    const [showComments, setShowComments] = useState(false);

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
            <div className="p-8 flex gap-6">
                <div className="w-24 h-36 bg-slate-900 rounded-xl flex-shrink-0 shadow-lg flex flex-col justify-center items-center text-center p-4 text-white">
                    <Library className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[8px] font-black uppercase opacity-60 leading-tight">{review.title}</p>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs overflow-hidden">
                            {review.userAvatar ? <img src={review.userAvatar} className="w-full h-full object-cover" /> : review.userName.charAt(0)}
                        </div>
                        <p className="text-xs font-black text-slate-900">{review.userName}</p>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900">{review.title}</h4>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{review.author}</p>
                    <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                    </div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic">"{review.review}"</p>
                    
                    <div className="flex gap-4 pt-4">
                        <button onClick={onAddToWishlist} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all">
                            <BookmarkPlus className="w-4 h-4" /> Quero Ler
                        </button>
                        <button onClick={() => setShowComments(!showComments)} className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all">
                            <MessageSquare className="w-4 h-4" /> {review.comments?.length || 0} Comentários
                        </button>
                    </div>
                </div>
            </div>

            {showComments && (
                <div className="px-8 pb-8 space-y-6 animate-fade-in">
                    <div className="border-t border-slate-50 pt-6 space-y-4">
                        {review.comments?.map(c => (
                            <div key={c.id} className="flex gap-3 items-start bg-slate-50 p-4 rounded-2xl">
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-[8px] font-bold">{c.userName.charAt(0)}</div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-900">{c.userName}</p>
                                    <p className="text-xs text-slate-600 font-medium">{c.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="relative">
                        <input className="w-full pl-6 pr-16 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-indigo-500 font-bold text-sm" placeholder="O que achou dessa resenha?" value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (onComment(commentInput), setCommentInput(''))} />
                        <button onClick={() => { onComment(commentInput); setCommentInput(''); }} className="absolute right-2 top-2 p-3 bg-slate-900 text-white rounded-xl shadow-lg">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Standard UI Helpers ---
const Card = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6"><div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}><Icon className="w-7 h-7" /></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div></div>
);

const WorkoutView = ({ workouts, user, profile }: any) => {
    const [activeSplit, setActiveSplit] = useState(workouts[0]?.id || '');
    const currentWorkout = workouts.find((w: any) => w.id === activeSplit) || workouts[0];
    if (!currentWorkout) return <Inativo msg="Seu personal ainda não prescreveu treinos." />;
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex gap-3 overflow-x-auto pb-4 px-1">{workouts.map((w: any) => (<button key={w.id} onClick={() => setActiveSplit(w.id)} className={`px-8 py-4 rounded-2xl font-black whitespace-nowrap transition-all shadow-sm border-2 ${activeSplit === w.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100' : 'bg-white text-slate-500 border-slate-50 hover:border-indigo-100'}`}>Treino {w.split}</button>))}</div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-slate-50 pb-8">
                    <div><div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">{currentWorkout.sportType}</span><span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">Freq: {currentWorkout.split}</span></div><h2 className="text-4xl font-black text-slate-900">{currentWorkout.title}</h2></div>
                    <button onClick={() => alert('Treino finalizado com sucesso!')} className="w-full md:w-auto bg-green-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"><CheckCircle className="w-6 h-6" /> Finalizar Treino</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {currentWorkout.exercises.map((ex: any, idx: number) => (
                        <div key={ex.id} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between gap-6 group hover:border-indigo-200 transition-all shadow-sm">
                            <div className="flex-1"><div className="flex items-center gap-3 mb-2"><span className="text-indigo-600 font-black text-lg">#{idx + 1}</span><h4 className="font-black text-xl text-slate-900">{ex.name}</h4></div>
                                <div className="flex flex-wrap gap-4 mt-3">
                                    {ex.sets && <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase">Séries</span><span className="font-black text-slate-900">{ex.sets}</span></div>}
                                    {ex.reps && <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase">Reps</span><span className="font-black text-slate-900">{ex.reps}</span></div>}
                                    {ex.load && <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase">Carga</span><span className="font-black text-indigo-600">{ex.load}</span></div>}
                                    {ex.distance && <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase">Km</span><span className="font-black text-indigo-600">{ex.distance}</span></div>}
                                    {ex.pace && <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100"><span className="text-[10px] font-black text-slate-400 uppercase">Ritmo</span><span className="font-black text-indigo-600">{ex.pace}</span></div>}
                                </div>
                            </div>
                            <button className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-200 hover:text-green-500 flex items-center justify-center transition-all shadow-sm"><CheckCircle className="w-8 h-8" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DietView = ({ diet }: any) => {
    if (!diet) return <Inativo msg="Sua dieta está sendo preparada pelo personal." />;
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
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600"><Utensils className="w-6 h-6" /></div>
                    <div><h3 className="text-3xl font-black text-slate-900">Plano Alimentar</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Atualizado em {new Date(diet.updatedAt).toLocaleDateString()}</p></div>
                </div>
                <div className="text-slate-700 leading-relaxed font-medium text-lg bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner whitespace-pre-wrap">{diet.content}</div>
            </div>
        </div>
    );
};

const ProgressView = ({ progress, user, onUpdate }: any) => {
    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div><h2 className="text-3xl font-black text-slate-900">Timelapse</h2><p className="text-slate-500 font-medium">Sua evolução visual registrada.</p></div>
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all"><Plus className="w-5 h-5" /> Novo Registro</button>
            </div>
            {progress.length === 0 ? <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100"><Camera className="w-16 h-16 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-bold">Inicie sua jornada visual hoje!</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{progress.map((log: any) => (<div key={log.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 group"><div className="aspect-square bg-slate-100 relative overflow-hidden">{log.photoUrl ? <img src={log.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Camera className="w-16 h-16" /></div>}</div><div className="p-8 flex justify-between items-center"><div><p className="font-black text-2xl text-slate-900">{log.weight} kg</p><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{new Date(log.date).toLocaleDateString()}</p></div><div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><Activity className="w-5 h-5" /></div></div></div>))}</div>}
        </div>
    );
};

const SpiritualView = ({ user, posts, leaderboard }: any) => {
    const [newPost, setNewPost] = useState('');
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3"><Sparkles className="w-6 h-6 text-amber-500" /> Reflexão Diária</h3>
                    <div className="relative"><textarea className="w-full p-8 bg-slate-50 rounded-3xl border-2 border-slate-100 min-h-[160px] outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium" placeholder="Qual Rhema o Senhor te deu hoje?" value={newPost} onChange={e => setNewPost(e.target.value)} /><button onClick={() => { if(newPost) { db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, content: newPost, timestamp: new Date().toISOString(), likes: 0, comments: [] }); setNewPost(''); } }} className="absolute bottom-6 right-6 bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-xl font-black flex items-center gap-2 transition-all active:scale-95"><Send className="w-5 h-5" /> Enviar</button></div>
                </div>
                {posts.map((post: any) => (<div key={post.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="flex items-center gap-4 mb-4"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">?</div><div><p className="font-black text-slate-900">Reflexão</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</p></div></div><p className="text-slate-600 leading-relaxed font-medium text-lg italic">"{post.content}"</p></div>))}
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 h-fit">
                <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-500" /> Ranking Bíblico</h3>
                <div className="space-y-6">{leaderboard.slice(0, 5).map((p: any, idx: number) => (<div key={p.userId} className="flex items-center gap-4 group"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-all ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50'}`}>{idx + 1}º</div><div className="flex-1"><p className="font-bold text-slate-900 truncate">Usuário Treyo</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.readingStats?.daysCompleted || 0} dias lidos</p></div></div>))}</div>
            </div>
        </div>
    );
};

const ChatView = ({ messages, user, trainer, onMessageSent }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="bg-white h-[calc(100vh-200px)] rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
            <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50"><div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg">{trainer?.name.charAt(0) || 'P'}</div><div><h3 className="font-black text-slate-900 text-xl">{trainer?.name || 'Personal Treyo'}</h3><div className="flex items-center gap-2"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Online para você</span></div></div></div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">{messages.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 italic"><MessageCircle className="w-12 h-12" /><p>Inicie sua conversa com o Personal.</p></div>}
                {messages.map((m: any) => (<div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] p-6 rounded-[2rem] shadow-sm font-medium leading-relaxed ${m.senderId === user.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}><p>{m.content}</p></div></div>))}
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100"><div className="relative"><input className="w-full pl-8 pr-24 py-5 bg-white border-2 border-slate-100 rounded-[2rem] outline-none shadow-sm focus:border-indigo-500 font-bold" placeholder="Digite sua mensagem..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && input && (db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} /><button onClick={() => input && (db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }), setInput(''), onMessageSent())} className="absolute right-3 top-3 bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:scale-105 transition-all"><Send className="w-6 h-6" /></button></div></div>
        </div>
    );
};

const CommunityView = ({ posts, user }: any) => {
    const [msgInput, setMsgInput] = useState('');
    return (
        <div className="flex flex-col h-[calc(100vh-200px)] animate-fade-in pb-10">
            <div className="mb-6"><h2 className="text-3xl font-black text-slate-900">Comunidade</h2><p className="text-slate-500 font-medium">Conecte-se com outros alunos Treyo.</p></div>
            <div className="flex-1 overflow-y-auto space-y-6 mb-8 px-2">{posts.map((post: any) => (<div key={post.id} className={`flex ${post.userId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 ${post.userId === user.id ? 'bg-white shadow-slate-100' : 'bg-indigo-50/50 border-indigo-100 shadow-indigo-50'}`}><p className="text-slate-700 font-medium text-lg leading-relaxed italic">"{post.content}"</p></div></div>))}</div>
            <div className="bg-white p-4 rounded-[2.5rem] border-2 border-slate-50 shadow-2xl flex gap-4"><input className="flex-1 bg-slate-50 border-2 border-transparent rounded-2xl px-8 py-5 outline-none font-bold focus:border-indigo-500 transition-all" placeholder="Inspirar a comunidade..." value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && msgInput && (db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, content: msgInput, timestamp: new Date().toISOString(), likes: 0, comments: [] }), setMsgInput(''))} /><button onClick={() => msgInput && (db.addSpiritualPost({ id: Date.now().toString(), userId: user.id, content: msgInput, timestamp: new Date().toISOString(), likes: 0, comments: [] }), setMsgInput(''))} className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl transition-all"><Send className="w-7 h-7" /></button></div>
        </div>
    );
};

// --- Helpers ---
const MacroCard = ({ label, value, unit, color }: any) => (<div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-1">{label}</p><div className="flex items-baseline gap-1"><p className={`text-3xl font-black text-slate-900`}>{value}</p><p className="text-xs font-bold text-slate-300">{unit}</p></div><div className={`h-1 w-12 mt-4 rounded-full bg-${color}-500 opacity-20`}></div></div>);
const DashboardSkeleton = () => (<div className="space-y-8 animate-pulse"><div className="h-56 bg-slate-200 rounded-[3rem]"></div><div className="grid grid-cols-1 md:grid-cols-4 gap-6"><div className="h-32 bg-slate-200 rounded-3xl"></div><div className="h-32 bg-slate-200 rounded-3xl"></div><div className="h-32 bg-slate-200 rounded-3xl"></div><div className="h-32 bg-slate-200 rounded-3xl"></div></div></div>);
const Inativo = ({ msg }: any) => (<div className="min-h-[60vh] flex flex-col items-center justify-center p-10 text-center"><div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner"><ShieldCheck className="w-12 h-12 text-slate-300" /></div><h3 className="text-3xl font-black text-slate-900 mb-3">{msg}</h3><p className="text-slate-400 max-w-sm mx-auto font-medium">Sincronize seus objetivos para liberar este módulo.</p></div>);
