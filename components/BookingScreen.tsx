
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPets, getServices, createAppointment, Pet, Service } from '../lib/database';

interface BookingProps {
  service?: { id: string; name: string; description: string; price: number; duration: string; image_url: string; rating: number } | null;
  onBack: () => void;
  onSuccess: () => void;
}

const BookingScreen: React.FC<BookingProps> = ({ service: initialService, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialService?.id || null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [petsData, servicesData] = await Promise.all([
        getPets(user.id),
        getServices()
      ]);
      setPets(petsData);
      setServices(servicesData);
      if (petsData.length > 0) setSelectedPetId(petsData[0].id);
      if (!selectedServiceId && servicesData.length > 0) {
        setSelectedServiceId(servicesData[0].id);
      }
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedPetId || !selectedServiceId || !selectedDate || !selectedTime) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      await createAppointment({
        user_id: user.id,
        pet_id: selectedPetId,
        service_id: selectedServiceId,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime
      });
      alert('Agendamento criado com sucesso!');
      onSuccess();
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Erro ao criar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-32 animate-in slide-in-from-right duration-300">
      <header className="sticky top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-gray-200/50 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800">
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold">Agendamento</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-4 pt-4">
        {/* Service Selection */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary filled">content_cut</span>
            Serviço
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {services.map(svc => (
              <button
                key={svc.id}
                onClick={() => setSelectedServiceId(svc.id)}
                className={`flex flex-col shrink-0 w-32 p-3 rounded-xl transition-all ${selectedServiceId === svc.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
              >
                <span className="text-sm font-bold truncate">{svc.name}</span>
                <span className={`text-xs ${selectedServiceId === svc.id ? 'text-white/80' : 'text-gray-500'}`}>R$ {svc.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Pet Selection */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary filled">pets</span>
            Quem será atendido?
          </h2>
          {pets.length === 0 ? (
            <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-xl">
              <p className="text-sm">Cadastre um pet primeiro</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPetId(pet.id)}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-5 transition-all ${selectedPetId === pet.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700'}`}
                >
                  {selectedPetId === pet.id && <span className="material-symbols-outlined text-[20px]">check</span>}
                  <span className="text-sm font-semibold">{pet.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Date Selection */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3">Selecione a data</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full h-14 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 focus:ring-2 focus:ring-primary"
          />
        </section>

        {/* Time Selection */}
        <section className="mb-4">
          <h2 className="text-lg font-bold mb-3">Horários disponíveis</h2>
          <div className="grid grid-cols-3 gap-3">
            {times.map(time => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-3 rounded-xl font-semibold text-sm transition-all border ${selectedTime === time ? 'bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary ring-offset-2' : 'bg-white dark:bg-gray-800 border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}
              >
                {time}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 border-t border-gray-200 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total a pagar</span>
            <span className="text-xl font-bold">R$ {selectedService?.price.toFixed(2) || '0.00'}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 block">Agendado para</span>
            <span className="text-xs font-semibold text-primary">{selectedDate} às {selectedTime}</span>
          </div>
        </div>
        <button
          onClick={handleConfirm}
          disabled={saving || pets.length === 0}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {saving ? 'Criando...' : 'Confirmar Agendamento'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default BookingScreen;
