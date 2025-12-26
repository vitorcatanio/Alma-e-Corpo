
import React, { useState, useEffect, useRef } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ChatMessage, ReadingPlan } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils,
    Flame, Send, Scale, Camera, Plus, BookOpen, 
    Quote, Sparkles, ChevronRight, Layers, X, Save, Loader2, ArrowLeft,
    MessageCircle, MessageSquare, Info, Star, Filter, SortAsc, BookPlus, Edit2, Medal, 
    Check, ChevronDown, TrendingUp, ImageIcon, Sunrise, Sun, Coffee, Soup, Moon, Ruler
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
    const [communityPosts, setCommunityPosts] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<(UserProfile & { userName: string, avatarUrl?: string })[]>([]);
    const [trainer, setTrainer] = useState<User | undefined>();
    const [loading, setLoading] = useState(true);
    
    const loadData = async () => {
        const allUsers = await db.getAllUsersFromDb();
        const foundTrainer = allUsers.find(u => u.role === 'trainer');
        const p = await db.getProfile(user.id);
        const l = await db.getReadingLeaderboard();
        
        setTrainer(foundTrainer);
        setProfile(p);
        setLeaderboard(l);
        setWorkouts(db.getWorkouts(user.id));
        setDiet(db.getDiet(user.id));
        setCommunityPosts(db.getCommunityPosts());
        
        const prog = await db.getProgress(user.id);
        setProgress(prog);
        
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 12000); 
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
                            <h2 className="text-4xl font-black mb-2 text-white">Olá, {user.name.split(' ')[0]}</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">Sua jornada é única. Cada passo conta.</p>
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
                            {profile.onboardingChoices?.wantsWeightLoss && (
                                <QuickActionBtn icon={TrendingUp} label="Minha Evolução" onClick={() => onTabChange('progress')} color="text-emerald-600" />
                            )}
                            <QuickActionBtn icon={Dumbbell} label="Ver Treino de Hoje" onClick={() => onTabChange('workouts')} color="text-indigo-600" />
                            <QuickActionBtn icon={BookOpen} label="Minha Leitura" onClick={() => onTabChange('spiritual')} color="text-amber-600" />
                            <QuickActionBtn icon={MessageCircle} label="Falar com Moderador" onClick={() => onTabChange('messages')} color="text-rose-600" />
                        </div>
                    </div>
                </div>
            );

        case 'workouts': 
            return <div className="space-y-6 pb-20"><BackButton /><WorkoutView workouts={workouts} user={user} /></div>;

        case 'diet':
            return <div className="space-y-6 pb-20"><BackButton /><DietView diet={diet} /></div>;

        case 'progress':
            return <EvolutionView progress={progress} user={user} profile={profile} onUpdate={loadData} onBack={() => onTabChange('dashboard')} />;

        case 'library':
            return <div className="space-y-6 pb-20"><BackButton /><LibraryView user={user} profile={profile} onUpdate={loadData} /></div>;

        case 'spiritual':
            return <div className="space-y-6 pb-20"><BackButton /><SpiritualView user={user} profile={profile} leaderboard={leaderboard} onUpdate={loadData} /></div>;

        case 'messages':
            return <div className="space-y-6 pb-20"><BackButton /><ChatView user={user} trainer={trainer} onMessageSent={loadData} /></div>;

        case 'community':
            return <div className="space-y-6 pb-20"><BackButton /><CommunityView posts={communityPosts} user={user} onUpdate={loadData} /></div>;
            
        default:
            return <div className="p-10 text-center animate-fade-in"><BackButton /><div className="bg-white p-20 rounded-[3rem] border border-slate-100"><p className="text-slate-400 font-bold italic">Módulo em construção.</p></div></div>;
    }
};

// --- SUB-VIEWS ---

