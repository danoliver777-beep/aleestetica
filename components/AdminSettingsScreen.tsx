import React, { useState, useEffect } from 'react';
import { Screen, UserRole } from '../types';
import AdminBottomNav from './AdminBottomNav';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
    getAdminSetting,
    upsertAdminSetting,
    createNotification,
    getAllProfiles,
    upsertProfile,
    getPets,
    createPet,
    deletePet,
    updatePet,
    uploadAvatar,
    uploadPetImage,
    Profile,
    Pet,
    BusinessInfo
} from '../lib/database';

// Reusable Toggle Switch Component
interface ToggleSwitchProps {
    enabled: boolean;
    onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle }) => (
    <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-gray-300'}`}
        role="switch"
        aria-checked={enabled}
    >
        <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
    </button>
);

interface AdminSettingsProps {
    onNavigate: (s: Screen) => void;
}

type ModalType = 'notifications' | 'hours' | 'payments' | 'business' | 'help' | 'terms' | 'clients' | null;

interface DailyHours {
    open: string;
    close: string;
    enabled: boolean;
}

interface BusinessHours {
    [key: string]: DailyHours;
}

interface PaymentMethods {
    pix: boolean;
    dinheiro: boolean;
    credito: boolean;
    debito: boolean;
}

const AdminSettingsScreen: React.FC<AdminSettingsProps> = ({ onNavigate }) => {
    const { user, signOut, role } = useAuth();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [loading, setLoading] = useState(true);

    // Settings states
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [newAppointmentNotif, setNewAppointmentNotif] = useState(true);
    const [cancelNotif, setCancelNotif] = useState(true);
    const [reminderNotif, setReminderNotif] = useState(true);

    const [businessHours, setBusinessHours] = useState<BusinessHours>({
        seg: { open: '08:00', close: '18:00', enabled: true },
        ter: { open: '08:00', close: '18:00', enabled: true },
        qua: { open: '08:00', close: '18:00', enabled: true },
        qui: { open: '08:00', close: '18:00', enabled: true },
        sex: { open: '08:00', close: '18:00', enabled: true },
        sab: { open: '08:00', close: '12:00', enabled: true },
        dom: { open: '08:00', close: '12:00', enabled: false },
    });

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
        pix: true,
        dinheiro: true,
        credito: true,
        debito: true,
    });

    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
        whatsapp: '5511999999999',
        email: 'suporte@alessandropet.com'
    });

    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);

    // Client management states
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
    const [clientPets, setClientPets] = useState<Pet[]>([]);
    const [editingClient, setEditingClient] = useState<Partial<Profile>>({});
    const [newPetName, setNewPetName] = useState('');
    const [newPetBreed, setNewPetBreed] = useState('');
    const [newPetType, setNewPetType] = useState<'dog' | 'cat' | 'other'>('dog');
    const [savingClient, setSavingClient] = useState(false);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null); // 'tutor' or pet.id
    const [newPetImageUrl, setNewPetImageUrl] = useState<string | null>(null);

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const [notif, hours, payment, business] = await Promise.all([
                    getAdminSetting<{
                        enabled: boolean;
                        newApp: boolean;
                        cancel: boolean;
                        reminder: boolean;
                    }>('notifications'),
                    getAdminSetting<typeof businessHours>('business_hours'),
                    getAdminSetting<typeof paymentMethods>('payment_methods'),
                    getAdminSetting<BusinessInfo>('business_info')
                ]);

                if (notif) {
                    setNotificationsEnabled(notif.enabled);
                    setNewAppointmentNotif(notif.newApp);
                    setCancelNotif(notif.cancel);
                    setReminderNotif(notif.reminder);
                }
                if (hours) setBusinessHours(hours);
                if (payment) setPaymentMethods(payment);
                if (business) setBusinessInfo(business);
            } catch (error) {
                console.error('Error fetching admin settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const closeModal = () => setActiveModal(null);

    const saveNotifications = async () => {
        try {
            setLoading(true);
            await upsertAdminSetting('notifications', {
                enabled: notificationsEnabled,
                newApp: newAppointmentNotif,
                cancel: cancelNotif,
                reminder: reminderNotif
            });
            closeModal();
        } catch (error) {
            console.error('Error saving notifications:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    const saveHours = async () => {
        try {
            setLoading(true);
            await upsertAdminSetting('business_hours', businessHours);
            closeModal();
        } catch (error) {
            console.error('Error saving hours:', error);
            alert('Erro ao salvar horários');
        } finally {
            setLoading(false);
        }
    };

    const savePayments = async () => {
        try {
            setLoading(true);
            await upsertAdminSetting('payment_methods', paymentMethods);
            closeModal();
        } catch (error) {
            console.error('Error saving payments:', error);
            alert('Erro ao salvar formas de pagamento');
        } finally {
            setLoading(false);
        }
    };

    const saveBusinessInfo = async () => {
        try {
            setLoading(true);
            await upsertAdminSetting('business_info', businessInfo);
            closeModal();
        } catch (error) {
            console.error('Error saving business info:', error);
            alert('Erro ao salvar informações do estabelecimento');
        } finally {
            setLoading(false);
        }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
            alert('Por favor, preencha o título e a mensagem');
            return;
        }

        setSendingBroadcast(true);
        try {
            await createNotification({
                user_id: null, // Broadcast to all
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim(),
                type: 'promo'
            });
            alert('Notificação enviada com sucesso para todos os clientes!');
            setBroadcastTitle('');
            setBroadcastMessage('');
        } catch (error) {
            console.error('Error sending broadcast:', error);
            alert('Erro ao enviar notificação');
        } finally {
            setSendingBroadcast(false);
        }
    };

    const toggleDay = (day: keyof typeof businessHours) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    const updateHours = (day: keyof typeof businessHours, field: 'open' | 'close', value: string) => {
        setBusinessHours(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    // Client management functions
    const openClientsModal = async () => {
        setActiveModal('clients');
        setSelectedClient(null);
        setClientSearchTerm('');
        try {
            const profiles = await getAllProfiles();
            setAllProfiles(profiles);
        } catch (error) {
            console.error('Error loading profiles:', error);
        }
    };

    const selectClient = async (profile: Profile) => {
        setSelectedClient(profile);
        setEditingClient({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
            address: profile.address || '',
            neighborhood: profile.neighborhood || ''
        });
        try {
            const pets = await getPets(profile.id);
            setClientPets(pets);
        } catch (error) {
            console.error('Error loading pets:', error);
        }
    };

    const handleTutorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setUploadingImage('tutor');
        try {
            const url = await uploadAvatar(selectedClient.id, file);
            if (url) {
                setEditingClient(prev => ({ ...prev, avatar_url: url }));
            }
        } catch (error) {
            console.error('Error uploading tutor image:', error);
            alert('Erro ao enviar foto do tutor');
        } finally {
            setUploadingImage(null);
        }
    };

    const handlePetImageUpload = async (petId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setUploadingImage(petId);
        try {
            const url = await uploadPetImage(selectedClient.id, petId, file);
            if (url) {
                await updatePet(petId, { image_url: url });
                setClientPets(prev => prev.map(p => p.id === petId ? { ...p, image_url: url } : p));
            }
        } catch (error) {
            console.error('Error uploading pet image:', error);
            alert('Erro ao enviar foto do pet');
        } finally {
            setUploadingImage(null);
        }
    };

    const handleNewPetImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedClient) return;

        setUploadingImage('new-pet');
        try {
            // Since we don't have a pet ID yet, we'll use a temporary upload or store the file
            // For simplicity and consistency with current DB structure, let's use a random ID or handle it during creation
            // Alternatively, we can use a generic path and rename later, but let's just use a timestamp for the filename
            const fileName = `${selectedClient.id}/temp_${Date.now()}`;
            const { data: uploadData, error: uploadError } = await (supabase.storage.from('pets') as any).upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('pets').getPublicUrl(fileName);
            setNewPetImageUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading new pet image:', error);
            alert('Erro ao enviar foto do pet');
        } finally {
            setUploadingImage(null);
        }
    };

    const saveClientChanges = async () => {
        if (!selectedClient) return;
        setSavingClient(true);
        try {
            await upsertProfile({
                id: selectedClient.id,
                ...editingClient
            });
            // Refresh the profile in state
            const updatedProfiles = allProfiles.map(p =>
                p.id === selectedClient.id ? { ...p, ...editingClient } : p
            );
            setAllProfiles(updatedProfiles);
            setSelectedClient({ ...selectedClient, ...editingClient } as Profile);
            alert('Cliente atualizado com sucesso!');
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Erro ao salvar cliente');
        } finally {
            setSavingClient(false);
        }
    };

    const handleAddPet = async () => {
        if (!selectedClient || !newPetName.trim()) {
            alert('Por favor, insira o nome do pet');
            return;
        }
        try {
            const newPet = await createPet({
                user_id: selectedClient.id,
                name: newPetName.trim(),
                breed: newPetBreed.trim() || null,
                age: null,
                type: newPetType,
                image_url: newPetImageUrl
            });
            setClientPets(prev => [...prev, newPet]);
            setNewPetName('');
            setNewPetBreed('');
            setNewPetType('dog');
            setNewPetImageUrl(null);
        } catch (error) {
            console.error('Error adding pet:', error);
            alert('Erro ao adicionar pet');
        }
    };

    const handleDeletePet = async (petId: string) => {
        if (!confirm('Tem certeza que deseja excluir este pet?')) return;
        try {
            await deletePet(petId);
            setClientPets(prev => prev.filter(p => p.id !== petId));
        } catch (error) {
            console.error('Error deleting pet:', error);
            alert('Erro ao excluir pet');
        }
    };

    const filteredClients = allProfiles.filter(p =>
        p.full_name?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        p.neighborhood?.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

    const dayLabels: Record<string, string> = {
        seg: 'Segunda', ter: 'Terça', qua: 'Quarta',
        qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo'
    };

    return (
        <div className="flex flex-col min-h-screen pb-24 animate-in fade-in duration-300 bg-gray-50">
            <Header
                title="Ajustes"
                rightIcon={
                    <button onClick={signOut} className="text-xs font-semibold text-primary">Sair</button>
                }
            />

            <main className="flex-1 px-4 pt-6 overflow-y-auto">
                <div className="space-y-4">
                    <section className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 mb-4">Conta</h3>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">
                                    {role === UserRole.ADMIN ? 'shield_person' : 'badge'}
                                </span>
                            </div>
                            <div>
                                <p className="font-bold">{role === UserRole.ADMIN ? 'Administrador' : 'Funcionário Staff'}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                        </div>
                    </section>

                    {/* Configurações do App */}
                    <section className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 mb-4">Configurações</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveModal('notifications')}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">notifications</span>
                                    <span className="font-medium">Notificações</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('hours')}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">schedule</span>
                                    <span className="font-medium">Horários de Funcionamento</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('payments')}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">payments</span>
                                    <span className="font-medium">Formas de Pagamento</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('business')}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">store</span>
                                    <span className="font-medium">Informações do Estabelecimento</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                            <button
                                onClick={openClientsModal}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">group</span>
                                    <span className="font-medium">Gerenciar Clientes</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                        </div>
                    </section>

                    {/* Comunicação com Clientes */}
                    <section className="bg-white rounded-2xl p-4 shadow-sm border border-primary/20 bg-primary/[0.02]">
                        <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">campaign</span>
                            Enviar Notificação Geral
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Título do Comunicado</label>
                                <input
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                    placeholder="Ex: 🎉 Promoção de Verão!"
                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mensagem</label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    placeholder="Descreva o comunicado para seus clientes..."
                                    rows={3}
                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-sm resize-none"
                                />
                            </div>
                            <button
                                onClick={handleSendBroadcast}
                                disabled={sendingBroadcast || !broadcastTitle || !broadcastMessage}
                                className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {sendingBroadcast ? (
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">send</span>
                                        Disparar Comunicado
                                    </>
                                )}
                            </button>
                        </div>
                    </section>

                    {/* Informações */}
                    <section className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 mb-4">Sobre</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-4">
                                <span className="font-medium text-gray-600">Versão do App</span>
                                <span className="text-primary font-semibold">1.0.0</span>
                            </div>
                            <button
                                onClick={() => setActiveModal('help')}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">help</span>
                                    <span className="font-medium">Ajuda e Suporte</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                            <button
                                onClick={() => setActiveModal('terms')}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-400">description</span>
                                    <span className="font-medium">Termos de Uso</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                            </button>
                        </div>
                    </section>

                    {/* Logout */}
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-500 rounded-2xl font-bold mt-4 hover:bg-red-100 transition-colors"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sair da Conta
                    </button>
                </div>
            </main>

            {/* Modal Overlay */}
            {activeModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center animate-in fade-in duration-200" onClick={closeModal}>
                    <div
                        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-28 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Notifications Modal */}
                        {activeModal === 'notifications' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Notificações</h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold">Ativar Notificações</p>
                                            <p className="text-xs text-gray-500">Receber todas as notificações</p>
                                        </div>
                                        <ToggleSwitch enabled={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold">Novos Agendamentos</p>
                                            <p className="text-xs text-gray-500">Avisar quando um cliente agendar</p>
                                        </div>
                                        <ToggleSwitch enabled={newAppointmentNotif} onToggle={() => setNewAppointmentNotif(!newAppointmentNotif)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold">Cancelamentos</p>
                                            <p className="text-xs text-gray-500">Avisar quando um agendamento for cancelado</p>
                                        </div>
                                        <ToggleSwitch enabled={cancelNotif} onToggle={() => setCancelNotif(!cancelNotif)} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-semibold">Lembretes</p>
                                            <p className="text-xs text-gray-500">Lembrete de agendamentos do dia</p>
                                        </div>
                                        <ToggleSwitch enabled={reminderNotif} onToggle={() => setReminderNotif(!reminderNotif)} />
                                    </div>
                                </div>
                                <button
                                    onClick={saveNotifications}
                                    disabled={loading}
                                    className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                                </button>
                            </>
                        )}

                        {/* Business Hours Modal */}
                        {activeModal === 'hours' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Horários de Funcionamento</h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(Object.entries(businessHours) as [string, DailyHours][]).map(([day, hours]) => (
                                        <div key={day} className={`p-4 rounded-xl transition-colors ${hours.enabled ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-semibold">{dayLabels[day]}</span>
                                                <ToggleSwitch enabled={hours.enabled} onToggle={() => toggleDay(day as keyof typeof businessHours)} />
                                            </div>
                                            {hours.enabled && (
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={e => updateHours(day as keyof typeof businessHours, 'open', e.target.value)}
                                                        className="flex-1 p-2 border rounded-lg text-sm"
                                                    />
                                                    <span className="text-gray-400">até</span>
                                                    <input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={e => updateHours(day as keyof typeof businessHours, 'close', e.target.value)}
                                                        className="flex-1 p-2 border rounded-lg text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={saveHours}
                                    disabled={loading}
                                    className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Horários'}
                                </button>
                            </>
                        )}

                        {/* Payment Methods Modal */}
                        {activeModal === 'payments' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Formas de Pagamento</h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Selecione as formas de pagamento que você aceita:</p>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-500">pix</span>
                                            <span className="font-semibold">PIX</span>
                                        </div>
                                        <ToggleSwitch enabled={paymentMethods.pix} onToggle={() => setPaymentMethods(prev => ({ ...prev, pix: !prev.pix }))} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-green-600">payments</span>
                                            <span className="font-semibold">Dinheiro</span>
                                        </div>
                                        <ToggleSwitch enabled={paymentMethods.dinheiro} onToggle={() => setPaymentMethods(prev => ({ ...prev, dinheiro: !prev.dinheiro }))} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-blue-500">credit_card</span>
                                            <span className="font-semibold">Cartão de Crédito</span>
                                        </div>
                                        <ToggleSwitch enabled={paymentMethods.credito} onToggle={() => setPaymentMethods(prev => ({ ...prev, credito: !prev.credito }))} />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-orange-500">credit_card</span>
                                            <span className="font-semibold">Cartão de Débito</span>
                                        </div>
                                        <ToggleSwitch enabled={paymentMethods.debito} onToggle={() => setPaymentMethods(prev => ({ ...prev, debito: !prev.debito }))} />
                                    </div>
                                </div>
                                <button
                                    onClick={savePayments}
                                    disabled={loading}
                                    className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </>
                        )}

                        {/* Business Info Modal */}
                        {activeModal === 'business' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Informações do Estabelecimento</h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">WhatsApp de Atendimento</label>
                                        <input
                                            type="tel"
                                            value={businessInfo.whatsapp}
                                            onChange={(e) => setBusinessInfo(prev => ({ ...prev, whatsapp: e.target.value }))}
                                            placeholder="Ex: 5511999999999"
                                            className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-sm"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1 ml-1">* Use o formato com DDD e sem espaços (ex: 5511940028922)</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail de Suporte</label>
                                        <input
                                            type="email"
                                            value={businessInfo.email}
                                            onChange={(e) => setBusinessInfo(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="suporte@exemplo.com"
                                            className="w-full mt-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={saveBusinessInfo}
                                    disabled={loading}
                                    className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </>
                        )}

                        {/* Help & Support Modal */}
                        {activeModal === 'help' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Ajuda e Suporte</h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <h3 className="font-bold text-blue-700 mb-2">📞 Contato</h3>
                                        <a href={`tel:${businessInfo.whatsapp}`} className="block text-sm text-blue-600 hover:underline">WhatsApp: {businessInfo.whatsapp}</a>
                                        <a href={`mailto:${businessInfo.email}`} className="block text-sm text-blue-600 hover:underline">E-mail: {businessInfo.email}</a>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h3 className="font-bold mb-2">❓ Perguntas Frequentes</h3>
                                        <div className="space-y-3 mt-3">
                                            <details className="text-sm">
                                                <summary className="font-medium cursor-pointer">Como adicionar um novo serviço?</summary>
                                                <p className="mt-2 text-gray-600 pl-4">Vá em Serviços no menu inferior e clique em "Adicionar Serviço".</p>
                                            </details>
                                            <details className="text-sm">
                                                <summary className="font-medium cursor-pointer">Como gerenciar agendamentos?</summary>
                                                <p className="mt-2 text-gray-600 pl-4">Na tela Agenda, você pode confirmar, recusar ou marcar como concluído cada agendamento.</p>
                                            </details>
                                            <details className="text-sm">
                                                <summary className="font-medium cursor-pointer">Como alterar meu horário de funcionamento?</summary>
                                                <p className="mt-2 text-gray-600 pl-4">Em Ajustes &gt; Horários de Funcionamento você pode definir os dias e horários.</p>
                                            </details>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://wa.me/${businessInfo.whatsapp}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-green-500 text-white font-bold rounded-xl"
                                    >
                                        <span className="material-symbols-outlined">chat</span>
                                        Falar no WhatsApp
                                    </a>
                                </div>
                            </>
                        )}

                        {/* Terms of Use Modal */}
                        {activeModal === 'terms' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Termos de Uso</h2>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="prose prose-sm max-w-none text-gray-600">
                                    <h3 className="text-lg font-bold text-gray-800">1. Aceitação dos Termos</h3>
                                    <p>Ao utilizar o aplicativo Alessandro Estética Animal, você concorda com estes termos de uso.</p>

                                    <h3 className="text-lg font-bold text-gray-800 mt-4">2. Uso do Serviço</h3>
                                    <p>O aplicativo destina-se ao gerenciamento de agendamentos para serviços de estética animal.</p>

                                    <h3 className="text-lg font-bold text-gray-800 mt-4">3. Responsabilidades</h3>
                                    <p>O estabelecimento é responsável pela qualidade dos serviços prestados e pelo atendimento aos clientes.</p>

                                    <h3 className="text-lg font-bold text-gray-800 mt-4">4. Privacidade</h3>
                                    <p>Os dados dos clientes são protegidos e utilizados apenas para fins de agendamento e comunicação.</p>

                                    <h3 className="text-lg font-bold text-gray-800 mt-4">5. Cancelamentos</h3>
                                    <p>Agendamentos podem ser cancelados com até 24 horas de antecedência sem penalidades.</p>

                                    <h3 className="text-lg font-bold text-gray-800 mt-4">6. Contato</h3>
                                    <p>Para dúvidas sobre estes termos, entre em contato através do suporte do aplicativo.</p>
                                </div>
                                <button onClick={closeModal} className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-xl">
                                    Li e Concordo
                                </button>
                            </>
                        )}

                        {/* Clients Management Modal */}
                        {activeModal === 'clients' && (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        {selectedClient ? 'Editar Cliente' : 'Gerenciar Clientes'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            if (selectedClient) {
                                                setSelectedClient(null);
                                            } else {
                                                closeModal();
                                            }
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                        <span className="material-symbols-outlined">
                                            {selectedClient ? 'arrow_back' : 'close'}
                                        </span>
                                    </button>
                                </div>

                                {!selectedClient ? (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente..."
                                            value={clientSearchTerm}
                                            onChange={(e) => setClientSearchTerm(e.target.value)}
                                            className="w-full p-3 mb-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                                        />
                                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                            {filteredClients.length === 0 ? (
                                                <p className="text-center text-gray-500 py-8">Nenhum cliente encontrado</p>
                                            ) : (
                                                filteredClients.map(profile => (
                                                    <button
                                                        key={profile.id}
                                                        onClick={() => selectClient(profile)}
                                                        className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors text-left"
                                                    >
                                                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                            {profile.full_name?.[0]?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold">{profile.full_name || 'Sem nome'}</p>
                                                            <p className="text-xs text-gray-500">{profile.neighborhood || 'Sem bairro'}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-4 mb-6">
                                            <div className="flex flex-col items-center gap-3 py-2">
                                                <div className="relative group">
                                                    <div
                                                        className="size-24 rounded-full border-4 border-white shadow-md bg-cover bg-center bg-gray-200 overflow-hidden"
                                                        style={{ backgroundImage: (editingClient.avatar_url || selectedClient.avatar_url) ? `url("${editingClient.avatar_url || selectedClient.avatar_url}")` : 'none' }}
                                                    >
                                                        {!(editingClient.avatar_url || selectedClient.avatar_url) && (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-gray-400 text-4xl">person</span>
                                                            </div>
                                                        )}
                                                        {uploadingImage === 'tutor' && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <label className="absolute bottom-0 right-0 size-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-600 transition-colors">
                                                        <span className="material-symbols-outlined text-base">photo_camera</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleTutorImageUpload} />
                                                    </label>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Foto do Tutor</p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                                                <input
                                                    type="text"
                                                    value={editingClient.full_name || ''}
                                                    onChange={(e) => setEditingClient(prev => ({ ...prev, full_name: e.target.value }))}
                                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Telefone</label>
                                                <input
                                                    type="tel"
                                                    value={editingClient.phone || ''}
                                                    onChange={(e) => setEditingClient(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Endereço</label>
                                                <input
                                                    type="text"
                                                    value={editingClient.address || ''}
                                                    onChange={(e) => setEditingClient(prev => ({ ...prev, address: e.target.value }))}
                                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bairro</label>
                                                <input
                                                    type="text"
                                                    value={editingClient.neighborhood || ''}
                                                    onChange={(e) => setEditingClient(prev => ({ ...prev, neighborhood: e.target.value }))}
                                                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <button
                                                onClick={saveClientChanges}
                                                disabled={savingClient}
                                                className="w-full py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
                                            >
                                                {savingClient ? 'Salvando...' : 'Salvar Alterações'}
                                            </button>
                                        </div>
                                        <div className="border-t border-gray-200 pt-4">
                                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[20px]">pets</span>
                                                Pets do Cliente
                                            </h3>
                                            <div className="space-y-2 mb-4">
                                                {clientPets.length === 0 ? (
                                                    <p className="text-sm text-gray-500 text-center py-4">Nenhum pet cadastrado</p>
                                                ) : (
                                                    clientPets.map(pet => (
                                                        <div key={pet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative">
                                                                    <div
                                                                        className="size-10 rounded-full bg-cover bg-center bg-gray-100 border border-gray-200 overflow-hidden"
                                                                        style={{ backgroundImage: pet.image_url ? `url("${pet.image_url}")` : 'none' }}
                                                                    >
                                                                        {!pet.image_url && (
                                                                            <div className="h-full w-full flex items-center justify-center">
                                                                                <span className="material-symbols-outlined text-gray-300 text-xl">
                                                                                    {pet.type === 'cat' ? 'pets' : 'cruelty_free'}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        {uploadingImage === pet.id && (
                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <label className="absolute -bottom-1 -right-1 size-5 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-md">
                                                                        <span className="material-symbols-outlined text-[12px]">edit</span>
                                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePetImageUpload(pet.id, e)} />
                                                                    </label>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm">{pet.name}</p>
                                                                    <p className="text-xs text-gray-500">{pet.breed || 'Sem raça'}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeletePet(pet.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                                <p className="text-xs font-bold text-green-700 mb-3">Adicionar Novo Pet</p>
                                                <div className="flex items-center gap-4">
                                                    <div className="size-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden shrink-0">
                                                        {newPetImageUrl ? (
                                                            <img src={newPetImageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-gray-300">add_a_photo</span>
                                                        )}
                                                        {uploadingImage === 'new-pet' && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            </div>
                                                        )}
                                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleNewPetImageUpload} />
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Nome do Pet"
                                                            value={newPetName}
                                                            onChange={(e) => setNewPetName(e.target.value)}
                                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Raça (opcional)"
                                                            value={newPetBreed}
                                                            onChange={(e) => setNewPetBreed(e.target.value)}
                                                            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {(['dog', 'cat', 'other'] as const).map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setNewPetType(type)}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${newPetType === type
                                                                ? 'bg-green-500 text-white'
                                                                : 'bg-white border border-gray-200 text-gray-600'
                                                                }`}
                                                        >
                                                            {type === 'dog' ? 'Cachorro' : type === 'cat' ? 'Gato' : 'Outro'}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={handleAddPet}
                                                    disabled={!newPetName.trim()}
                                                    className="w-full py-2 bg-green-500 text-white font-bold rounded-lg text-sm disabled:opacity-50"
                                                >
                                                    + Adicionar Pet
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            <AdminBottomNav active="ADMIN_SETTINGS" onNavigate={onNavigate} />
        </div>
    );
};

export default AdminSettingsScreen;
