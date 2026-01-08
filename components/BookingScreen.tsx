
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPets, getServices, createAppointment, checkTimeConflict, Pet, Service } from '../lib/database';

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
  const [selectedSubtypeName, setSelectedSubtypeName] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Horários de funcionamento: 07:00-12:00 e 13:00-19:00 (intervalo de almoço 12-13)
  const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  // Dias permitidos: Terça(2) a Sábado(6)
  const allowedDays = [2, 3, 4, 5, 6]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb

  const isDateAllowed = (dateStr: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr + 'T00:00:00');
    return allowedDays.includes(date.getDay());
  };

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

    // Validar dia da semana
    if (!isDateAllowed(selectedDate)) {
      alert('⚠️ Data não permitida!\n\nFuncionamos apenas de Terça a Sábado.\nPor favor, selecione outra data.');
      return;
    }

    setSaving(true);
    try {
      // Verificar conflito de horário
      const { hasConflict } = await checkTimeConflict(selectedDate, selectedTime);

      if (hasConflict) {
        alert(
          '⚠️ Horário indisponível!\n\n' +
          `Já existe um agendamento para ${selectedDate} às ${selectedTime}.\n\n` +
          'Por favor, escolha outro horário.'
        );
        setSaving(false);
        return;
      }

      const selectedService = services.find(s => s.id === selectedServiceId);
      const selectedSubtype = selectedService?.subtypes?.find(st => st.name === selectedSubtypeName);

      let noteContent = '';
      if (selectedSubtypeName) {
        noteContent += `Subtipo: ${selectedSubtypeName}\n`;
      }
      if (selectedExtras.length > 0) {
        noteContent += `Extras: ${selectedExtras.join(', ')}\n`;
      }

      await createAppointment({
        user_id: user.id,
        pet_id: selectedPetId,
        service_id: selectedServiceId,
        scheduled_date: selectedDate,
        scheduled_time: selectedTime,
        notes: noteContent.trim() || undefined
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
  const selectedSubtype = selectedService?.subtypes?.find(st => st.name === selectedSubtypeName);

  const calculateTotal = () => {
    if (!selectedService) return 0;
    let total = selectedSubtypeName && selectedSubtype ? selectedSubtype.price : selectedService.price;

    selectedExtras.forEach(extraName => {
      const extra = selectedService.extras?.find(e => e.name === extraName);
      if (extra) total += extra.price;
    });

    return total;
  };

  const toggleExtra = (name: string) => {
    setSelectedExtras(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

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
            {services.flatMap(svc => [
              { id: svc.id, name: svc.name, price: svc.price, subtype: null as string | null },
              ...(svc.subtypes || []).map(st => ({ id: svc.id, name: `${svc.name} (${st.name})`, price: st.price, subtype: st.name }))
            ]).map((option, idx) => (
              <button
                key={`${option.id}-${idx}`}
                onClick={() => {
                  setSelectedServiceId(option.id);
                  setSelectedSubtypeName(option.subtype);
                }}
                className={`flex flex-col shrink-0 w-32 p-3 rounded-xl transition-all ${selectedServiceId === option.id && selectedSubtypeName === option.subtype ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
              >
                <span className="text-sm font-bold truncate">{option.name}</span>
                <span className={`text-xs ${selectedServiceId === option.id && selectedSubtypeName === option.subtype ? 'text-white/80' : 'text-gray-500'}`}>R$ {option.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Extras Selection */}
        {selectedService && selectedService.extras && selectedService.extras.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary filled">add_circle</span>
              Adicionais (Extras)
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {selectedService.extras.map((extra, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleExtra(extra.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedExtras.includes(extra.name) ? 'bg-blue-50 border-primary dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined ${selectedExtras.includes(extra.name) ? 'text-primary' : 'text-gray-300'}`}>
                      {selectedExtras.includes(extra.name) ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                    <span className="text-sm font-medium">{extra.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">+ R$ {extra.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

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
            className={`w-full h-14 px-4 rounded-xl bg-white dark:bg-gray-800 border focus:ring-2 focus:ring-primary ${!isDateAllowed(selectedDate) && selectedDate ? 'border-red-400' : 'border-gray-200'}`}
          />
          {selectedDate && !isDateAllowed(selectedDate) && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">warning</span>
              Funcionamos de Terça a Sábado. Selecione outro dia.
            </p>
          )}
          <p className="text-gray-400 text-xs mt-2">Horário: Ter-Sáb, 07h-12h e 13h-19h</p>
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
            <span className="text-xl font-bold">R$ {calculateTotal().toFixed(2)}</span>
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
