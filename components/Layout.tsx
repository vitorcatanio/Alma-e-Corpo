
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/storage';
import { 
  LayoutDashboard, 
  Dumbbell, 
  Utensils, 
  LineChart, 
  Users, 
  LogOut,
  Menu,
  Activity,
  MessageCircle,
  Calendar,
  X,
  Camera,
  Save,
  User as UserIcon,
  BookOpen
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  role, 
  activeTab, 
  onTabChange, 
  onLogout,
  user,
  onUserUpdate
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Profile Edit State
  const [editName, setEditName] = useState(user.name);
  const [previewAvatar, setPreviewAvatar] = useState<string | undefined>(user.avatarUrl);

  const studentNavItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'workouts', label: 'Meus Treinos', icon: Dumbbell },
    { id: 'diet', label: 'Dieta', icon: Utensils },
    { id: 'progress', label: 'Timelapse', icon: LineChart },
    { id: 'spiritual', label: 'Espiritual', icon: BookOpen },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle, notify: 1 },
    { id: 'community', label: 'Comunidade', icon: Users },
  ];

  const trainerNavItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'students', label: 'Gestão de Alunos', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'messages', label: 'Mensagens', icon: MessageCircle, notify: 3 },
  ];

  const items = role === UserRole.STUDENT ? studentNavItems : trainerNavItems;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = () => {
      const updatedUser = { ...user, name: editName, avatarUrl: previewAvatar };
      db.updateUser(updatedUser);
      onUserUpdate(updatedUser);
      setIsProfileModalOpen(false);
  };

  const handleOpenProfile = () => {
      setEditName(user.name);
      setPreviewAvatar(user.avatarUrl);
      setIsProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row font-sans overflow-x-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 backdrop-blur-md p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <h1 className="text-xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
            </div>
            TREYO
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900">TREYO</h1>
                <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Corpo & Alma</p>
            </div>
          </div>
          
          <button 
            onClick={handleOpenProfile}
            className="mb-8 p-1 bg-slate-50 rounded-2xl border border-slate-100 w-full hover:border-indigo-200 hover:shadow-md transition-all group text-left relative"
          >
             <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        user.name.charAt(0)
                    )}
                </div>
                <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize flex items-center gap-1">
                        {role === 'trainer' ? 'Personal Trainer' : 'Aluno'}
                    </p>
                </div>
                <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-indigo-400" />
                </div>
             </div>
          </button>

          <nav className="flex-1 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="font-medium text-sm tracking-wide">{item.label}</span>
                  {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-l-full"></div>}
                  
                  {item.notify && !isActive && (
                      <span className="absolute right-4 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                  )}
                </button>
              );
            })}
          </nav>

          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors mt-auto font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sair da conta
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#F1F5F9] relative w-full">
         {/* Background Decor */}
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
         
        <div className="max-w-7xl mx-auto relative z-10 pb-20 md:pb-0">
           {children}
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-slide-up relative">
                  <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                      <X className="w-6 h-6" />
                  </button>
                  
                  <h2 className="text-2xl font-black text-slate-900 mb-6 text-center">Editar Perfil</h2>
                  
                  <div className="flex flex-col items-center gap-6">
                      <div className="relative group">
                          <div className="w-32 h-32 rounded-full bg-indigo-100 border-4 border-white shadow-xl overflow-hidden">
                              {previewAvatar ? (
                                  <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-300">
                                      {editName.charAt(0)}
                                  </div>
                              )}
                          </div>
                          <label className="absolute bottom-0 right-0 p-3 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700 shadow-md transition-transform active:scale-95">
                              <Camera className="w-5 h-5" />
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                      </div>
                      
                      <div className="w-full space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                              <div className="relative">
                                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                                  <input 
                                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                  />
                              </div>
                          </div>
                          
                          <button 
                              onClick={handleSaveProfile}
                              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                          >
                              <Save className="w-5 h-5" /> Salvar Alterações
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};