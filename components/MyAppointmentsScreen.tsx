
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { getAppointments, deleteAppointment, Appointment } from '../lib/database';

interface MyAppointmentsProps {
  onNavigate: (s: Screen, appointment?: Appointment) => void;
}

const MyAppointmentsScreen: React.FC<MyAppointmentsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'future' | 'history'>('future');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAppointments(user.id);
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appointment: Appointment) => {
    const serviceName = appointment.service?.name || 'agendamento';
    if (!confirm(`Tem certeza que deseja cancelar o ${serviceName}?`)) {
      return;
    }

    try {
      await deleteAppointment(appointment.id);
      setAppointments(appointments.filter(a => a.id !== appointment.id));
      alert('Agendamento cancelado com sucesso!');
    } catch (err) {
      console.error('Error deleting appointment:', err);
      alert('Erro ao cancelar agendamento');
    }
  };

  const handleEdit = (appointment: Appointment) => {
    onNavigate('BOOKING', appointment);
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredAppointments = appointments.filter(app => {
    if (filter === 'future') {
      return app.scheduled_date >= today;
    } else {
      return app.scheduled_date < today;
    }
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-50 text-green-600 ring-green-500/20';
      case 'PENDING': return 'bg-amber-50 text-amber-600 ring-amber-500/20';
      case 'COMPLETED': return 'bg-blue-50 text-blue-600 ring-blue-500/20';
      case 'CANCELED': return 'bg-red-50 text-red-600 ring-red-500/20';
      default: return 'bg-gray-50 text-gray-600 ring-gray-500/20';
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

  const canModify = (status: string) => {
    return status === 'PENDING' || status === 'CONFIRMED';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 animate-in fade-in duration-300">
      <Header
        title="Meus Agendamentos"
        leftIcon="arrow_back_ios_new"
        onLeftClick={() => onNavigate('HOME')}
        rightIcon="refresh"
        onRightClick={loadAppointments}
      >
        <div className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setFilter('future')}
            className={`flex h-full flex-1 items-center justify-center rounded-lg text-sm font-semibold transition-all ${filter === 'future' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
          >
            Futuros
          </button>
          <button
            onClick={() => setFilter('history')}
            className={`flex h-full flex-1 items-center justify-center rounded-lg text-sm font-semibold transition-all ${filter === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500'}`}
          >
            Histórico
          </button>
        </div>
      </Header>

      <main className="flex-1 px-4 py-6 space-y-6 pb-32 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-2">calendar_add_on</span>
            <p className="text-sm text-slate-400">
              {filter === 'future' ? 'Nenhum agendamento futuro' : 'Nenhum histórico'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map(app => (
              <div key={app.id} className="group relative flex flex-col gap-3 rounded-xl bg-white dark:bg-slate-800 p-4 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                      {app.pet?.image_url ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${app.pet.image_url}")` }}></div>
                      ) : (
                        <span className="material-symbols-outlined text-gray-300 text-2xl">pets</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{app.service?.name || 'Serviço'}</h3>
                      <p className="text-sm text-slate-500">{app.pet?.name || 'Pet'} {app.pet?.breed ? `• ${app.pet.breed}` : ''}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${getStatusColor(app.status)}`}>
                    {getStatusLabel(app.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <span className="text-sm font-semibold">{formatDate(app.scheduled_date)} às {app.scheduled_time.substring(0, 5)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">R$ {app.service?.price?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {/* Edit/Delete buttons - only show for modifiable appointments */}
                {canModify(app.status) && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleEdit(app)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-50 text-primary font-semibold text-sm hover:bg-blue-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(app)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-4 pointer-events-none z-40">
        <button
          onClick={() => onNavigate('BOOKING')}
          className="pointer-events-auto w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-700 text-white p-4 shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-bold text-base">Novo Agendamento</span>
        </button>
      </div>

      <BottomNav active="MY_APPOINTMENTS" onNavigate={onNavigate} />
    </div>
  );
};

export default MyAppointmentsScreen;
