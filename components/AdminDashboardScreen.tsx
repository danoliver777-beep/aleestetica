
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import Header from './Header';
import AdminBottomNav from './AdminBottomNav';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAllAppointments, AppointmentWithDetails } from '../lib/database';

interface AdminDashboardProps {
  onNavigate: (s: Screen) => void;
}

const AdminDashboardScreen: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ todayCount: 0, pendingCount: 0, todayRevenue: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch stats and ALL upcoming appointments (no date filter)
      const [statsData, appointmentsData] = await Promise.all([
        getAdminStats(),
        getAllAppointments() // Remove date filter to get all appointments
      ]);
      setStats(statsData);
      // Filter to show only future or today's appointments, sorted by date
      const today = new Date().toISOString().split('T')[0];
      const upcoming = appointmentsData
        .filter(a => a.scheduled_date >= today)
        .slice(0, 5);
      setUpcomingAppointments(upcoming);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 animate-in fade-in duration-300">
      <Header
        title={
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-surface-dark"></div>
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-sm font-bold leading-tight">Alessandro</h1>
              <p className="text-[10px] text-gray-500">Estética Animal • Admin</p>
            </div>
          </div>
        }
        rightIcon={
          <button onClick={signOut} className="text-xs font-semibold text-red-500">Sair</button>
        }
        onRightClick={signOut}
      />

      <main className="flex-1">
        <div className="px-4 pt-6 pb-2">
          <h2 className="text-2xl font-bold tracking-tight">Painel Admin</h2>
          <p className="text-gray-500 text-sm mt-1">Resumo das atividades de hoje.</p>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-4 overflow-x-auto px-4 py-4 no-scrollbar">
          <div className="min-w-[140px] flex-1 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px]">
            <div className="rounded-full bg-primary/10 p-2 text-primary w-fit">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold">{loading ? '...' : stats.todayCount}</p>
              <p className="text-[10px] font-medium text-gray-500">Hoje</p>
            </div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px]">
            <div className="flex justify-between items-start">
              <div className="rounded-full bg-orange-500/10 p-2 text-orange-500 w-fit">
                <span className="material-symbols-outlined text-[20px]">pending_actions</span>
              </div>
              {stats.pendingCount > 0 && <span className="h-2 w-2 rounded-full bg-orange-500"></span>}
            </div>
            <div>
              <p className="text-3xl font-extrabold">{loading ? '...' : stats.pendingCount}</p>
              <p className="text-[10px] font-medium text-gray-500">Pendentes</p>
            </div>
          </div>
          <div className="min-w-[140px] flex-1 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px]">
            <div className="rounded-full bg-green-500/10 p-2 text-green-600 w-fit">
              <span className="material-symbols-outlined text-[20px]">attach_money</span>
            </div>
            <div>
              <p className="text-3xl font-extrabold"><span className="text-lg align-top pt-1 inline-block">R$</span>{loading ? '...' : stats.todayRevenue.toFixed(0)}</p>
              <p className="text-[10px] font-medium text-gray-500">Receita</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2">
          <h3 className="mb-3 text-base font-bold">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('ADMIN_AGENDA')}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-primary p-4 text-white shadow-md active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[28px]">calendar_today</span>
              <span className="text-sm font-bold">Ver Agenda</span>
            </button>
            <button
              onClick={() => onNavigate('ADMIN_SERVICES')}
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 active:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[28px] text-primary">cut</span>
              <span className="text-sm font-bold">Serviços</span>
            </button>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="mt-8 bg-white dark:bg-surface-dark rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-gray-100 flex-1">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-lg font-bold">Próximos Clientes</h3>
            <button className="text-sm font-semibold text-primary" onClick={() => onNavigate('ADMIN_AGENDA')}>Ver todos</button>
          </div>
          <div className="flex flex-col px-2 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">event_available</span>
                <p className="text-sm">Nenhum agendamento pendente</p>
              </div>
            ) : (
              upcomingAppointments.map(app => (
                <div key={app.id} className="group relative flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-xl bg-gray-200 flex items-center justify-center overflow-hidden">
                      {app.pet?.image_url ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${app.pet.image_url}")` }}></div>
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">pets</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                      <span className="material-symbols-outlined text-[12px] text-blue-500">shower</span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="text-base font-bold">{app.pet?.name || 'Pet'}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${app.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                        {app.scheduled_time.substring(0, 5)}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {app.service?.name} • {app.profile?.full_name || 'Cliente'} • {new Date(app.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <AdminBottomNav active="ADMIN_DASHBOARD" onNavigate={onNavigate} />
    </div>
  );
};

export default AdminDashboardScreen;