const EvolutionView = ({ progress, user, profile, onUpdate, onBack }: any) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newLog, setNewLog] = useState({
        weight: profile.weight || 0,
        measurements: { waist: profile.measurements?.waist || 0, hips: profile.measurements?.hips || 0, arm: profile.measurements?.arm || 0, leg: profile.measurements?.leg || 0 },
        notes: '',
        photoUrl: ''
    });
    const photoInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setNewLog({ ...newLog, photoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!newLog.weight) return alert("Peso é obrigatório para registrar sua evolução.");
        const log: ProgressLog = {
            id: Date.now().toString(),
            userId: user.id,
            date: new Date().toISOString(),
            weight: newLog.weight,
            measurements: newLog.measurements as any,
            notes: newLog.notes,
            photoUrl: newLog.photoUrl
        };
        await db.addProgress(log);
        setIsAdding(false);
        onUpdate();
    };

    return (
        <div className="animate-fade-in pb-20 space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors group">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all"><ArrowLeft className="w-4 h-4"/></div> 
                    Voltar ao Início
                </button>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:scale-105 transition-all">
                        <Plus className="w-5 h-5" /> Novo Registro de Evolução
                    </button>
                )}
            </div>

            {isAdding ? (
                <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8 animate-slide-up">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black text-slate-900">Registrar Evolução</h2>
                        <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-slate-900"><X /></button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Foto de Progresso */}
                        <div className="space-y-6">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest block">Foto da Evolução</label>
                            <div 
                                onClick={() => photoInputRef.current?.click()}
                                className="aspect-[4/5] bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-indigo-200 transition-all overflow-hidden group"
                            >
                                {newLog.photoUrl ? (
                                    <img src={newLog.photoUrl} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <>
                                        <div className="p-6 bg-white rounded-3xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">Clique para carregar foto</p>
                                    </>
                                )}
                                <input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium text-center italic">Dica: Tente tirar a foto no mesmo lugar e iluminação para comparar melhor.</p>
                        </div>

                        {/* Dados e Medidas */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="col-span-full">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-3 flex items-center gap-2"><Scale className="w-4 h-4 text-indigo-500" /> Peso Atual (kg)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-5 bg-slate-50 rounded-2xl font-black text-2xl outline-none focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all shadow-sm"
                                        value={newLog.weight}
                                        onChange={e => setNewLog({ ...newLog, weight: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-6 col-span-full">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Ruler className="w-4 h-4 text-emerald-500" /> Circunferências (cm)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <MeasurementInput label="Cintura" value={newLog.measurements.waist} onChange={v => setNewLog({ ...newLog, measurements: { ...newLog.measurements, waist: v } })} />
                                        <MeasurementInput label="Quadril" value={newLog.measurements.hips} onChange={v => setNewLog({ ...newLog, measurements: { ...newLog.measurements, hips: v } })} />
                                        <MeasurementInput label="Braço" value={newLog.measurements.arm} onChange={v => setNewLog({ ...newLog, measurements: { ...newLog.measurements, arm: v } })} />
                                        <MeasurementInput label="Perna" value={newLog.measurements.leg} onChange={v => setNewLog({ ...newLog, measurements: { ...newLog.measurements, leg: v } })} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-3">Relato de Mudança</label>
                                <textarea 
                                    placeholder="Ex: Senti que minha calça jeans está mais folgada hoje. Dormi melhor e tive mais disposição no treino."
                                    className="w-full h-32 p-5 bg-slate-50 rounded-2xl font-medium outline-none focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all resize-none shadow-sm"
                                    value={newLog.notes}
                                    onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                                />
                            </div>

                            <button onClick={handleSave} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                                <Save className="w-6 h-6" /> Salvar Minha Evolução
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Histórico de Transformação</h2>
                            <p className="text-slate-400 font-medium">Veja o quanto você já caminhou. O esforço recompensa.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {progress.length === 0 ? (
                            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                                <Camera className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold italic">Sua linha do tempo está esperando. Registre sua primeira evolução!</p>
                            </div>
                        ) : progress.map((log: ProgressLog) => (
                            <div key={log.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all">
                                {log.photoUrl ? (
                                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                        <img src={log.photoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Progresso" />
                                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black">
                                            {new Date(log.date).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-[4/3] w-full bg-slate-50 flex items-center justify-center text-slate-200">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="p-8 space-y-6">
                                    <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Peso Registrado</p>
                                            <p className="text-3xl font-black text-slate-900">{log.weight} <span className="text-sm font-bold text-slate-300">kg</span></p>
                                        </div>
                                        <div className="text-right">
                                             <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Status</p>
                                             <CheckCircle className="w-6 h-6 text-emerald-400 ml-auto" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-1">Cintura</p>
                                            <p className="font-black text-slate-700 text-lg">{log.measurements?.waist || '-'} <span className="text-[10px]">cm</span></p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-1">Quadril</p>
                                            <p className="font-black text-slate-700 text-lg">{log.measurements?.hips || '-'} <span className="text-[10px]">cm</span></p>
                                        </div>
                                    </div>

                                    {log.notes && (
                                        <div className="relative pt-4 bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50">
                                            <Quote className="absolute -top-1 -right-1 w-6 h-6 text-indigo-100" />
                                            <p className="text-xs text-slate-600 font-medium italic relative z-10 line-clamp-4 leading-relaxed">"{log.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MeasurementInput = ({ label, value, onChange }: any) => (
    <div>
        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5 ml-1">{label}</label>
        <input 
            type="number" 
            className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all shadow-sm"
            value={value || ''}
            onChange={e => onChange(parseFloat(e.target.value))}
        />
    </div>
);

const ChatView = ({ user, trainer, onMessageSent }: any) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    useEffect(() => { if (trainer) { setMessages(db.getMessages(user.id, trainer.id)); } }, [trainer, user.id]);
    return (
        <div className="bg-white h-[70vh] rounded-[3rem] border border-slate-100 flex flex-col overflow-hidden shadow-sm">
            <div className="p-8 border-b font-black flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl text-white flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                </div> 
                Moderador Treyo
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm ${m.senderId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-8 flex gap-4">
                <input className="flex-1 bg-slate-50 p-5 rounded-[2rem] outline-none font-bold focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all shadow-inner" placeholder="Envie uma dúvida para o moderador..." value={input} onChange={e => setInput(e.target.value)} />
                <button onClick={() => { if(input && trainer) { db.sendMessage({ id: Date.now().toString(), senderId: user.id, receiverId: trainer.id, content: input, timestamp: new Date().toISOString(), read: false }); setInput(''); onMessageSent(); } }} className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"><Send /></button>
            </div>
        </div>
    );
};

const BIBLE_STRUCTURE: Record<string, number> = {
    'Gênesis': 50, 'Êxodo': 40, 'Levítico': 27, 'Números': 36, 'Deuteronômio': 34,
    'Josué': 24, 'Juízes': 21, 'Rute': 4, '1 Samuel': 31, '2 Samuel': 24,
    '1 Reis': 22, '2 Reis': 25, '1 Crônicas': 29, '2 Crônicas': 36, 'Esdras': 10,
    'Neemias': 13, 'Ester': 10, 'Jó': 42, 'Salmos': 150, 'Provérbios': 31,
    'Eclesiastes': 12, 'Cantares': 8, 'Isaías': 66, 'Jeremias': 52, 'Lamentações': 5,
    'Ezequiel': 48, 'Daniel': 12, 'Oséias': 14, 'Joel': 3, 'Amós': 9,
    'Obadias': 1, 'Jonas': 4, 'Miquéias': 7, 'Naum': 3, 'Habacuque': 3,
    'Sofonias': 3, 'Ageu': 2, 'Zacarias': 14, 'Malaquias': 4,
    'Mateus': 28, 'Marcos': 16, 'Lucas': 24, 'João': 21, 'Atos': 28,
    'Romanos': 16, '1 Coríntios': 16, '2 Coríntios': 13, 'Gálatas': 6, 'Efésios': 6,
    'Filipenses': 4, 'Colossenses': 4, '1 Tessalonicenses': 5, '2 Tessalonicenses': 3,
    '1 Timóteo': 6, '2 Timóteo': 4, 'Tito': 3, 'Filemon': 1, 'Hebreus': 13,
    'Tiago': 5, '1 Pedro': 5, '2 Pedro': 3, '1 João': 5, '2 João': 1,
    '3 João': 1, 'Judas': 1, 'Apocalipse': 22
};

const BIBLE_PLANS: ReadingPlan[] = [
    { id: 'anual', name: 'Plano Anual', category: 'Anual', description: 'Leia toda a Bíblia em um ano na ordem canônica.', books: Object.keys(BIBLE_STRUCTURE) },
    { id: 'cronologico', name: 'Cronológico', category: 'Cronológico', description: 'A história na ordem em que aconteceu.', books: ['Gênesis', 'Jó', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio'] },
    { id: 'nt', name: 'Novo Testamento', category: 'NT', description: 'Foco total na vida de Jesus e na Igreja Primitiva.', books: Object.keys(BIBLE_STRUCTURE).slice(39) },
    { id: 'sabedoria', name: 'Salmos & Provérbios', category: 'Sabedoria', description: 'Um capítulo de Salmos e Provérbios por dia.', books: ['Salmos', 'Provérbios'] },
    { id: 'essencial', name: 'Essenciais da Fé', category: 'Temático', description: 'Passagens chave sobre a caminhada cristã.', books: ['João', 'Romanos', 'Efésios'] }
];

const SpiritualView = ({ profile: initialProfile, leaderboard, user, onUpdate }: any) => {
    const [view, setView] = useState<'plans' | 'active'>('plans');
    const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
    const [expandedBook, setExpandedBook] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [localChapters, setLocalChapters] = useState<string[]>(initialProfile?.readingStats?.readChapters || []);

    useEffect(() => {
        setLocalChapters(initialProfile?.readingStats?.readChapters || []);
        if (initialProfile.readingStats?.activePlanId) {
            const plan = BIBLE_PLANS.find(p => p.id === initialProfile.readingStats.activePlanId);
            if (plan) {
                setSelectedPlan(plan);
                setView('active');
            }
        }
    }, [initialProfile.userId, initialProfile.readingStats?.activePlanId, initialProfile.readingStats?.readChapters]);

    const handleStartPlan = async (plan: ReadingPlan) => {
        const updatedProfile = { ...initialProfile, readingStats: { ...initialProfile.readingStats, activePlanId: plan.id } };
        await db.saveProfile(updatedProfile);
        setSelectedPlan(plan);
        setView('active');
        onUpdate();
    };

    const toggleChapter = async (book: string, chapter: number) => {
        const chapterID = `${book}-${chapter}`;
        setLocalChapters(prev => {
            if (prev.includes(chapterID)) return prev.filter(c => c !== chapterID);
            return [...prev, chapterID];
        });
        await db.checkInReading(user.id, book, chapter);
        onUpdate(); 
    };

    const planCategories = ['Anual', 'Cronológico', 'Temático', 'NT', 'Sabedoria'];

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black mb-2 text-white">Ápice Espiritual</h2>
                            <p className="text-slate-400 font-medium">Sincronize seu crescimento espiritual.</p>
                            <div className="mt-8 flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full border-4 border-amber-400/20 flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin-slow"></div>
                                    <span className="text-2xl font-black text-amber-400">{initialProfile.level}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pontos Acumulados</p>
                                    <p className="text-4xl font-black text-white">{initialProfile.points || 0} <span className="text-xs text-slate-500 font-bold">PTS</span></p>
                                </div>
                            </div>
                        </div>
                        <BookOpen className="absolute right-[-40px] bottom-[-40px] w-64 h-64 text-white/5 -rotate-12" />
                    </div>

                    {selectedPlan && view === 'active' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setView('plans')} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedPlan.name}</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedPlan.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">Seu Progresso</span>
                                    <p className="text-2xl font-black text-slate-900">
                                        {Math.round(((localChapters.length || 0) / 1189) * 100)}%
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {selectedPlan.books.map(book => (
                                    <div key={book} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm transition-all">
                                        <button onClick={() => setExpandedBook(expandedBook === book ? null : book)} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">{book.charAt(0)}</div>
                                                <div>
                                                    <span className="font-black text-slate-900 block">{book}</span>
                                                    <div className="w-32 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((localChapters.filter((c: string) => c.startsWith(book)).length || 0) / BIBLE_STRUCTURE[book]) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{localChapters.filter((c: string) => c.startsWith(book)).length || 0} / {BIBLE_STRUCTURE[book]}</span>
                                                <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${expandedBook === book ? 'rotate-180' : ''}`} />
                                            </div>
                                        </button>
                                        {expandedBook === book && (
                                            <div className="p-6 bg-slate-50/50 border-t border-slate-50 grid grid-cols-5 md:grid-cols-10 gap-2 animate-fade-in">
                                                {Array.from({ length: BIBLE_STRUCTURE[book] }, (_, i) => i + 1).map(chap => {
                                                    const isRead = localChapters.includes(`${book}-${chap}`);
                                                    return (
                                                        <button key={chap} onClick={() => toggleChapter(book, chap)} className={`h-10 rounded-lg font-black text-xs transition-all flex items-center justify-center border shadow-sm ${isRead ? 'bg-indigo-600 border-indigo-600 text-white scale-95' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300 active:scale-90'}`}>
                                                            {isRead ? <Check className="w-4 h-4" /> : chap}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                                <h3 className="text-2xl font-black text-slate-900">Escolha seu Plano</h3>
                                <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm overflow-x-auto max-w-full">
                                    <button onClick={() => setFilterCategory('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Todos</button>
                                    {planCategories.map(cat => (
                                        <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>{cat}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {BIBLE_PLANS.filter(p => filterCategory === 'all' || p.category === filterCategory).map(plan => (
                                    <div key={plan.id} className={`p-8 rounded-[2.5rem] border transition-all flex flex-col ${initialProfile.readingStats?.activePlanId === plan.id ? 'bg-indigo-50 border-indigo-200 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:shadow-xl'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">{plan.category}</span>
                                            {initialProfile.readingStats?.activePlanId === plan.id && <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase animate-pulse"><Check className="w-3 h-3"/> ATIVO</div>}
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h4>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 flex-1">{plan.description}</p>
                                        <button onClick={() => handleStartPlan(plan)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${initialProfile.readingStats?.activePlanId === plan.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                                            {initialProfile.readingStats?.activePlanId === plan.id ? 'CONTINUAR ESTE' : 'INICIAR ESTE PLANO'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-96 space-y-8">
                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl flex flex-col h-fit max-h-[85vh] sticky top-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-500"><Medal className="w-6 h-6" /></div>
                            <div><h3 className="text-xl font-black text-slate-900 leading-none">Ranking Global</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Guerreiros Treyo</p></div>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {leaderboard.length === 0 ? <div className="text-center py-20 bg-slate-50 rounded-3xl"><Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-200" /></div> : leaderboard.map((u, idx) => (
                                <div key={u.userId} className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${u.userId === user.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.05]' : 'bg-slate-50 border-transparent'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>{idx + 1}</div>
                                    <div className="w-11 h-11 rounded-xl bg-slate-200 overflow-hidden border-2 border-white shrink-0">{u.avatarUrl ? <img src={u.avatarUrl} alt={u.userName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-sm">{u.userName.charAt(0)}</div>}</div>
                                    <div className="flex-1 overflow-hidden"><p className="font-bold text-sm truncate">{u.userName}</p><div className="flex items-center gap-1.5 mt-0.5"><span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${u.userId === user.id ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}>LVL {u.level}</span></div></div>
                                    <div className="text-right shrink-0"><p className="font-black text-sm leading-none">{u.points || 0}</p><p className="text-[8px] font-bold uppercase text-slate-400">PONTOS</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorkoutView = ({ workouts }: any) => {
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
    const mealList = [{ id: 'breakfast', label: 'Café da Manhã', icon: Sunrise, color: 'text-amber-500' }, { id: 'lunch', label: 'Almoço', icon: Sun, color: 'text-indigo-500' }, { id: 'snack', label: 'Café da Tarde', icon: Coffee, color: 'text-orange-500' }, { id: 'dinner', label: 'Jantar', icon: Soup, color: 'text-rose-500' }, { id: 'supper', label: 'Ceia', icon: Moon, color: 'text-slate-900' }];
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
                            <div className="flex items-center gap-4 md:w-56 shrink-0"><div className={`p-4 rounded-2xl bg-slate-50 ${m.color}`}><m.icon className="w-7 h-7" /></div><div><h4 className="font-black text-slate-900 text-lg leading-tight">{m.label}</h4><p className="text-[10px] font-black uppercase text-slate-300">Prescrito</p></div></div>
                            <div className="flex-1 bg-slate-50/50 p-6 rounded-3xl border border-slate-50"><p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{content}</p></div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LibraryView = ({ user, profile, onUpdate }: any) => {
    const [view, setView] = useState<'shelf' | 'community' | 'add'>('shelf');
    const categories = ['Espiritualidade', 'Desenvolvimento Pessoal', 'Saúde & Fitness', 'Biografia', 'Ficção', 'Negócios', 'Outros'];
    const [newBook, setNewBook] = useState({ id: '', title: '', author: '', review: '', category: categories[0], rating: 5 });
    const reviews = db.getBookReviews();
    const filteredReviews = reviews.filter(r => view === 'shelf' ? r.userId === user.id : true);
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center"><h2 className="text-4xl font-black text-slate-900">Biblioteca</h2><button onClick={() => { setNewBook({ id: '', title: '', author: '', review: '', category: categories[0], rating: 5 }); setView('add'); }} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl"><Plus className="w-5 h-5" /> Novo Livro</button></div>
            {view === 'add' ? (
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
                    <div className="flex justify-between items-center"><h3 className="text-2xl font-black">Adicionar à Estante</h3><button onClick={() => setView('shelf')}><X /></button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <input placeholder="Título" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                            <input placeholder="Autor" className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                        </div>
                        <textarea placeholder="Sua resenha..." className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-medium h-full min-h-[150px]" value={newBook.review} onChange={e => setNewBook({...newBook, review: e.target.value})} />
                    </div>
                    <button onClick={() => { db.saveBookReview({...newBook, id: Date.now().toString(), userId: user.id, userName: user.name, timestamp: new Date().toISOString(), comments: []}); setView('shelf'); onUpdate(); }} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl">Publicar Livro</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredReviews.map(r => (
                        <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-xl transition-all group">
                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase w-fit mb-4">{r.category}</span>
                            <h4 className="text-xl font-black text-slate-900 mb-1">{r.title}</h4>
                            <p className="text-xs font-bold text-slate-400 mb-4">{r.author}</p>
                            <p className="text-slate-600 text-sm italic line-clamp-4 flex-1">"{r.review}"</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CommunityView = ({ posts, user, onUpdate }: any) => {
    const [input, setInput] = useState('');
    return (
        <div className="flex flex-col h-[75vh] space-y-6">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {posts.map((p:any) => <div key={p.id} className={`flex ${p.userId === user.id ? 'justify-end' : 'justify-start'}`}><div className={`p-6 rounded-[2rem] shadow-sm ${p.userId === user.id ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}><p className="text-[9px] font-black opacity-40 uppercase mb-1">{p.userName}</p><p className="font-medium">{p.content}</p></div></div>)}
            </div>
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl flex gap-4">
                <input className="flex-1 bg-slate-50 px-8 py-5 rounded-[2rem] outline-none font-bold" placeholder="Compartilhe seu progresso..." value={input} onChange={e => setInput(e.target.value)} />
                <button onClick={() => { if(input) { db.addCommunityPost({ id: Date.now().toString(), userId: user.id, userName: user.name, content: input, timestamp: new Date().toISOString() }); setInput(''); onUpdate(); } }} className="bg-slate-900 text-white p-5 rounded-[1.8rem]"><Send /></button>
            </div>
        </div>
    );
};

const QuickActionBtn = ({ icon: Icon, label, onClick, color }: any) => (
    <button onClick={onClick} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] group hover:bg-slate-900 transition-all border border-transparent shadow-sm hover:translate-y-[-4px]">
        <div className="flex items-center gap-4"><div className={`p-4 bg-white rounded-2xl shadow-sm ${color} group-hover:bg-white/10 transition-all`}><Icon className="w-6 h-6" /></div><span className="font-black text-sm group-hover:text-white">{label}</span></div>
        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-all" />
    </button>
);

const MacroCard = ({ label, value, unit, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:translate-y-[-4px] group">
        <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{label}</p>
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
