import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPet, updatePet, uploadPetImage, Pet } from '../lib/database';

interface PetRegistrationProps {
  pet?: Pet | null;
  onBack: () => void;
}

const PetRegistrationScreen: React.FC<PetRegistrationProps> = ({ pet, onBack }) => {
  const { user } = useAuth();
  const [petType, setPetType] = useState<'dog' | 'cat' | 'other'>('dog');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!pet;

  // Pre-fill form when editing
  useEffect(() => {
    if (pet) {
      setName(pet.name || '');
      setBreed(pet.breed || '');
      setAge(pet.age || '');
      setPetType((pet.type as 'dog' | 'cat' | 'other') || 'dog');
      setImageUrl(pet.image_url || null);
    }
  }, [pet]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      alert('Por favor, informe o nome do pet');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && pet) {
        // Update existing pet
        await updatePet(pet.id, {
          name: name.trim(),
          breed: breed.trim() || null,
          age: age.trim() || null,
          type: petType,
        });

        // If there's a new image, upload it
        if (imageFile) {
          const url = await uploadPetImage(user.id, pet.id, imageFile);
          if (url) {
            await updatePet(pet.id, { image_url: url });
          }
        }

        alert('Pet atualizado com sucesso!');
      } else {
        // Create new pet
        const newPet = await createPet({
          user_id: user.id,
          name: name.trim(),
          breed: breed.trim() || null,
          age: age.trim() || null,
          type: petType,
          image_url: null
        });

        // If there's an image, upload it
        if (imageFile && newPet) {
          const url = await uploadPetImage(user.id, newPet.id, imageFile);
          if (url) {
            await updatePet(newPet.id, { image_url: url });
          }
        }

        alert('Pet cadastrado com sucesso!');
      }
      onBack();
    } catch (err) {
      console.error('Error saving pet:', err);
      alert('Erro ao salvar pet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light animate-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-background-light/95 backdrop-blur-sm">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full hover:bg-gray-100 text-gray-900 transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">
          {isEditing ? 'Editar Pet' : 'Cadastro de Pet'}
        </h2>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4">
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="h-32 w-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${imageUrl}")` }}></div>
              ) : (
                <span className="material-symbols-outlined text-gray-400 text-5xl">pets</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2 border-4 border-background-light flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
          <p className="text-primary font-bold mt-3 text-sm">
            {isEditing ? 'Alterar foto' : 'Adicionar foto'}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-1">Nome do Pet *</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-gray-400 material-symbols-outlined">pets</span>
              <input
                className="w-full rounded-xl border-none bg-white focus:ring-2 focus:ring-primary h-14 pl-12 pr-4 text-base font-medium shadow-sm"
                placeholder="Ex: Thor"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold ml-1">Tipo de Animal</label>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setPetType('dog')}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${petType === 'dog' ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                <span className="material-symbols-outlined">sound_detection_dog_barking</span>
                <span className="text-sm font-bold">Cachorro</span>
              </button>
              <button
                onClick={() => setPetType('cat')}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${petType === 'cat' ? 'bg-primary text-white ring-2 ring-primary ring-offset-2' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                <span className="material-symbols-outlined">pets</span>
                <span className="text-sm font-bold">Gato</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1">Raça</label>
              <input
                className="w-full rounded-xl border-none bg-white focus:ring-2 focus:ring-primary h-14 px-4 text-base font-medium shadow-sm"
                placeholder="Ex: Golden"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold ml-1">Idade</label>
              <input
                className="w-full rounded-xl border-none bg-white focus:ring-2 focus:ring-primary h-14 px-4 text-base font-medium shadow-sm"
                placeholder="Ex: 2 anos"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 pb-6 z-20">
        <div className="flex gap-4">
          <button onClick={onBack} className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 disabled:opacity-70"
          >
            {saving ? 'Salvando...' : (isEditing ? 'Atualizar Pet' : 'Salvar Pet')}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default PetRegistrationScreen;
