
import React, { useState, useEffect } from 'react';
import { User, UserProfile, WorkoutPlan, DietPlan, ProgressLog, ActivityLog, ChatMessage, Badge, SportType, SpiritualPost, Exercise, CalendarEvent, SpiritualComment, BookReview, WishlistBook, LibraryComment, CommunityPost } from '../types';
import { db } from '../services/storage';
import { 
    CheckCircle, Trophy, Activity, Dumbbell, Utensils, Calendar as CalendarIcon, 
    Flame, Timer, Send, Scale, Ruler, Camera, Plus, BookOpen, 
    Quote, Sparkles, ChevronRight, Layers, X, Save, Loader2, ArrowLeft
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
    const [loading, setLoading] = useState(true);
    
    const loadData = async () => {
        const p = await db.getProfile(user.id);
        const prog = await db.getProgress(user.id);
        setProfile(p);
        setProgress(prog);
        setWorkouts(db.getWorkouts(user.id));
        setDiet(db.getDiet(user.id));
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [user.id, activeTab]);

    if (loading && !profile) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!profile) return null;

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

        case 'progress':
            return <ProgressView progress={progress} user={user} onUpdate={loadData} onBack={() => onTabChange('dashboard')} />;
        
        case 'workouts': return <div className="space-y-6 animate-fade-in"><button onClick={() => onTabChange('dashboard')} className="flex items-center gap-2 text-slate-400 font-bold mb-4"><ArrowLeft className="w-4 h-4"/> Voltar</button><h2 className="text-3xl font-black">Meus Treinos</h2></div>;
        // ... (Outras abas seguiriam o padrão com botão de voltar no topo para mobile)
        default: return <div className="p-10 text-center"><button onClick={() => onTabChange('dashboard')} className="mb-4 text-indigo-600 font-bold underline">Voltar ao Início</button><p>Conteúdo da aba {activeTab}</p></div>;
    }
};

const ProgressView = ({ progress, user, onUpdate, onBack }: { progress: ProgressLog[], user: User, onUpdate: () => void, onBack: () => void }) => {
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [newLog, setNewLog] = useState<{
        weight: string;
        waist: string;
        hips: string;
        arm: string;
        leg: string;
        photoUrl: string;
        notes: string;
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
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold mb-2 md:hidden"><ArrowLeft className="w-4 h-4"/> Voltar</button>
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
                                {newLog.photoUrl ? (
                                    <img src={newLog.photoUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                                        <Camera className="w-8 h-8 group-hover:scale-110 transition-transform"/>
                                        <span className="text-[10px] font-black uppercase">Tirar ou escolher foto</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block ml-1">Peso Atual (kg)</label>
                                    <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-black text-lg focus:bg-white border-2 border-transparent focus:border-indigo-500 transition-all" value={newLog.weight} onChange={e => setNewLog(p => ({...p, weight: e.target.value}))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <MedidaInput label="Cintura" value={newLog.waist} onChange={v => setNewLog(p => ({...p, waist: v}))} />
                                    <MedidaInput label="Braço" value={newLog.arm} onChange={v => setNewLog(p => ({...p, arm: v}))} />
                                    <MedidaInput label="Quadril" value={newLog.hips} onChange={v => setNewLog(p => ({...p, hips: v}))} />
                                    <MedidaInput label="Perna" value={newLog.leg} onChange={v => setNewLog(p => ({...p, leg: v}))} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-slate-400">Cancelar</button>
                            <button onClick={handleSave} disabled={isSaving} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin w-5 h-5"/> : <><Save className="w-5 h-5 text-indigo-400"/> Salvar Registro</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MedidaInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div>
        <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block ml-1">{label} (cm)</label>
        <input type="number" className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-sm" value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const Card = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 leading-tight">{label}</p>
            <p className="text-lg font-black text-slate-900">{value}</p>
        </div>
    </div>
);

const History = ({ className }: any) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
const MedidaDisplay = ({ label, value }: { label: string, value: number }) => (
    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <p className="text-[8px] font-black uppercase text-slate-400 leading-none mb-1">{label}</p>
        <p className="font-black text-slate-900 text-sm leading-none">{value || 0} <span className="text-[10px] font-bold text-slate-300">cm</span></p>
    </div>
);
const Inativo = ({ msg }: any) => (<div className="min-h-[65vh] flex flex-col items-center justify-center p-10 text-center"><h3 className="text-3xl font-black text-slate-900 mb-4">{msg}</h3></div>);
const DashboardSkeleton = () => (<div className="p-10 text-center animate-pulse"><Loader2 className="animate-spin mx-auto"/></div>);
