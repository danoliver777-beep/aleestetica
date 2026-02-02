
import React, { useState, useEffect } from 'react';
import {
    getServices,
    updateAppointment,
    checkTimeConflict,
    AppointmentWithDetails,
    Service
} from '../lib/database';

interface AdminEditBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    appointment: AppointmentWithDetails | null;
}

const AdminEditBookingModal: React.FC<AdminEditBookingModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    appointment
}) => {
    // Data States
    const [services, setServices] = useState<Service[]>([]);

    // Selection States
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    // UI States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    useEffect(() => {
        if (isOpen && appointment) {
            loadInitialData();
            setSelectedServiceId(appointment.service_id || '');
            setDate(appointment.scheduled_date);
            setTime(appointment.scheduled_time ? appointment.scheduled_time.substring(0, 5) : '09:00');
            setNotes(appointment.notes || '');
        }
    }, [isOpen, appointment]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const servicesData = await getServices();
            setServices(servicesData);
        } catch (err) {
            console.error('Error loading services:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!appointment || !selectedServiceId || !date || !time) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setSaving(true);
        try {
            // Only check for conflict if date or time changed
            const oldTime = appointment.scheduled_time ? appointment.scheduled_time.substring(0, 5) : null;
            if (date !== appointment.scheduled_date || time !== oldTime) {
                const { hasConflict } = await checkTimeConflict(date, time);
                if (hasConflict) {
                    const proceed = confirm(`⚠️ Conflito de horário detectado! Já existe um agendamento para este horário em ${date}. Deseja continuar mesmo assim?`);
                    if (!proceed) {
                        setSaving(false);
                        return;
                    }
                }
            }

            await updateAppointment(appointment.id, {
                service_id: selectedServiceId,
                scheduled_date: date,
                scheduled_time: time,
                notes: notes
            });

            alert('Agendamento atualizado com sucesso!');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error updating appointment:', err);
            alert('Erro ao atualizar agendamento.');
        } finally {
            setSaving(false);
        }
    };

    const handleWhatsApp = () => {
        if (!appointment?.profile?.phone) {
            alert('Telefone do tutor não cadastrado.');
            return;
        }
        const phone = appointment.profile.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}`, '_blank');
    };

    if (!isOpen || !appointment) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 bg-primary text-white flex justify-between items-center sticky top-0 z-10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold">Editar Agendamento</h2>
                        <span className="text-xs opacity-80">{appointment.pet?.name} • {appointment.profile?.nickname || appointment.profile?.full_name}</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {/* Pet and Owner info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="size-16 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
                                    {appointment.pet?.image_url ? (
                                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${appointment.pet.image_url}")` }}></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-3xl text-gray-400">pets</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg leading-tight">{appointment.pet?.name}</h3>
                                    <p className="text-sm text-gray-500">{appointment.pet?.breed || 'Raça não informada'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="material-symbols-outlined text-xs text-primary">person</span>
                                        <span className="text-xs font-medium">{appointment.profile?.nickname || appointment.profile?.full_name}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white hover:bg-[#20bd5a] transition-all shadow-md active:scale-90"
                                    title="Falar no WhatsApp"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Service */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Serviço
                                </label>
                                <select
                                    value={selectedServiceId}
                                    onChange={(e) => setSelectedServiceId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Selecione um serviço...</option>
                                    {services.map(svc => (
                                        <option key={svc.id} value={svc.id}>
                                            {svc.name} - R$ {svc.price.toFixed(2)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Data</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Hora</label>
                                    <select
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {times.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Observações</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Alérgico a shampoo de coco..."
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Descartar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedServiceId}
                        className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminEditBookingModal;
