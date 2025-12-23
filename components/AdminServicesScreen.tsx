
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import AdminBottomNav from './AdminBottomNav';
import { getServices, createService, deleteService, Service } from '../lib/database';

interface AdminServicesProps {
  onNavigate: (s: Screen) => void;
}

const AdminServicesScreen: React.FC<AdminServicesProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newService.name.trim() || !newService.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await createService({
        name: newService.name.trim(),
        description: newService.description.trim() || null,
        price: parseFloat(newService.price),
        duration: newService.duration.trim() || null,
        image_url: null,
        rating: 5.0
      });
      setNewService({ name: '', description: '', price: '', duration: '' });
      setShowForm(false);
      loadServices();
    } catch (err) {
      console.error('Error creating service:', err);
      alert('Erro ao criar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      await deleteService(id);
      loadServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Erro ao excluir serviço');
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-28 animate-in slide-in-from-right duration-300">
      <header className="sticky top-0 z-40 bg-surface-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-100 transition-colors">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => onNavigate('ADMIN_DASHBOARD')} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-2">Serviços</h2>
          <button onClick={loadServices} className="flex items-center justify-center w-10 h-10 rounded-full">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {loading ? '...' : `${services.length} Serviços Cadastrados`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-2">content_cut</span>
            <p className="text-sm">Nenhum serviço cadastrado</p>
          </div>
        ) : (
          services.map(service => (
            <div key={service.id} className="group relative flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm border border-transparent hover:border-gray-200 transition-all">
              <div className="flex items-start gap-4">
                <div
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center"
                >
                  {service.image_url ? (
                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${service.image_url}")` }}></div>
                  ) : (
                    <span className="material-symbols-outlined text-gray-400 text-3xl">content_cut</span>
                  )}
                </div>
                <div className="flex flex-col flex-1 justify-center min-h-[80px]">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold leading-tight truncate mr-2">{service.name}</h3>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-400 p-1 -mt-1 -mr-2 rounded-full hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs font-normal leading-relaxed line-clamp-1 mt-1">{service.description || 'Sem descrição'}</p>
                  <div className="flex items-center gap-3 mt-auto pt-2">
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-gray-500 text-[14px]">schedule</span>
                      <span className="text-[10px] font-semibold text-gray-600">{service.duration || '-'}</span>
                    </div>
                    <span className="text-primary font-bold text-sm">R$ {service.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* New Service Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Novo Serviço</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Nome *</label>
                <input
                  value={newService.name}
                  onChange={(e) => setNewService(s => ({ ...s, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                  placeholder="Ex: Banho Completo"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Descrição</label>
                <input
                  value={newService.description}
                  onChange={(e) => setNewService(s => ({ ...s, description: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                  placeholder="Descrição do serviço"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 ml-1">Preço (R$) *</label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService(s => ({ ...s, price: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 ml-1">Duração</label>
                  <input
                    value={newService.duration}
                    onChange={(e) => setNewService(s => ({ ...s, duration: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                    placeholder="Ex: 1h30"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full h-14 bg-primary text-white rounded-xl font-bold mt-4 disabled:opacity-70"
              >
                {saving ? 'Salvando...' : 'Criar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <div className="fixed bottom-28 right-4 z-40">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 h-14 px-6 bg-primary hover:bg-primary/90 text-white rounded-full shadow-xl transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
          <span className="text-base font-bold">Novo</span>
        </button>
      </div>

      <AdminBottomNav active="ADMIN_SERVICES" onNavigate={onNavigate} />
    </div>
  );
};

export default AdminServicesScreen;
