
import React, { useState } from 'react';
import { User, SportType, UserProfile } from '../types';
import { db } from '../services/storage';
import { AlertCircle, CheckCircle, Scale, BookOpen, Target, ChevronRight } from 'lucide-react';

interface OnboardingProps {
    user: User;
    onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        userId: user.id,
        selectedSports: [],
        measurements: { waist: 0, hips: 0, arm: 0, leg: 0 },
        onboardingChoices: {
            wantsWeightLoss: false,
            wantsBibleReading: false,
            wantsExtraReading: false
        }
    });

    const handleObjectiveToggle = (field: 'wantsWeightLoss' | 'wantsBibleReading' | 'wantsExtraReading') => {
        setFormData({
            ...formData,
            onboardingChoices: {
                ...formData.onboardingChoices!,
                [field]: !formData.onboardingChoices![field]
            }
        });
        setError('');
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.age || !formData.gender || !formData.height || !formData.weight) {
                setError('Preencha os dados básicos.');
                return;
            }
        }
        if (step === 2) {
            const { wantsWeightLoss, wantsBibleReading, wantsExtraReading } = formData.onboardingChoices!;
            if (!wantsWeightLoss && !wantsBibleReading && !wantsExtraReading) {
                setError('Selecione pelo menos um objetivo.');
                return;
            }
        }
        if (step === 3) {
            // Se quer peso, precisa de medidas
            if (formData.onboardingChoices?.wantsWeightLoss) {
                if (!formData.measurements?.waist || !formData.measurements?.hips) {
                    setError('Informe suas medidas.');
                    return;
                }
            }
        }
        
        // Lógica de pulo de passos
        if (step === 3 && !formData.onboardingChoices?.wantsWeightLoss) {
            handleSubmit();
            return;
        }

        setError('');
        setStep(s => s + 1);
    };

    const handleSubmit = () => {
        const profile: UserProfile = {
            userId: user.id,
            age: formData.age || 0,
            gender: formData.gender || 'outro',
            height: formData.height || 0,
            weight: formData.weight || 0,
            measurements: formData.measurements as any,
            goal: formData.goal || 'Foco TREYO',
            selectedSports: formData.selectedSports || [],
            onboardingCompleted: true,
            activeModules: {
                fitness: false, // Começa inativo até o personal ativar
                spiritual: false,
                reading: false
            },
            onboardingChoices: formData.onboardingChoices as any,
            points: 0,
            level: 1,
            badges: []
        };
        
        db.saveProfile(profile);
        onComplete();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="bg-white max-w-xl w-full p-10 rounded-[2.5rem] shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
                    <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }}></div>
                </div>

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">
                        {step === 1 ? 'Dados Básicos' : step === 2 ? 'Seus Objetivos' : step === 3 ? 'Configurações' : 'Esportes'}
                    </h1>
                    <p className="text-slate-500 text-sm">Passo {step} de 4</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Idade" type="number" value={formData.age} onChange={v => setFormData({...formData, age: parseInt(v)})} />
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Sexo</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" onChange={e => setFormData({...formData, gender: e.target.value as any})} value={formData.gender}>
                                    <option value="">Selecione</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="feminino">Feminino</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Altura (cm)" type="number" value={formData.height} onChange={v => setFormData({...formData, height: parseInt(v)})} />
                            <Input label="Peso (kg)" type="number" value={formData.weight} onChange={v => setFormData({...formData, weight: parseInt(v)})} />
                        </div>
                        <Button label="Continuar" onClick={nextStep} />
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <ChoiceCard 
                            icon={Scale} 
                            title="Perder peso" 
                            active={formData.onboardingChoices?.wantsWeightLoss} 
                            onClick={() => handleObjectiveToggle('wantsWeightLoss')} 
                        />
                        <ChoiceCard 
                            icon={BookOpen} 
                            title="Leitura bíblica" 
                            active={formData.onboardingChoices?.wantsBibleReading} 
                            onClick={() => handleObjectiveToggle('wantsBibleReading')} 
                        />
                        <ChoiceCard 
                            icon={Target} 
                            title="Leitura extra" 
                            active={formData.onboardingChoices?.wantsExtraReading} 
                            onClick={() => handleObjectiveToggle('wantsExtraReading')} 
                        />
                        <Button label="Continuar" onClick={nextStep} />
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        {formData.onboardingChoices?.wantsWeightLoss && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Scale className="w-4 h-4"/> Medidas Iniciais</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Cintura (cm)" type="number" value={formData.measurements?.waist} onChange={v => setFormData({...formData, measurements: {...formData.measurements!, waist: parseInt(v)}})} />
                                    <Input label="Quadril (cm)" type="number" value={formData.measurements?.hips} onChange={v => setFormData({...formData, measurements: {...formData.measurements!, hips: parseInt(v)}})} />
                                </div>
                            </div>
                        )}
                        {formData.onboardingChoices?.wantsBibleReading && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Plano Bíblico</h3>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none" onChange={e => setFormData({...formData, onboardingChoices: {...formData.onboardingChoices!, biblePlanDuration: e.target.value}})}>
                                    <option value="">Em quanto tempo quer ler?</option>
                                    <option value="6 meses">6 Meses</option>
                                    <option value="1 ano">1 Ano</option>
                                    <option value="2 anos">2 Anos</option>
                                </select>
                            </div>
                        )}
                        {formData.onboardingChoices?.wantsExtraReading && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target className="w-4 h-4"/> Meta de Leitura Extra</h3>
                                <Input label="Quantos livros quer ler este ano?" type="number" value={formData.onboardingChoices?.extraReadingGoal} onChange={v => setFormData({...formData, onboardingChoices: {...formData.onboardingChoices!, extraReadingGoal: parseInt(v)}})} />
                            </div>
                        )}
                        <Button label="Continuar" onClick={nextStep} />
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {Object.values(SportType).map(sport => (
                                <button
                                    key={sport}
                                    onClick={() => {
                                        const current = formData.selectedSports || [];
                                        setFormData({...formData, selectedSports: current.includes(sport) ? current.filter(s => s !== sport) : [...current, sport]});
                                    }}
                                    className={`px-6 py-3 rounded-2xl border-2 font-bold transition-all ${
                                        formData.selectedSports?.includes(sport) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-500'
                                    }`}
                                >
                                    {sport}
                                </button>
                            ))}
                        </div>
                        <Button label="Finalizar Cadastro" onClick={handleSubmit} />
                    </div>
                )}
            </div>
        </div>
    );
};

const Input = ({ label, type, value, onChange }: any) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase">{label}</label>
        <input 
            type={type} 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" 
            value={value || ''} 
            onChange={e => onChange(e.target.value)} 
        />
    </div>
);

const ChoiceCard = ({ icon: Icon, title, active, onClick }: any) => (
    <button 
        onClick={onClick}
        className={`w-full p-6 rounded-3xl border-2 flex items-center gap-4 transition-all text-left ${
            active ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-white hover:border-indigo-200'
        }`}
    >
        <div className={`p-3 rounded-2xl ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
            <h3 className={`font-bold ${active ? 'text-indigo-900' : 'text-slate-600'}`}>{title}</h3>
        </div>
        {active && <CheckCircle className="w-6 h-6 text-indigo-600" />}
    </button>
);

const Button = ({ label, onClick }: any) => (
    <button 
        onClick={onClick} 
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
    >
        {label} <ChevronRight className="w-5 h-5" />
    </button>
);
