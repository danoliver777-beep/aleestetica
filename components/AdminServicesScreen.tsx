
import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import AdminBottomNav from './AdminBottomNav';
import { getServices, createService, deleteService, updateService, uploadServiceImage, Service, ServiceExtra } from '../lib/database';

interface AdminServicesProps {
  onNavigate: (s: Screen) => void;
}

const AdminServicesScreen: React.FC<AdminServicesProps> = ({ onNavigate }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '', image_url: '', extras: [] as ServiceExtra[] });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', duration: '', image_url: '', extras: [] as ServiceExtra[] });

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadServiceImage(file);
      if (url) {
        if (type === 'new') {
          setNewService(s => ({ ...s, image_url: url }));
        } else {
          setEditForm(s => ({ ...s, image_url: url }));
        }
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
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
        image_url: newService.image_url || null,
        rating: 5.0,
        extras: newService.extras.length > 0 ? newService.extras : null
      });
      setNewService({ name: '', description: '', price: '', duration: '', image_url: '', extras: [] });
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

  const handleEdit = (service: Service) => {
    setEditForm({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration || '',
      image_url: service.image_url || '',
      extras: service.extras || []
    });
    setEditingService(service);
  };

  const handleUpdate = async () => {
    if (!editingService) return;
    if (!editForm.name.trim() || !editForm.price) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await updateService(editingService.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: parseFloat(editForm.price),
        duration: editForm.duration.trim() || null,
        image_url: editForm.image_url.trim() || null,
        extras: editForm.extras.length > 0 ? editForm.extras : null
      });
      setEditingService(null);
      loadServices();
    } catch (err) {
      console.error('Error updating service:', err);
      alert('Erro ao atualizar serviço');
    } finally {
      setSaving(false);
    }
  };

  const toggleDescription = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const calculateTotal = (basePrice: string, extras: ServiceExtra[]) => {
    const base = parseFloat(basePrice) || 0;
    const extrasTotal = extras.reduce((sum, extra) => sum + (extra.price || 0), 0);
    return (base + extrasTotal).toFixed(2);
  };

  const addExtra = (type: 'new' | 'edit') => {
    const emptyExtra = { name: '', price: 0 };
    if (type === 'new') {
      setNewService(prev => ({ ...prev, extras: [...prev.extras, emptyExtra] }));
    } else {
      setEditForm(prev => ({ ...prev, extras: [...prev.extras, emptyExtra] }));
    }
  };

  const removeExtra = (index: number, type: 'new' | 'edit') => {
    if (type === 'new') {
      setNewService(prev => ({ ...prev, extras: prev.extras.filter((_, i) => i !== index) }));
    } else {
      setEditForm(prev => ({ ...prev, extras: prev.extras.filter((_, i) => i !== index) }));
    }
  };

  const updateExtra = (index: number, field: keyof ServiceExtra, value: string | number, type: 'new' | 'edit') => {
    const updateFn = (prev: any) => {
      const newExtras = [...prev.extras];
      newExtras[index] = { ...newExtras[index], [field]: value };
      return { ...prev, extras: newExtras };
    };

    if (type === 'new') {
      setNewService(updateFn);
    } else {
      setEditForm(updateFn);
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
                <div className="flex flex-col flex-1 justify-center min-h-[80px] min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold leading-tight mr-2 flex-1 min-w-0 truncate">{service.name}</h3>
                    <div className="flex items-center gap-1 -mt-1 shrink-0">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-500 p-1 rounded-full hover:bg-blue-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-400 p-1 rounded-full hover:bg-red-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <p className={`text-gray-500 text-xs font-normal leading-relaxed mt-1 ${expandedDescriptions.has(service.id) ? '' : 'line-clamp-1'}`}>
                      {service.description || 'Sem descrição'}
                    </p>
                    {service.description && service.description.length > 50 && (
                      <button
                        onClick={(e) => toggleDescription(service.id, e)}
                        className="text-[10px] text-primary font-bold mt-0.5 hover:underline focus:outline-none"
                      >
                        {expandedDescriptions.has(service.id) ? 'Ler menos' : 'Ler mais'}
                      </button>
                    )}
                  </div>
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
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 mb-24 animate-in slide-in-from-bottom max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Novo Serviço</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Nome *</label>
                <input
                  value={newService.name}
                  onChange={(e) => setNewService(s => ({ ...s, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  placeholder="Ex: Banho Completo"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Descrição</label>
                <input
                  value={newService.description}
                  onChange={(e) => setNewService(s => ({ ...s, description: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
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
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 ml-1">Duração</label>
                  <input
                    value={newService.duration}
                    onChange={(e) => setNewService(s => ({ ...s, duration: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="Ex: 1h30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Imagem do Serviço</label>
                <div className="mt-1 flex flex-col items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 transition-colors hover:bg-gray-100/50">
                  {newService.image_url ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
                      <img src={newService.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setNewService(s => ({ ...s, image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-500 text-white p-1 rounded-full shadow-lg backdrop-blur-sm transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-1">
                      <span className="material-symbols-outlined text-gray-400 text-3xl mb-1">add_a_photo</span>
                      <p className="text-[10px] text-gray-500 font-medium font-sans">Selecione uma foto da galeria</p>
                    </div>
                  )}
                  <label className="relative cursor-pointer w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'new')}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold transition-all shadow-sm ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-white border border-primary/20 text-primary hover:bg-primary/5 active:scale-[0.98]'}`}>
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">{newService.image_url ? 'sync' : 'photo_library'}</span>
                          <span className="text-sm">{newService.image_url ? 'Trocar Foto' : 'Escolher Foto'}</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              {/* Seção de Extras para Novo Serviço */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Serviços Adicionais</label>
                  <button
                    type="button"
                    onClick={() => addExtra('new')}
                    className="text-primary text-[10px] font-bold px-3 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    + Novo Adicional
                  </button>
                </div>
                {newService.extras && newService.extras.map((extra, index) => (
                  <div key={index} className="flex gap-2 items-center animate-in fade-in zoom-in duration-200">
                    <input
                      value={extra.name}
                      onChange={(e) => updateExtra(index, 'name', e.target.value, 'new')}
                      className="flex-1 h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-primary transition-all"
                      placeholder="Nome (ex: Tosa)"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">R$</span>
                      <input
                        type="number"
                        value={extra.price || ''}
                        onChange={(e) => updateExtra(index, 'price', parseFloat(e.target.value) || 0, 'new')}
                        className="w-full h-11 pl-8 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-primary transition-all text-right"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExtra(index, 'new')}
                      className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl flex justify-between items-center border border-primary/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Valor Total</span>
                  <span className="text-xs text-gray-500">Base + Adicionais</span>
                </div>
                <span className="text-xl font-black text-primary">R$ {calculateTotal(newService.price, newService.extras)}</span>
              </div>

              <button
                onClick={handleCreate}
                disabled={saving || uploadingImage}
                className="w-full h-14 bg-primary text-white rounded-xl font-bold mt-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {saving ? 'Salvando...' : 'Criar Serviço'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 mb-24 animate-in slide-in-from-bottom max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Editar Serviço</h3>
              <button onClick={() => setEditingService(null)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Nome *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm(s => ({ ...s, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                  placeholder="Ex: Banho Completo"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Descrição</label>
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm(s => ({ ...s, description: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                  placeholder="Descrição do serviço"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 ml-1">Preço (R$) *</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm(s => ({ ...s, price: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 ml-1">Duração</label>
                  <input
                    value={editForm.duration}
                    onChange={(e) => setEditForm(s => ({ ...s, duration: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 mt-1"
                    placeholder="Ex: 1h30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 ml-1">Imagem do Serviço</label>
                <div className="mt-1 flex flex-col items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 transition-colors hover:bg-gray-100/50">
                  {editForm.image_url ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100">
                      <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditForm(s => ({ ...s, image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-500 text-white p-1 rounded-full shadow-lg backdrop-blur-sm transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-1">
                      <span className="material-symbols-outlined text-gray-400 text-3xl mb-1">add_a_photo</span>
                      <p className="text-[10px] text-gray-500 font-medium font-sans">Selecione uma foto da galeria</p>
                    </div>
                  )}
                  <label className="relative cursor-pointer w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'edit')}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-bold transition-all shadow-sm ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-white border border-primary/20 text-primary hover:bg-primary/5 active:scale-[0.98]'}`}>
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm">Enviando...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">{editForm.image_url ? 'sync' : 'photo_library'}</span>
                          <span className="text-sm">{editForm.image_url ? 'Trocar Foto' : 'Escolher Foto'}</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
              {/* Seção de Extras para Editar Serviço */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 ml-1">Serviços Adicionais</label>
                  <button
                    type="button"
                    onClick={() => addExtra('edit')}
                    className="text-primary text-[10px] font-bold px-3 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    + Novo Adicional
                  </button>
                </div>
                {editForm.extras && editForm.extras.map((extra, index) => (
                  <div key={index} className="flex gap-2 items-center animate-in fade-in zoom-in duration-200">
                    <input
                      value={extra.name}
                      onChange={(e) => updateExtra(index, 'name', e.target.value, 'edit')}
                      className="flex-1 h-11 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-primary transition-all"
                      placeholder="Nome (ex: Tosa)"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">R$</span>
                      <input
                        type="number"
                        value={extra.price || ''}
                        onChange={(e) => updateExtra(index, 'price', parseFloat(e.target.value) || 0, 'edit')}
                        className="w-full h-11 pl-8 pr-3 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-primary transition-all text-right"
                        placeholder="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExtra(index, 'edit')}
                      className="text-red-400 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl flex justify-between items-center border border-primary/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider">Valor Total</span>
                  <span className="text-xs text-gray-500">Base + Adicionais</span>
                </div>
                <span className="text-xl font-black text-primary">R$ {calculateTotal(editForm.price, editForm.extras)}</span>
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving || uploadingImage}
                className="w-full h-14 bg-primary text-white rounded-xl font-bold mt-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
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
