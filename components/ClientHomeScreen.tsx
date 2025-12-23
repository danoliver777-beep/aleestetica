
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { getPets, getServices, getProfile, Pet, Service, Profile } from '../lib/database';

interface ClientHomeProps {
  onNavigate: (s: Screen) => void;
  onSelectService: (s: any) => void;
}

const ClientHomeScreen: React.FC<ClientHomeProps> = ({ onNavigate, onSelectService }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileData, petsData, servicesData] = await Promise.all([
        getProfile(user.id),
        getPets(user.id),
        getServices()
      ]);
      setProfile(profileData);
      setPets(petsData);
      setServices(servicesData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="pb-20">
      <Header
        title={
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="size-10 rounded-full border-2 border-primary/20 bg-cover bg-center bg-gray-200"
                style={{ backgroundImage: profile?.avatar_url ? `url("${profile.avatar_url}")` : 'none' }}
              >
                {!profile?.avatar_url && (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-xl">person</span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-[#1A202C] rounded-full"></div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Bem-vindo de volta,</span>
              <h2 className="text-lg font-bold leading-tight text-gray-900 dark:text-white">{displayName}</h2>
            </div>
          </div>
        }
        rightIcon={
          <div className="relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border border-white"></span>
          </div>
        }
        onRightClick={() => { }}
      >
        <div className="flex w-full items-stretch rounded-xl h-12 bg-gray-100 dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-center pl-4 text-gray-400">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            className="w-full bg-transparent border-none focus:ring-0 text-sm"
            placeholder="Buscar serviços (ex: Banho, Tosa)..."
          />
        </div>
      </Header>

      <main>
        {/* Pets Section */}
        <section className="mt-6">
          <h2 className="text-[20px] font-bold px-4 mb-4">Para seu Pet</h2>
          <div className="flex w-full overflow-x-auto px-4 gap-4 no-scrollbar">
            {pets.map(pet => (
              <div key={pet.id} className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary to-blue-300">
                  <div className="bg-white dark:bg-[#1A202C] p-[2px] rounded-full">
                    {pet.image_url ? (
                      <div
                        className="w-[70px] h-[70px] rounded-full bg-cover bg-center transition-transform group-hover:scale-105"
                        style={{ backgroundImage: `url("${pet.image_url}")` }}
                      ></div>
                    ) : (
                      <div className="w-[70px] h-[70px] rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-3xl">pets</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[12px] font-medium text-center truncate w-full">{pet.name}</p>
              </div>
            ))}
            <div
              onClick={() => onNavigate('PET_REGISTRATION')}
              className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
            >
              <div className="w-[74px] h-[74px] rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 group-hover:border-primary group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[32px]">add</span>
              </div>
              <p className="text-[12px] font-medium text-center">Novo</p>
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="px-4 mt-8">
          <div className="w-full h-32 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 relative overflow-hidden flex items-center shadow-lg">
            <div className="pl-6 w-2/3 z-10">
              <p className="text-white/90 text-[10px] font-bold uppercase tracking-wider mb-1">Oferta Especial</p>
              <h3 className="text-white text-xl font-bold leading-tight mb-2">20% OFF na Hidratação</h3>
              <button
                onClick={() => onNavigate('BOOKING')}
                className="bg-white text-primary text-[10px] font-bold py-2 px-4 rounded-full"
              >
                Agendar Agora
              </button>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
          </div>
        </section>

        {/* Services Section */}
        <section className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold">Nossos Serviços</h2>
            <button className="text-primary text-sm font-semibold">Ver todos</button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum serviço disponível</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mb-8">
              {services.map(service => (
                <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                  <div className="flex gap-4">
                    <div
                      className="w-24 h-24 rounded-lg bg-cover bg-center shrink-0 bg-gray-200"
                      style={{ backgroundImage: service.image_url ? `url("${service.image_url}")` : 'none' }}
                    >
                      {!service.image_url && (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-gray-400 text-3xl">content_cut</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold leading-tight">{service.name}</h3>
                          <div className="flex items-center gap-1 text-orange-400">
                            <span className="material-symbols-outlined text-[16px] filled">star</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-200">{service.rating}</span>
                          </div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">{service.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-primary text-[16px]">schedule</span>
                        <span className="text-[10px] font-semibold text-primary">{service.duration}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-md">
                        <span className="material-symbols-outlined text-green-600 text-[16px]">payments</span>
                        <span className="text-[10px] font-semibold text-green-700">R$ {service.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectService(service)}
                      className="bg-primary hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-colors shadow-md shadow-blue-200"
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav active="HOME" onNavigate={onNavigate} />
    </div>
  );
};

export default ClientHomeScreen;
