
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment, BookReview, WishlistBook, LibraryComment, CommunityPost } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Flame, Timer, Send, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, ChevronRight, Layers, X, Save, Loader2, ArrowLeft,
    MessageSquare, Trash2, BookmarkPlus, BookMarked, Users, History, Info,
    Star, Search, Heart, Share2, Sunrise, Sun, Coffee, Soup, Moon, Filter, SortAsc, BookPlus, Edit2
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
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); 
        return () => clearInterval(interval);
    }, [user.id, activeTab]);

    if (loading && !profile) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!profile) return null;

    const BackButton = () => (
        <button onClick={() => onTabChange('dashboard')} className="flex items-center gap-2 text-slate-400 font-bold mb-6 hover:text-slate-900 transition-colors group">
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ArrowLeft className="w-4 h-4"/>
            </div>
            Voltar ao Início
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
                        <Sparkles className="absolute right-10 top-10 w-24 h-24 text-white/5" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card label="Peso" value={`${profile.weight} kg`} icon={Scale} color="bg-indigo-500" />
                        <Card label="Evoluções" value={progress.length} icon={Activity} color="bg-emerald-500" />
                        <Card label="Ofensiva" value={`${profile.readingStats?.streak || 0} dias`} icon={Flame} color="bg-rose-500" />
                        <Card label="Nível" value={profile.level} icon={Trophy} color="bg-amber-500" />
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-slate-900"><Layers className="w-5 h-5 text-indigo-600"/> Atalhos de Ação</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <QuickActionBtn icon={Camera} label="Registrar Evolução" onClick={() => onTabChange('progress')} color="text-emerald-600" />
                            <QuickActionBtn icon={Dumbbell} label="Ver Treino de Hoje" onClick={() => onTabChange('workouts')} color="text-indigo-600" />
                            <QuickActionBtn icon={BookOpen} label="Minha Leitura" onClick={() => onTabChange('spiritual')} color="text-amber-600" />
                            <QuickActionBtn icon={MessageSquare} label="Falar com Trainer" onClick={() => onTabChange('messages')} color="text-rose-600" />
                        </div>
                    </div>
                </div>
            );

        case 'workouts': 
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <BackButton />
                    <WorkoutView workouts={workouts} user={user} />
                </div>
            );

        case 'diet':
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <BackButton />
                    <DietView diet={diet} />
                </div>
            );

        case 'progress':
            return <ProgressView progress={progress} user={user} onUpdate={loadData} onBack={() => onTabChange('dashboard')} />;

        case 'library':
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <BackButton />
                    <LibraryView user={user} profile={profile} onUpdate={loadData} />
                </div>
            );

        case 'spiritual':
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <BackButton />
                    <SpiritualView user={user} profile={profile} posts={spiritualPosts} leaderboard={leaderboard} onUpdate={loadData} />
                </div>
            );

        case 'messages':
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <BackButton />
                    <ChatView user={user} trainer={trainer} onMessageSent={loadData} />
                </div>
            );

        case 'community':
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <BackButton />
                    <CommunityView posts={communityPosts} user={user} onUpdate={loadData} />
                </div>
            );
            
        default:
            return (
                <div className="p-10 text-center animate-fade-in">
                    <BackButton />
                    <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold italic">Módulo em construção.</p>
                    </div>
                </div>
            );
    }
};

// --- SUB-VIEWS DETALHADAS ---

