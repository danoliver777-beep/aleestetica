
import React, { useState, useEffect } from 'react';
import { Screen, Service, UserRole } from './types';
import { MOCK_SERVICES } from './mockData';

// Screens
import LoginScreen from './components/LoginScreen';
import ClientHomeScreen from './components/ClientHomeScreen';
import BookingScreen from './components/BookingScreen';
import MyAppointmentsScreen from './components/MyAppointmentsScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import AdminAgendaScreen from './components/AdminAgendaScreen';
import AdminServicesScreen from './components/AdminServicesScreen';
import AdminSettingsScreen from './components/AdminSettingsScreen';
import PetRegistrationScreen from './components/PetRegistrationScreen';

import { AuthProvider, useAuth } from './context/AuthContext';

import { Pet } from './lib/database';

const AppContent: React.FC = () => {
  const { user, role, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);

  const handleNavigate = (screen: Screen, pet?: Pet) => {
    if (pet) {
      setPetToEdit(pet);
    } else {
      setPetToEdit(null);
    }
    setCurrentScreen(screen);
  };

  // Sync screen with auth state
  useEffect(() => {
    if (!loading) {
      if (user) {
        // If already on a logged-in screen, don't force redirect to home/dashboard on every render
        // But if on LOGIN, go to dashboard/home
        if (currentScreen === 'LOGIN') {
          setCurrentScreen(role === UserRole.ADMIN ? 'ADMIN_DASHBOARD' : 'HOME');
        }
      } else {
        setCurrentScreen('LOGIN');
      }
    }
  }, [user, role, loading]);

  // Simple Router
  const renderScreen = () => {
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return <LoginScreen />;
    }

    switch (currentScreen) {
      case 'HOME':
        return <ClientHomeScreen
          onNavigate={setCurrentScreen}
          onSelectService={(s) => {
            setSelectedService(s);
            setCurrentScreen('BOOKING');
          }}
        />;
      case 'BOOKING':
        return <BookingScreen
          service={selectedService || MOCK_SERVICES[0]}
          onBack={() => setCurrentScreen('HOME')}
          onSuccess={() => setCurrentScreen('MY_APPOINTMENTS')}
        />;
      case 'MY_APPOINTMENTS':
        return <MyAppointmentsScreen onNavigate={setCurrentScreen} />;
      case 'PROFILE':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboardScreen onNavigate={setCurrentScreen} />;
      case 'ADMIN_AGENDA':
        return <AdminAgendaScreen onNavigate={setCurrentScreen} />;
      case 'ADMIN_SERVICES':
        return <AdminServicesScreen onNavigate={setCurrentScreen} />;
      case 'ADMIN_SETTINGS':
        return <AdminSettingsScreen onNavigate={setCurrentScreen} />;
      case 'PET_REGISTRATION':
        return <PetRegistrationScreen pet={petToEdit} onBack={() => handleNavigate('PROFILE')} />;
      case 'LOGIN':
        // Fallback if user is logged in but screen is stuck on LOGIN (should be handled by effect)
        return null;
      default:
        return <ClientHomeScreen onNavigate={setCurrentScreen} onSelectService={setSelectedService} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark shadow-2xl overflow-x-hidden relative">
      {renderScreen()}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
