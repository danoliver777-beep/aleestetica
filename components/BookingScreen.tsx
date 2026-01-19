
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
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; name: string; price: number; subtypeName: string | null }[]>(
    initialService ? [{ serviceId: initialService.id, name: initialService.name, price: initialService.price, subtypeName: null }] : []
  );
  const [isServiceConfirmed, setIsServiceConfirmed] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('A definir');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      if (selectedServices.length === 0 && servicesData.length > 0) {
        setSelectedServices([{ serviceId: servicesData[0].id, name: servicesData[0].name, price: servicesData[0].price, subtypeName: null }]);
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
    if (!user || !selectedPetId || selectedServices.length === 0 || !selectedDate) {
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

      let noteContent = `Serviços Selecionados:\n`;
      selectedServices.forEach(s => {
        noteContent += `- ${s.name}: R$ ${s.price.toFixed(2)}\n`;
      });

      if (selectedExtras.length > 0) {
        noteContent += `\nAdicionais (Extras): ${selectedExtras.join(', ')}\n`;
      }

      await createAppointment({
        user_id: user.id,
        pet_id: selectedPetId,
        service_id: selectedServices[0].serviceId, // Usamos o primeiro como ID principal
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

  const calculateTotal = () => {
    let total = selectedServices.reduce((sum, s) => sum + s.price, 0);

    selectedExtras.forEach(extraName => {
      // Procuramos o extra em todos os serviços selecionados
      for (const selSvc of selectedServices) {
        const fullSvc = services.find(s => s.id === selSvc.serviceId);
        const extra = fullSvc?.extras?.find(e => e.name === extraName);
        if (extra) {
          total += extra.price;
          break; // Extra adicionado uma vez
        }
      }
    });

    return total;
  };

  const toggleService = (svcId: string, name: string, price: number, subtypeName: string | null) => {
    setIsServiceConfirmed(false); // Reset confirmation on any change
    setSelectedServices(prev => {
      const isAlreadySelected = prev.find(s => s.serviceId === svcId && s.subtypeName === subtypeName);
      if (isAlreadySelected) {
        return prev.filter(s => !(s.serviceId === svcId && s.subtypeName === subtypeName));
      } else {
        return [...prev, { serviceId: svcId, name, price, subtypeName }];
      }
    });
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
          <div className="flex flex-col gap-4">
            {services.filter(svc => svc.id === initialService?.id).map((svc) => (
              <div key={svc.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-primary/20">
                {/* Main Service Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold">{svc.name}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">Serviço Base</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">R$ {svc.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Base Service Toggle */}
                <button
                  disabled={isServiceConfirmed}
                  onClick={() => toggleService(svc.id, svc.name, svc.price, null)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${selectedServices.some(s => s.serviceId === svc.id && s.subtypeName === null)
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                  {selectedServices.some(s => s.serviceId === svc.id && s.subtypeName === null) && (
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  )}
                  {selectedServices.some(s => s.serviceId === svc.id && s.subtypeName === null) ? 'Selecionado' : `Selecionar ${svc.name}`}
                </button>

                {/* Subtypes Section */}
                {svc.subtypes && svc.subtypes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                      Adicionar serviços extras:
                    </p>
                    <div className="flex flex-col gap-2">
                      {svc.subtypes.map((st, idx) => {
                        const isSelected = selectedServices.some(s => s.serviceId === svc.id && s.subtypeName === st.name);
                        return (
                          <button
                            key={idx}
                            disabled={isServiceConfirmed}
                            onClick={() => toggleService(svc.id, `${svc.name} (${st.name})`, st.price, st.name)}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/10 border-primary text-primary shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-gray-300'}`}>
                                {isSelected ? 'check_circle' : 'add_circle'}
                              </span>
                              <span className="text-sm font-bold">{st.name}</span>
                            </div>
                            <span className="text-sm font-bold">R$ {st.price.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedServices.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Serviços Selecionados:</h3>
              <ul className="space-y-2">
                {selectedServices.map((s, idx) => (
                  <li key={idx} className="flex justify-between items-start text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-200 pr-4">{s.name}</span>
                    <span className="font-bold text-primary shrink-0">R$ {s.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isServiceConfirmed && selectedServices.length > 0 && (
            <button
              onClick={() => setIsServiceConfirmed(true)}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Ok, escolher pet e data
            </button>
          )}

          {isServiceConfirmed && (
            <button
              onClick={() => setIsServiceConfirmed(false)}
              className="mt-2 text-primary text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">edit</span>
              Alterar serviços
            </button>
          )}
        </section>

        <section className={`transition-all duration-300 ${!isServiceConfirmed ? 'opacity-30 pointer-events-none grayscale' : ''}`}>

          {/* Extras Selection */}
          {selectedServices.length > 0 && (
            <section className={`mb-6 transition-all duration-300 ${!isServiceConfirmed ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary filled">add_circle</span>
                Adicionais (Extras)
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {/* Mostramos extras de todos os serviços selecionados (evitando duplicados por nome) */}
                {Array.from(new Set(
                  selectedServices.flatMap(selSvc => {
                    const fullSvc = services.find(s => s.id === selSvc.serviceId);
                    return fullSvc?.extras || [];
                  }).map(e => JSON.stringify(e))
                )).map((eStr: any) => JSON.parse(eStr) as { name: string, price: number }).map((extra, idx) => (
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

          {/* Time Selection - Temporariamente desabilitado: horário será definido pelo estabelecimento */}
          {/* <section className="mb-4">
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
          </section> */}
          <p className="text-sm text-primary font-medium text-center mb-32 px-2">⏰ O horário será definido pelo estabelecimento.</p>
        </section>
      </main>

      {isServiceConfirmed && selectedPetId && selectedDate && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-gray-900 border-t border-gray-200 p-4 pb-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total a pagar</span>
              <span className="text-xl font-bold">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">Agendado para</span>
              <span className="text-xs font-semibold text-primary">{selectedDate}</span>
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
      )}
    </div>
  );
};

export default BookingScreen;