const WorkoutView = ({ workouts, user }: any) => {
    const [activeSplit, setActiveSplit] = useState(workouts[0]?.id || '');
    const currentWorkout = workouts.find((w: any) => w.id === activeSplit) || workouts[0];
    if (!currentWorkout) return <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100"><Dumbbell className="w-16 h-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-bold">Sem treinos prescritos.</p></div>;
    return (
        <div className="space-y-6">
            <h2 className="text-4xl font-black text-slate-900 mb-8">Meus Treinos</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {workouts.map((w: any) => (
                    <button key={w.id} onClick={() => setActiveSplit(w.id)} className={`px-8 py-4 rounded-2xl font-black border-2 ${activeSplit === w.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white text-slate-400 border-slate-50'}`}>{w.split || 'Treino'}</button>
                ))}
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                <h3 className="text-3xl font-black text-slate-900 mb-10">{currentWorkout.title}</h3>
                <div className="space-y-4">
                    {currentWorkout.exercises.map((ex: any, idx: number) => (
                        <div key={ex.id} className="p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between group">
                            <div className="flex items-center gap-6"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300">{idx + 1}</div><div><p className="font-black text-lg text-slate-900">{ex.name}</p><p className="text-xs text-slate-400 font-black uppercase">{ex.sets} séries • {ex.reps || ex.distance} • {ex.load || ex.pace}</p></div></div>
                            <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 hover:text-emerald-500 transition-all"><CheckCircle className="w-6 h-6" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DietView = ({ diet }: any) => {
    if (!diet) return <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100"><Utensils className="w-16 h-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-bold">Plano alimentar em preparo.</p></div>;
    
    const mealList = [
        { id: 'breakfast', label: 'Café da Manhã', icon: Sunrise, color: 'text-amber-500' },
        { id: 'lunch', label: 'Almoço', icon: Sun, color: 'text-indigo-500' },
        { id: 'snack', label: 'Café da Tarde', icon: Coffee, color: 'text-orange-500' },
        { id: 'dinner', label: 'Jantar', icon: Soup, color: 'text-rose-500' },
        { id: 'supper', label: 'Ceia', icon: Moon, color: 'text-slate-900' }
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            <h2 className="text-4xl font-black text-slate-900">Alimentação</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MacroCard label="Calorias" value={diet.macros.calories} unit="kcal" color="bg-indigo-500" />
                <MacroCard label="Proteínas" value={diet.macros.protein} unit="g" color="bg-rose-500" />
                <MacroCard label="Carbos" value={diet.macros.carbs} unit="g" color="bg-amber-500" />
                <MacroCard label="Gorduras" value={diet.macros.fats} unit="g" color="bg-emerald-500" />
            </div>

            <div className="space-y-6">
                {mealList.map(m => {
                    const content = diet.meals?.[m.id as keyof typeof diet.meals];
                    if (!content) return null;
                    return (
                        <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 md:w-56 shrink-0">
                                <div className={`p-4 rounded-2xl bg-slate-50 ${m.color}`}>
                                    <m.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg leading-tight">{m.label}</h4>
                                    <p className="text-[10px] font-black uppercase text-slate-300">Prescrito</p>
                                </div>
                            </div>
                            <div className="flex-1 bg-slate-50/50 p-6 rounded-3xl border border-slate-50">
                                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{content}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {diet.guidelines && (
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl">
                    <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                        <Info className="text-emerald-400" /> Recomendações do Trainer
                    </h3>
                    <p className="text-slate-300 leading-relaxed font-medium">{diet.guidelines}</p>
                </div>
            )}
        </div>
    );
};

const LibraryView = ({ user, profile, onUpdate }: any) => {
    const [view, setView] = useState<'shelf' | 'community' | 'add'>('shelf');
    const [sortBy, setSortBy] = useState<'title' | 'author' | 'category'>('title');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    
    const categories = ['Espiritualidade', 'Desenvolvimento Pessoal', 'Saúde & Fitness', 'Biografia', 'Ficção', 'Negócios', 'Outros'];

    const [newBook, setNewBook] = useState({ 
        id: '',
        title: '', 
        author: '', 
        review: '', 
        category: categories[0],
        rating: 5 
    });

    const reviews = db.getBookReviews();

    const filteredReviews = reviews
        .filter(r => view === 'shelf' ? r.userId === user.id : true)
        .filter(r => {
            if (filterCategory === 'all') return true;
            const cat = r.category || 'Outros';
            return cat === filterCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'author') return (a.author || '').localeCompare(b.author || '');
            if (sortBy === 'category') return (a.category || 'Outros').localeCompare(b.category || 'Outros');
            return 0;
        });

    const handleSaveReview = () => {
        if (!newBook.title || !newBook.review) return alert('Título e resenha são obrigatórios.');
        db.saveBookReview({
            id: newBook.id || Date.now().toString(),
            userId: user.id,
            userName: user.name,
            title: newBook.title,
            author: newBook.author,
            category: newBook.category || 'Outros',
            review: newBook.review,
            rating: newBook.rating,
            timestamp: new Date().toISOString(),
            comments: []
        });
        setNewBook({ id: '', title: '', author: '', review: '', category: categories[0], rating: 5 });
        setView('shelf');
        onUpdate();
    };

    const handleEditBook = (book: BookReview) => {
        setNewBook({
            id: book.id,
            title: book.title,
            author: book.author || '',
            review: book.review,
            category: book.category || 'Outros',
            rating: book.rating || 5
        });
        setView('add');
    };

    const handleAddToShelf = (book: BookReview) => {
        db.saveBookReview({
            ...book,
            id: `clone-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
            comments: []
        });
        alert('Livro adicionado à sua estante!');
        onUpdate();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-4xl font-black text-slate-900">Biblioteca</h2>
                <button onClick={() => { setNewBook({ id: '', title: '', author: '', review: '', category: categories[0], rating: 5 }); setView('add'); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
                    <Plus className="w-5 h-5" /> Novo Livro
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
                    <button onClick={() => setView('shelf')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all ${view === 'shelf' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Minha Estante</button>
                    <button onClick={() => setView('community')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all ${view === 'community' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Comunidade</button>
                </div>

                <div className="flex gap-3">
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select className="bg-transparent text-xs font-black outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="all">Todas Categorias</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <SortAsc className="w-4 h-4 text-slate-400" />
                        <select className="bg-transparent text-xs font-black outline-none" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                            <option value="title">Título</option>
                            <option value="author">Autor</option>
                            <option value="category">Categoria</option>
                        </select>
                    </div>
                </div>
            </div>

            {view === 'add' ? (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 animate-slide-up">
                    <div className="flex justify-between items-center"><h3 className="text-2xl font-black">{newBook.id ? 'Editar Livro' : 'Adicionar à Estante'}</h3><button onClick={() => setView('shelf')}><X /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <input placeholder="Título do Livro" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                            <input placeholder="Autor" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                            <select className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <textarea placeholder="Sua resenha ou notas sobre o livro..." className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-medium h-full min-h-[150px]" value={newBook.review} onChange={e => setNewBook({...newBook, review: e.target.value})} />
                    </div>
                    <button onClick={handleSaveReview} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">
                        {newBook.id ? 'Salvar Alterações' : 'Publicar na Minha Estante'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredReviews.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <p className="text-slate-400 font-bold italic">Nenhum livro encontrado nesta seção.</p>
                        </div>
                    ) : filteredReviews.map(r => (
                        <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group relative">
                            <div className="mb-4 flex justify-between items-start">
                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">{r.category || 'Outros'}</span>
                                <div className="flex text-amber-400">{Array(r.rating || 5).fill(0).map((_, i) => <Star key={i} className="w-3 h-3 fill-current"/>)}</div>
                            </div>
                            <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{r.title}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-4">{r.author || 'Autor desconhecido'}</p>
                            <p className="text-slate-600 text-sm italic line-clamp-4 flex-1">"{r.review}"</p>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600">{r.userName.charAt(0)}</div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{r.userName}</span>
                                </div>
                                <div className="flex gap-2">
                                    {r.userId === user.id && (
                                        <button onClick={() => handleEditBook(r)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Editar este livro">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {view === 'community' && r.userId !== user.id && (
                                        <button onClick={() => handleAddToShelf(r)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Adicionar à minha estante">
                                            <BookPlus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SpiritualView = ({ profile, leaderboard, posts, user, onUpdate }: any) => {
    const totalChapters = 1189;
    const progressPercent = Math.min(100, ((profile.readingStats?.totalChaptersRead || 0) / totalChapters) * 100);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-slate-900 p-12 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                    <h2 className="text-3xl font-black mb-6">Meu Ápice Bíblico</h2>
                    <div className="w-full h-4 bg-white/10 rounded-full mb-4"><div className="h-full bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24]" style={{ width: `${progressPercent}%` }}></div></div>
                    <div className="flex justify-between items-center"><p className="font-black text-amber-400">{profile.readingStats?.totalChaptersRead || 0} / {totalChapters} cap.</p><button onClick={() => { db.checkInReading(user.id, 1); onUpdate(); }} className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black hover:scale-105 transition-all">Marcar como Lido</button></div>
                    <BookOpen className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 rotate-12" />
                </div>
            </div>
        </div>
    );
};

const ChatView = ({ user, trainer, onMessageSent }: any) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    useEffect(() => { if (trainer) { setMessages(db.getMessages(user.id, trainer.id)); } }, [trainer, user.id]);
    return (
        <div className="bg-white h-[70vh] rounded-[3rem] border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <div className="p-8 border-b font-black flex items-center gap-3"><div className="w-10 h-10 bg-slate-900 rounded-xl text-white flex items-center justify-center">{trainer?.name?.charAt(0) || 'P'}</div> {trainer?.name || 'Personal'}</div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
                {messages.map(m => <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-6 rounded-[2rem] text-sm ${m.senderId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>{m.content}</div></div>)}
            </div>
            <div className="p-8 flex gap-4"><input className="flex-1 bg-slate-50 p-5 rounded-[2rem] outline-none font-bold focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" placeholder="Sua dúvida ou relato..." value={input} onChange={e => setInput(e.target.value)} /><button onClick={() => { if(input && trainer) { db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }); setInput(''); onMessageSent(); } }} className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg"><Send /></button></div>
        </div>
    );
};

const CommunityView = ({ posts, user, onUpdate }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="flex flex-col h-[75vh] space-y-6">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">{posts.map((p:any) => <div key={p.id} className={`flex ${p.userId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`p-6 rounded-[2rem] shadow-sm ${p.userId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}><p className="text-[9px] font-black opacity-40 uppercase mb-1">{p.userName}</p><p className="font-medium text-base leading-relaxed">{p.content}</p></div></div>)}</div>
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl flex gap-4"><input className="flex-1 bg-slate-50 px-8 py-5 rounded-[2rem] outline-none font-bold text-sm focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" placeholder="Compartilhe seu progresso..." value={input} onChange={e => setInput(e.target.value)} /><button onClick={() => { if(input) { db.addCommunityPost({ id: Date.now().toString(), userId: user.id, userName: user.name, content: input, timestamp: new Date().toISOString() }); setInput(''); onUpdate(); } }} className="bg-slate-900 text-white p-5 rounded-[1.8rem] shadow-xl"><Send className="w-7 h-7" /></button></div>
        </div>
    );
};

const ProgressView = ({ progress, user, onUpdate, onBack }: any) => (
    <div className="animate-fade-in"><button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold mb-8 group"><div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-900 group-hover:text-white"><ArrowLeft className="w-4 h-4"/></div> Voltar ao Início</button><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{progress.map((log:any) => <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-4"><p className="font-black text-2xl text-slate-900">{log.weight} kg</p><Scale className="w-5 h-5 text-indigo-500"/></div><p className="text-xs text-slate-400 font-bold">{new Date(log.date).toLocaleDateString()}</p></div>)}</div></div>
);

const QuickActionBtn = ({ icon: Icon, label, onClick, color }: any) => (
    <button onClick={onClick} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] group hover:bg-slate-900 transition-all border border-transparent shadow-sm hover:translate-y-[-4px]">
        <div className="flex items-center gap-4"><div className={`p-4 bg-white rounded-2xl shadow-sm ${color} group-hover:bg-white/10 group-hover:text-white transition-all`}><Icon className="w-6 h-6" /></div><span className="font-black text-sm group-hover:text-white">{label}</span></div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-all" />
    </button>
);

const MacroCard = ({ label, value, unit, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:translate-y-[-4px] group">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest group-hover:text-indigo-600 transition-colors">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value} <span className="text-xs font-bold text-slate-300">{unit}</span></p>
        <div className={`w-full h-1.5 ${color} rounded-full mt-4 opacity-10`}></div>
    </div>
);

const Card = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}><Icon className="w-6 h-6" /></div>
        <div><p className="text-[10px] font-black uppercase text-slate-400 leading-tight mb-1">{label}</p><p className="text-xl font-black text-slate-900">{value}</p></div>
    </div>
);
