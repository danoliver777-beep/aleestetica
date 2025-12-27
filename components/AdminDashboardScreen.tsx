
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import Header from './Header';
import AdminBottomNav from './AdminBottomNav';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getAllAppointments, getFinancialStats, AppointmentWithDetails, FinancialStats } from '../lib/database';

interface AdminDashboardProps {
  onNavigate: (s: Screen) => void;
}

const AdminDashboardScreen: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({ todayCount: 0, pendingCount: 0, todayRevenue: 0 });
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialStats | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
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

  const loadFinancialData = async () => {
    setFinancialLoading(true);
    try {
      const data = await getFinancialStats();
      setFinancialData(data);
      setShowFinancialModal(true);
    } catch (err) {
      console.error('Error loading financial data:', err);
    } finally {
      setFinancialLoading(false);
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
          <div
            onClick={loadFinancialData}
            className="min-w-[140px] flex-1 rounded-xl bg-white dark:bg-surface-dark p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-[120px] cursor-pointer hover:border-green-300 hover:shadow-md transition-all active:scale-95"
          >
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
                <div
                  key={app.id}
                  onClick={() => setSelectedAppointment(app)}
                  className="group relative flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                >
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

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header with Pet Image */}
            <div className="relative h-48 bg-gray-200">
              {selectedAppointment.pet?.image_url ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${selectedAppointment.pet.image_url}")` }}
                ></div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <span className="material-symbols-outlined text-6xl">pets</span>
                </div>
              )}
              <button
                onClick={() => setSelectedAppointment(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-white text-2xl font-bold leading-none mb-1">{selectedAppointment.pet?.name || 'Pet'}</h3>
                  <p className="text-white/90 text-sm font-medium">{selectedAppointment.pet?.breed || 'Raça não informada'}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Service Info */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">cut</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Serviço</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedAppointment.service?.name}</p>
                  <p className="text-primary font-bold text-sm mt-0.5">R$ {selectedAppointment.service?.price?.toFixed(2)}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Data e Hora</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm capitalize">
                    {new Date(selectedAppointment.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                    às {selectedAppointment.scheduled_time.substring(0, 5)}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Tutor</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedAppointment.profile?.full_name || 'Desconhecido'}</p>
                  <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <span className="material-symbols-outlined text-gray-400 text-sm mt-0.5">location_on</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {selectedAppointment.profile?.address || 'Endereço não cadastrado'}
                      </p>
                      {selectedAppointment.profile?.neighborhood && (
                        <p className="text-[10px] text-gray-500">{selectedAppointment.profile.neighborhood}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => {
                  setSelectedAppointment(null);
                  onNavigate('ADMIN_AGENDA');
                }}
                className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all"
              >
                <span>Ver na Agenda</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Dashboard Modal */}
      {showFinancialModal && financialData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6">
              <button
                onClick={() => setShowFinancialModal(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl">analytics</span>
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">Painel Financeiro</h3>
                  <p className="text-white/80 text-sm">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Revenue Card */}
            <div className="p-6 space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Receita do Mês</p>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  <span className="text-xl">R$</span>{financialData.currentMonthRevenue.toFixed(2)}
                </p>
                {financialData.lastMonthRevenue > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {financialData.currentMonthRevenue >= financialData.lastMonthRevenue ? (
                      <>
                        <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
                        <span className="text-xs font-medium text-green-600">
                          +{(((financialData.currentMonthRevenue - financialData.lastMonthRevenue) / financialData.lastMonthRevenue) * 100).toFixed(1)}% vs mês anterior
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-red-500 text-sm">trending_down</span>
                        <span className="text-xs font-medium text-red-600">
                          {(((financialData.currentMonthRevenue - financialData.lastMonthRevenue) / financialData.lastMonthRevenue) * 100).toFixed(1)}% vs mês anterior
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-500 text-lg">calendar_month</span>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Agendamentos</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{financialData.currentMonthAppointments}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-purple-500 text-lg">task_alt</span>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Concluídos</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{financialData.completedAppointments}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowFinancialModal(false)}
                className="w-full h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardScreen;
