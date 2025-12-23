
import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { getProfile, upsertProfile, getPets, uploadAvatar, deletePet, Profile, Pet } from '../lib/database';

interface ProfileProps {
  onNavigate: (s: Screen, petToEdit?: Pet) => void;
}

const ProfileScreen: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileData, petsData] = await Promise.all([
        getProfile(user.id),
        getPets(user.id)
      ]);

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setAvatarUrl(profileData.avatar_url);
      } else {
        // Initialize with email
        setFullName(user.email?.split('@')[0] || '');
      }
      setPets(petsData);
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile({
        id: user.id,
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl
      });
      alert('Perfil salvo com sucesso!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    try {
      const url = await uploadAvatar(user.id, file);
      if (url) {
        setAvatarUrl(url);
        await upsertProfile({ id: user.id, avatar_url: url });
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Erro ao enviar foto');
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${petName}?`)) {
      return;
    }
    try {
      await deletePet(petId);
      setPets(pets.filter(p => p.id !== petId));
      alert('Pet excluído com sucesso!');
    } catch (err) {
      console.error('Error deleting pet:', err);
      alert('Erro ao excluir pet');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-300 bg-background-light dark:bg-background-dark">
      <Header
        title="Meu Perfil"
        leftIcon="arrow_back_ios_new"
        onLeftClick={() => onNavigate('HOME')}
        rightIcon={
          <span className="text-xs font-semibold text-primary">{saving ? '...' : 'Salvar'}</span>
        }
        onRightClick={handleSave}
      />

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="flex flex-col items-center pt-6 pb-2 px-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="size-32 rounded-full p-1 bg-gradient-to-tr from-primary to-blue-300 shadow-lg">
              <div
                className="h-full w-full rounded-full bg-cover bg-center border-4 border-white bg-gray-200"
                style={{ backgroundImage: avatarUrl ? `url("${avatarUrl}")` : 'none' }}
              >
                {!avatarUrl && (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-5xl">person</span>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-1 bg-primary text-white p-2 rounded-full shadow-md border-2 border-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-bold">{fullName || user?.email}</h1>
            <p className="text-gray-500 text-xs font-medium mt-1">{user?.email}</p>
          </div>
        </div>

        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary filled">pets</span>
              Meus Pets ({pets.length})
            </h3>
            <button
              onClick={() => onNavigate('PET_REGISTRATION')}
              className="text-primary text-xs font-semibold flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Adicionar
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-2">pets</span>
              <p className="text-sm">Nenhum pet cadastrado ainda</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pets.map(pet => (
                <div key={pet.id} className="bg-white dark:bg-surface-dark border border-gray-100 rounded-2xl p-3 shadow-sm flex items-center gap-4">
                  <div className="size-16 rounded-xl overflow-hidden bg-gray-100">
                    {pet.image_url ? (
                      <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${pet.image_url}")` }}></div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-300 text-3xl">pets</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold truncate text-base">{pet.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500">{pet.breed} {pet.age ? `• ${pet.age}` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('PET_REGISTRATION', pet)}
                      className="p-2 rounded-full bg-blue-50 text-primary hover:bg-blue-100 transition-colors"
                      title="Editar pet"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePet(pet.id, pet.name)}
                      className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Excluir pet"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 px-4 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary filled">person</span>
            Informações Pessoais
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 ml-1">Nome Completo</label>
              <input
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 ml-1">E-mail</label>
              <input
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 rounded-xl h-12 px-4 text-gray-500 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 ml-1">Telefone / WhatsApp</label>
              <input
                className="w-full bg-white dark:bg-surface-dark border border-gray-200 rounded-xl h-12 px-4 focus:ring-1 focus:ring-primary outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </section>

        <div className="mt-8 px-4 flex flex-col gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full h-12 bg-white dark:bg-surface-dark border border-orange-100 text-orange-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">logout</span>
            Sair da Conta
          </button>
        </div>
      </main>

      <BottomNav active="PROFILE" onNavigate={onNavigate} />
    </div>
  );
};

export default ProfileScreen;
