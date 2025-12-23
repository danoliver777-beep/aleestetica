import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import AdminBottomNav from './AdminBottomNav';
import Header from './Header';
import { useAuth } from '../context/AuthContext';
import { getAdminSetting, upsertAdminSetting } from '../lib/database';

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

type ModalType = 'notifications' | 'hours' | 'payments' | 'help' | 'terms' | null;

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
    const { user, signOut } = useAuth();
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

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const [notif, hours, payment] = await Promise.all([
                    getAdminSetting<{
                        enabled: boolean;
                        newApp: boolean;
                        cancel: boolean;
                        reminder: boolean;
                    }>('notifications'),
                    getAdminSetting<typeof businessHours>('business_hours'),
                    getAdminSetting<typeof paymentMethods>('payment_methods')
                ]);

                if (notif) {
                    setNotificationsEnabled(notif.enabled);
                    setNewAppointmentNotif(notif.newApp);
                    setCancelNotif(notif.cancel);
                    setReminderNotif(notif.reminder);
                }
                if (hours) setBusinessHours(hours);
                if (payment) setPaymentMethods(payment);
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
                    {/* Perfil do Admin */}
                    <section className="bg-white rounded-2xl p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-500 mb-4">Conta</h3>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary">person</span>
                            </div>
                            <div>
                                <p className="font-bold">Administrador</p>
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
                        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
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
                                        <a href="tel:+5511999999999" className="block text-sm text-blue-600 hover:underline">WhatsApp: (11) 99999-9999</a>
                                        <a href="mailto:suporte@alessandropet.com" className="block text-sm text-blue-600 hover:underline">E-mail: suporte@alessandropet.com</a>
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
                                        href="https://wa.me/5511999999999"
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
                    </div>
                </div>
            )}

            <AdminBottomNav active="ADMIN_SETTINGS" onNavigate={onNavigate} />
        </div>
    );
};

export default AdminSettingsScreen;
