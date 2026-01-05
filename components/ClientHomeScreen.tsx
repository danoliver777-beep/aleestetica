
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { getPets, getServices, getProfile, getAppointments, getNotifications, markNotificationRead, Pet, Service, Profile, Notification as DBNotification } from '../lib/database';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'appointment' | 'promo' | 'reminder' | 'info';
}

interface ClientHomeProps {
  onNavigate: (s: Screen, pet?: Pet) => void;
  onSelectService: (s: any) => void;
}

const ClientHomeScreen: React.FC<ClientHomeProps> = ({ onNavigate, onSelectService }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileData, petsData, servicesData, appointmentsData, dbNotificationsData] = await Promise.all([
        getProfile(user.id),
        getPets(user.id),
        getServices(),
        getAppointments(user.id),
        getNotifications(user.id)
      ]);
      setProfile(profileData);
      setPets(petsData);
      setServices(servicesData);

      // Generate notifications from appointments
      const generatedNotifications: Notification[] = [];

      // Welcome notification
      generatedNotifications.push({
        id: 'welcome',
        type: 'info',
        title: 'Bem-vindo à Alessandro Estética Animal!',
        message: 'Estamos felizes em ter você conosco. Explore nossos serviços e agende seu primeiro atendimento.',
        date: new Date(),
        read: false
      });

      // Add actual notifications from DB
      (dbNotificationsData || []).forEach(dn => {
        generatedNotifications.push({
          id: dn.id,
          type: dn.type as any,
          title: dn.title,
          message: dn.message,
          date: new Date(dn.created_at),
          read: dn.read
        });
      });

      // Appointment notifications
      appointmentsData.forEach((apt) => {
        const aptDate = new Date(apt.scheduled_date + 'T' + apt.scheduled_time);
        const now = new Date();
        const diffDays = Math.ceil((aptDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (apt.status === 'PENDING') {
          generatedNotifications.push({
            id: `apt-pending-${apt.id}`,
            type: 'appointment',
            title: 'Agendamento Pendente',
            message: `Seu agendamento de ${apt.service?.name || 'serviço'} está aguardando confirmação para ${apt.scheduled_date} às ${apt.scheduled_time}.`,
            date: new Date(apt.created_at),
            read: false
          });
        } else if (apt.status === 'CONFIRMED' && diffDays <= 1 && diffDays >= 0) {
          generatedNotifications.push({
            id: `apt-reminder-${apt.id}`,
            type: 'reminder',
            title: '⏰ Lembrete de Agendamento',
            message: `Não esqueça! Você tem ${apt.service?.name || 'um serviço'} agendado para ${diffDays === 0 ? 'hoje' : 'amanhã'} às ${apt.scheduled_time}.`,
            date: new Date(apt.created_at),
            read: false
          });
        } else if (apt.status === 'CONFIRMED') {
          generatedNotifications.push({
            id: `apt-confirmed-${apt.id}`,
            type: 'appointment',
            title: '✅ Agendamento Confirmado',
            message: `Seu agendamento de ${apt.service?.name || 'serviço'} foi confirmado para ${apt.scheduled_date} às ${apt.scheduled_time}.`,
            date: new Date(apt.created_at),
            read: false
          });
        }
      });

      setNotifications(generatedNotifications);
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => signOut()}
              className="flex size-10 items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500 mr-1"
              title="Sair"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full border-2 border-white dark:border-[#1A202C] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}</span>
                </span>
              )}
            </button>
          </div>
        }
      />

      <main>
        {/* Pets Section */}
        <section className="mt-6">
          <h2 className="text-[20px] font-bold px-4 mb-4">Para seu Pet</h2>
          <div className="flex w-full overflow-x-auto px-4 gap-4 no-scrollbar">
            {pets.map(pet => (
              <div
                key={pet.id}
                className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group"
                onClick={() => onNavigate('PET_REGISTRATION', pet)}
              >
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
                {profile?.neighborhood && (
                  <p className="text-[9px] text-gray-400 text-center truncate w-full -mt-1">{profile.neighborhood}</p>
                )}
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

      {/* WhatsApp FAB */}
      <a
        href="https://wa.me/557998938044"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-40 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#20bd5a] transition-all hover:scale-105 active:scale-95 animate-in zoom-in duration-300"
        aria-label="Falar no WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <BottomNav active="HOME" onNavigate={onNavigate} />

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowNotifications(false)}>
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl max-h-[80vh] overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notificações</h2>
              <div className="flex items-center gap-2">
                {notifications.filter(n => !n.read).length > 0 && (
                  <button
                    onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-5xl mb-2">notifications_off</span>
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={async () => {
                      if (!notification.read && notification.id !== 'welcome') {
                        try {
                          await markNotificationRead(notification.id);
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${notification.read
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon based on notification type */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'appointment' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' :
                        notification.type === 'promo' ? 'bg-green-100 dark:bg-green-900/50 text-green-600' :
                          notification.type === 'reminder' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600' :
                            'bg-purple-100 dark:bg-purple-900/50 text-purple-600'
                        }`}>
                        <span className="material-symbols-outlined text-xl">
                          {notification.type === 'appointment' ? 'calendar_month' :
                            notification.type === 'promo' ? 'local_offer' :
                              notification.type === 'reminder' ? 'alarm' :
                                'info'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-semibold text-sm ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                            }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {notification.date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientHomeScreen;
