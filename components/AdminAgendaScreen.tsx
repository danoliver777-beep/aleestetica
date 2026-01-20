import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import AdminBottomNav from './AdminBottomNav';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment, AppointmentWithDetails } from '../lib/database';
import AdminBookingModal from './AdminBookingModal';
import AdminCalendarView from './AdminCalendarView';

interface AdminAgendaProps {
  onNavigate: (s: Screen, appointment?: AppointmentWithDetails) => void;
}

const AdminAgendaScreen: React.FC<AdminAgendaProps> = ({ onNavigate }) => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [calendarAppointments, setCalendarAppointments] = useState<AppointmentWithDetails[]>([]);
  const [openedFromCalendar, setOpenedFromCalendar] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAllAppointments(selectedDate);
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCalendar = async () => {
    setLoading(true);
    try {
      // Load ALL appointments for calendar view
      const allData = await getAllAppointments();
      setCalendarAppointments(allData);
      setShowCalendarView(true);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, newStatus);
      loadAppointments();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status');
    }
  };

  const handleDelete = async (appointment: AppointmentWithDetails) => {
    const petName = appointment.pet?.name || 'Pet';
    if (!confirm(`Tem certeza que deseja excluir o agendamento de ${petName}?`)) {
      return;
    }

    try {
      await deleteAppointment(appointment.id);
      setAppointments(appointments.filter(a => a.id !== appointment.id));
      alert('Agendamento excluído com sucesso!');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Erro ao excluir agendamento');
    }
  };

  const handleEdit = (appointment: AppointmentWithDetails) => {
    // Navigate to booking with appointment data for editing
    onNavigate('BOOKING' as Screen, appointment);
  };

  const filteredAppointments = appointments.filter(app => {
    if (filter === 'ALL') return true;
    return app.status === filter;
  });

  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'border-l-green-500';
      case 'PENDING': return 'border-l-orange-500';
      case 'COMPLETED': return 'border-l-blue-500';
      case 'CANCELED': return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'PENDING': return 'bg-orange-50 text-orange-700 ring-orange-600/20';
      case 'COMPLETED': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
      case 'CANCELED': return 'bg-red-50 text-red-700 ring-red-600/20';
      default: return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'PENDING': return 'Pendente';
      case 'COMPLETED': return 'Concluído';
      case 'CANCELED': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 animate-in slide-in-from-right duration-300">
      <header className="sticky top-0 z-20 bg-white dark:bg-surface-dark px-4 py-3 shadow-sm border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('ADMIN_DASHBOARD')} className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-tight">Agenda</h1>
            <span className="text-[10px] font-medium text-primary">Painel Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCalendar}
            className="flex h-10 px-4 items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="hidden sm:inline text-xs font-bold">Visão Geral</span>
          </button>
          <button onClick={loadAppointments} className="flex size-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="p-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-primary">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? '...' : appointments.length}</p>
            <p className="text-[10px] text-slate-500">Agendamentos</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
            <p className="text-sm font-medium text-slate-600">Pendentes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{loading ? '...' : pendingCount}</p>
            <p className="text-[10px] text-slate-500">Ações necessárias</p>
          </div>
        </div>
      </section>

      {/* Date Picker */}
      <div className="px-4 py-2 flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">today</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm font-medium"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
        <button
          onClick={() => setFilter('ALL')}
          className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 ${filter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
        >
          <span className="text-sm font-medium">Todos</span>
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${filter === 'PENDING' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
        >
          <span className="text-sm font-medium">Pendentes</span>
          {pendingCount > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">{pendingCount}</span>}
        </button>
        <button
          onClick={() => setFilter('CONFIRMED')}
          className={`flex h-9 shrink-0 items-center justify-center rounded-full px-5 ${filter === 'CONFIRMED' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
        >
          <span className="text-sm font-medium">Confirmados</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="flex flex-col gap-4 px-4 pt-2 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-2">event_available</span>
            <p className="text-sm">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          filteredAppointments.map(app => (
            <div key={app.id} className={`group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all border-l-4 ${getStatusColor(app.status)}`}>
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="size-14 shrink-0 rounded-lg bg-slate-200 bg-cover bg-center overflow-hidden flex items-center justify-center">
                      {app.pet?.image_url ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${app.pet.image_url}")` }}></div>
                      ) : (
                        <span className="material-symbols-outlined text-gray-400">pets</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{app.pet?.name || 'Pet'}</h3>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-slate-500">{app.pet?.breed || ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <span>
                          Cliente: {app.profile?.full_name || 'Não informado'}
                          {app.profile?.neighborhood && <span className="text-primary font-medium ml-1">({app.profile.neighborhood})</span>}
                        </span>
                        {app.profile?.phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const phone = app.profile?.phone?.replace(/\D/g, '');
                              if (phone) window.open(`https://wa.me/55${phone}`, '_blank');
                            }}
                            className="inline-flex size-5 items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors shadow-sm ml-1"
                            title="WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                        <span className="material-symbols-outlined text-[14px]">access_time</span>
                        {app.scheduled_time ? app.scheduled_time.substring(0, 5) : 'A definir'}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-medium ring-1 ring-inset ${getStatusBadge(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                    <span className="text-sm font-bold">R$ {app.service?.price?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1">{app.service?.name}</p>
              </div>

              {/* Action Buttons */}
              {app.status === 'PENDING' && (
                <div className="flex bg-slate-50 px-4 py-2 items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2 text-xs font-bold text-white"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleStatusChange(app.id, 'CANCELED')}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white border border-red-200 px-3 py-2 text-xs font-bold text-red-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Recusar
                  </button>
                  <button
                    onClick={() => handleEdit(app)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              )}
              {app.status === 'CONFIRMED' && (
                <div className="flex bg-slate-50 px-4 py-2 items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white"
                  >
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    Marcar Concluído
                  </button>
                  <button
                    onClick={() => handleEdit(app)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(app)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-white border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AdminBottomNav active="ADMIN_AGENDA" onNavigate={onNavigate} />

      {/* Floating Action Button for New Appointment */}
      <button
        onClick={() => setShowBookingModal(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-dark transition-all active:scale-95 z-30"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* New Appointment Modal */}
      <AdminBookingModal
        isOpen={showBookingModal}
        initialDate={selectedDate}
        initialTime={selectedTime}
        onClose={() => {
          setShowBookingModal(false);
          if (openedFromCalendar) {
            setOpenedFromCalendar(false);
            setShowCalendarView(true);
          }
        }}
        onSuccess={async () => {
          loadAppointments();
          // Refresh calendar data if we came from there
          if (openedFromCalendar) {
            const allData = await getAllAppointments();
            setCalendarAppointments(allData);
          }
        }}
      />

      {/* Full Screen Calendar View */}
      <AdminCalendarView
        isOpen={showCalendarView}
        onClose={() => setShowCalendarView(false)}
        appointments={calendarAppointments}
        onRefresh={async () => {
          // Reload all appointments for calendar
          const allData = await getAllAppointments();
          setCalendarAppointments(allData);
        }}
        onCreateAppointment={(date, time) => {
          // Remember we came from calendar and open booking modal
          setOpenedFromCalendar(true);
          setShowCalendarView(false);
          setSelectedDate(date);
          setSelectedTime(time);
          setShowBookingModal(true);
        }}
      />
    </div >
  );
};

export default AdminAgendaScreen;
