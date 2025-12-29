import React, { useState, useEffect } from 'react';
import {
    getAllProfiles,
    getPets,
    getServices,
    createAppointment,
    Profile,
    Pet,
    Service
} from '../lib/database';

interface AdminBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AdminBookingModal: React.FC<AdminBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
    // Data States
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Selection States
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [selectedPetId, setSelectedPetId] = useState<string>('');
    const [selectedServiceId, setSelectedServiceId] = useState<string>('');

    // Schedule States
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState('09:00');

    // Recurrence States
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');
    const [recurrenceCount, setRecurrenceCount] = useState(1);

    // UI States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            // Default date tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDate(tomorrow.toISOString().split('T')[0]);
        }
    }, [isOpen]);

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
        let currentDate = new Date(date + 'T00:00:00');

        // First Appointment
        dates.push(currentDate.toISOString().split('T')[0]);

        if (isRecurring && recurrenceCount > 1) {
            for (let i = 1; i < recurrenceCount; i++) {
                const nextDate = new Date(currentDate);

                if (recurrenceType === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + (7 * i));
                } else if (recurrenceType === 'MONTHLY') {
                    nextDate.setMonth(nextDate.getMonth() + i);
                } else if (recurrenceType === 'YEARLY') {
                    nextDate.setFullYear(nextDate.getFullYear() + i);
                }

                dates.push(nextDate.toISOString().split('T')[0]);
            }
        }
        return dates;
    };

    const handleSave = async () => {
        if (!selectedProfileId || !selectedPetId || !selectedServiceId || !date || !time) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setSaving(true);
        try {
            const datesToSchedule = calculateDates();

            const promises = datesToSchedule.map(scheduleDate =>
                createAppointment({
                    user_id: selectedProfileId,
                    pet_id: selectedPetId,
                    service_id: selectedServiceId,
                    scheduled_date: scheduleDate,
                    scheduled_time: time,
                    notes: 'Agendado pelo Administrador'
                })
            );

            await Promise.all(promises);

            alert(`${datesToSchedule.length} agendamento(s) criado(s) com sucesso!`);
            onSuccess();
            onClose();

            // Reset form
            setSelectedProfileId('');
            setSelectedPetId('');
            setSelectedServiceId('');
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
        p.phone?.includes(searchTerm)
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
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                            {profile.full_name || 'Sem nome'} ({profile.phone || 'Sem telefone'})
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
                                    3. Selecione o Serviço
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
                                    <div className="space-y-3 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">Frequência</label>
                                            <div className="flex gap-2">
                                                {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setRecurrenceType(type)}
                                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${recurrenceType === type
                                                                ? 'bg-primary text-white'
                                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {type === 'WEEKLY' ? 'Semanal' : type === 'MONTHLY' ? 'Mensal' : 'Anual'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                                Repetições (Total de agendamentos)
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="2"
                                                    max="12"
                                                    value={recurrenceCount}
                                                    onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                                                    className="flex-1 accent-primary"
                                                />
                                                <span className="w-8 text-center font-bold text-primary">{recurrenceCount}x</span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Serão criados {recurrenceCount} agendamentos.
                                            </p>
                                        </div>
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
                        disabled={saving || !selectedPetId || !selectedServiceId}
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
