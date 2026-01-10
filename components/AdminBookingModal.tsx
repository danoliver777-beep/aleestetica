import React, { useState, useEffect } from 'react';
import {
    getAllProfiles,
    getPets,
    getServices,
    createAppointment,
    checkMultipleTimeConflicts,
    Profile,
    Pet,
    Service
} from '../lib/database';

interface AdminBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialDate?: string;
    initialTime?: string;
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialDate,
    initialTime
}) => {
    // Data States
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Selection States
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [selectedPetId, setSelectedPetId] = useState<string>('');
    const [selectedAdminServices, setSelectedAdminServices] = useState<{ id: string; name: string; price: number; subtypeName: string | null }[]>([]);

    // Schedule States
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState('09:00');

    // Recurrence States
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');
    const [recurrenceCount, setRecurrenceCount] = useState(1);

    // UI States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            if (initialDate) {
                setDate(initialDate);
            } else {
                // Default date tomorrow
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setDate(tomorrow.toISOString().split('T')[0]);
            }
            if (initialTime) setTime(initialTime);
        }
    }, [isOpen, initialDate, initialTime]);

    // Load pets when profile changes
    useEffect(() => {
        if (selectedProfileId) {
            loadPets(selectedProfileId);
        } else {
            setPets([]);
            setSelectedPetId('');
        }
    }, [selectedProfileId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [profilesData, servicesData] = await Promise.all([
                getAllProfiles(),
                getServices()
            ]);
            setProfiles(profilesData);
            setServices(servicesData);
        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadPets = async (userId: string) => {
        setPets([]);
        setSelectedPetId('');
        try {
            const data = await getPets(userId);
            setPets(data);
            if (data.length > 0) setSelectedPetId(data[0].id);
        } catch (err) {
            console.error('Error loading pets:', err);
        }
    };

    const calculateDates = () => {
        const dates: string[] = [];
        // Use local parts to avoid timezone shift
        const [year, month, day] = date.split('-').map(Number);
        const baseDate = new Date(year, month - 1, day);

        // First Appointment
        dates.push(date);

        if (isRecurring && recurrenceCount > 1) {
            for (let i = 1; i < recurrenceCount; i++) {
                const nextDate = new Date(baseDate);

                if (recurrenceType === 'WEEKLY') {
                    nextDate.setDate(baseDate.getDate() + (7 * i));
                } else if (recurrenceType === 'BIWEEKLY') {
                    nextDate.setDate(baseDate.getDate() + (14 * i));
                } else if (recurrenceType === 'MONTHLY') {
                    nextDate.setMonth(baseDate.getMonth() + i);
                }

                // Format back to YYYY-MM-DD
                const y = nextDate.getFullYear();
                const m = String(nextDate.getMonth() + 1).padStart(2, '0');
                const d = String(nextDate.getDate()).padStart(2, '0');
                dates.push(`${y}-${m}-${d}`);
            }
        }
        return dates;
    };

    const handleSave = async () => {
        if (!selectedProfileId || !selectedPetId || selectedAdminServices.length === 0 || !date || !time) {
            alert('Por favor, selecione cliente, pet, ao menos um serviço, data e hora.');
            return;
        }

        setSaving(true);
        try {
            const datesToSchedule = calculateDates();

            // ====== VERIFICAÇÃO DE CONFLITOS ======
            const conflictingDates = await checkMultipleTimeConflicts(datesToSchedule, time);

            if (conflictingDates.length > 0) {
                const formattedDates = conflictingDates.map(d => {
                    const dt = new Date(d + 'T00:00:00');
                    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
                }).join(', ');

                const proceed = confirm(
                    `⚠️ CONFLITO DE HORÁRIO DETECTADO!\n\n` +
                    `Já existem agendamentos para as seguintes datas às ${time}:\n` +
                    `${formattedDates}\n\n` +
                    `Deseja continuar mesmo assim? Os agendamentos em conflito serão ignorados.`
                );

                if (!proceed) {
                    setSaving(false);
                    return;
                }

                // Remove datas com conflito
                const safeDates = datesToSchedule.filter(d => !conflictingDates.includes(d));

                if (safeDates.length === 0) {
                    alert('Todos os horários selecionados já estão ocupados. Escolha outro horário.');
                    setSaving(false);
                    return;
                }

                // Criar apenas os agendamentos sem conflito
                const totalPrice = selectedAdminServices.reduce((sum, s) => sum + s.price, 0);
                let noteContent = `Serviços Selecionados (Admin):\n`;
                selectedAdminServices.forEach(s => {
                    noteContent += `- ${s.name}${s.subtypeName ? ` (${s.subtypeName})` : ''}: R$ ${s.price.toFixed(2)}\n`;
                });
                noteContent += `\nValor Total: R$ ${totalPrice.toFixed(2)}`;

                const promises = safeDates.map(scheduleDate =>
                    createAppointment({
                        user_id: selectedProfileId,
                        pet_id: selectedPetId,
                        service_id: selectedAdminServices[0].id,
                        scheduled_date: scheduleDate,
                        scheduled_time: time,
                        notes: noteContent.trim()
                    })
                );

                await Promise.all(promises);
                alert(`${safeDates.length} agendamento(s) criado(s) com sucesso! (${conflictingDates.length} conflito(s) ignorado(s))`);
            } else {
                // Sem conflitos - criar todos
                const totalPrice = selectedAdminServices.reduce((sum, s) => sum + s.price, 0);
                let noteContent = `Serviços Selecionados (Admin):\n`;
                selectedAdminServices.forEach(s => {
                    noteContent += `- ${s.name}${s.subtypeName ? ` (${s.subtypeName})` : ''}: R$ ${s.price.toFixed(2)}\n`;
                });
                noteContent += `\nValor Total: R$ ${totalPrice.toFixed(2)}`;

                const promises = datesToSchedule.map(scheduleDate =>
                    createAppointment({
                        user_id: selectedProfileId,
                        pet_id: selectedPetId,
                        service_id: selectedAdminServices[0].id,
                        scheduled_date: scheduleDate,
                        scheduled_time: time,
                        notes: noteContent.trim()
                    })
                );

                await Promise.all(promises);
                alert(`${datesToSchedule.length} agendamento(s) criado(s) com sucesso!`);
            }

            onSuccess();
            onClose();

            // Reset form
            setSelectedProfileId('');
            setSelectedPetId('');
            setSelectedAdminServices([]);
            setIsRecurring(false);
            setRecurrenceCount(1);
        } catch (err) {
            console.error('Error creating appointments:', err);
            alert('Erro ao criar agendamentos. Verifique o console.');
        } finally {
            setSaving(false);
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 bg-primary text-white flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold">Novo Agendamento</h2>
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
                            {/* 1. Cliente */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    1. Selecione o Cliente
                                </label>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedProfileId('');
                                        setPets([]);
                                        setSelectedPetId('');
                                    }}
                                    className="w-full mb-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <select
                                    value={selectedProfileId}
                                    onChange={(e) => setSelectedProfileId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                                    size={4}
                                >
                                    {filteredProfiles.map(profile => (
                                        <option key={profile.id} value={profile.id} className="p-2">
                                            {profile.full_name || 'Sem nome'} ({profile.neighborhood || 'Sem bairro'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Pet */}
                            {selectedProfileId && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        2. Selecione o Pet
                                    </label>
                                    {pets.length === 0 ? (
                                        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">Este cliente não possui pets cadastrados.</p>
                                    ) : (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {pets.map(pet => (
                                                <button
                                                    key={pet.id}
                                                    onClick={() => setSelectedPetId(pet.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors shrink-0 ${selectedPetId === pet.id
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">pets</span>
                                                    <span className="text-sm font-bold">{pet.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. Serviço */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    3. Selecione os Serviços
                                </label>
                                <div className="w-full max-h-48 overflow-y-auto p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-1">
                                    {services.map(svc => (
                                        <React.Fragment key={svc.id}>
                                            <div
                                                onClick={() => {
                                                    const isSelected = selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === null);
                                                    if (isSelected) {
                                                        setSelectedAdminServices(prev => prev.filter(s => !(s.id === svc.id && s.subtypeName === null)));
                                                    } else {
                                                        setSelectedAdminServices(prev => [...prev, { id: svc.id, name: svc.name, price: svc.price, subtypeName: null }]);
                                                    }
                                                }}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === null) ? 'bg-primary/10 border-primary border' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent border'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-sm ${selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === null) ? 'text-primary' : 'text-gray-300'}`}>
                                                        {selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === null) ? 'check_box' : 'check_box_outline_blank'}
                                                    </span>
                                                    <span className="text-sm font-medium">{svc.name}</span>
                                                </div>
                                                <span className="text-xs font-bold text-primary">R$ {svc.price.toFixed(2)}</span>
                                            </div>
                                            {svc.subtypes && svc.subtypes.map((st, i) => (
                                                <div
                                                    key={`${svc.id}-${i}`}
                                                    onClick={() => {
                                                        const isSelected = selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === st.name);
                                                        if (isSelected) {
                                                            setSelectedAdminServices(prev => prev.filter(s => !(s.id === svc.id && s.subtypeName === st.name)));
                                                        } else {
                                                            setSelectedAdminServices(prev => [...prev, { id: svc.id, name: `${svc.name} (${st.name})`, price: st.price, subtypeName: st.name }]);
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between p-2 ml-4 rounded-lg cursor-pointer transition-colors ${selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === st.name) ? 'bg-primary/10 border-primary border' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent border'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`material-symbols-outlined text-sm ${selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === st.name) ? 'text-primary' : 'text-gray-300'}`}>
                                                            {selectedAdminServices.some(s => s.id === svc.id && s.subtypeName === st.name) ? 'check_box' : 'check_box_outline_blank'}
                                                        </span>
                                                        <span className="text-xs font-medium">↳ {st.name}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-primary">R$ {st.price.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </div>
                                {selectedAdminServices.length > 0 && (
                                    <div className="mt-2 text-right">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Total: </span>
                                        <span className="text-sm font-black text-primary">R$ {selectedAdminServices.reduce((sum, s) => sum + s.price, 0).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* 4. Data e Hora */}
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

                            {/* 5. Recorrência */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id="recurrence"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="recurrence" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                        Repetir Agendamento?
                                    </label>
                                </div>

                                {isRecurring && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Frequência</label>
                                            <div className="flex gap-2">
                                                {(['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setRecurrenceType(type)}
                                                        className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors ${recurrenceType === type
                                                            ? 'bg-primary text-white'
                                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {type === 'WEEKLY' ? 'Semanal' : type === 'BIWEEKLY' ? 'Quinzenal' : 'Mensal'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Quantidade de Agendamentos
                                            </label>
                                            <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
                                                <button
                                                    type="button"
                                                    onClick={() => setRecurrenceCount(prev => Math.max(1, prev - 1))}
                                                    className="size-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                                                >
                                                    <span className="material-symbols-outlined">remove</span>
                                                </button>
                                                <div className="flex-1 text-center font-bold text-lg select-none">
                                                    {recurrenceCount}x
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setRecurrenceCount(prev => Math.min(12, prev + 1))}
                                                    className="size-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                                                >
                                                    <span className="material-symbols-outlined">add</span>
                                                </button>
                                            </div>
                                        </div>

                                        {recurrenceCount > 1 && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Próximas datas:</p>
                                                <div className="flex flex-wrap gap-2 text-[10px] text-blue-600 dark:text-blue-300 font-medium">
                                                    {calculateDates().slice(0, 4).map((d, idx) => (
                                                        <span key={d} className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                                                            {idx === 0 ? 'Hoje: ' : ''}{new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                    ))}
                                                    {recurrenceCount > 4 && <span>...</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedPetId || selectedAdminServices.length === 0}
                        className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">event_available</span>
                                Agendar {isRecurring && `(${recurrenceCount}x)`}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminBookingModal;
