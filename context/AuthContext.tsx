
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';
import { getProfile } from '../lib/database';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: UserRole | null;
    registrationComplete: boolean;
    profile: any | null;
    pets: any[];
    refreshAuthData: () => Promise<void>;
    signIn: () => void; // Placeholder, actions handled in components mostly
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [pets, setPets] = useState<any[]>([]);
    const [registrationComplete, setRegistrationComplete] = useState(true);

    const fetchRole = React.useCallback(async (user: User) => {
        // Priority check for hardcoded emails to avoid race conditions and provide immediate access
        if (user.email === 'admin@admin.com') {
            setRole(UserRole.ADMIN);
            setRegistrationComplete(true);
            return UserRole.ADMIN;
        }
        if (user.email === 'funcionario@aleestetica.com') {
            setRole(UserRole.STAFF);
            setRegistrationComplete(true);
            return UserRole.STAFF;
        }

        try {
            // Set a timeout for the profile fetch to prevent app hang
            const profilePromise = getProfile(user.id);
            const petsPromise = supabase.from('pets').select('id').eq('user_id', user.id);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            );

            const [profileRes, petsRes] = await Promise.all([
                Promise.race([profilePromise, timeoutPromise]),
                Promise.race([petsPromise, timeoutPromise])
            ]) as [any, any];

            const profile = profileRes;
            const pets = petsRes?.data || [];

            setProfile(profile);
            setPets(pets);

            const userRole = (profile?.role as UserRole) ?? UserRole.CLIENT;
            setRole(userRole);

            // Registration is complete if not a client OR (has address AND has phone AND has at least one pet)
            const isComplete = userRole !== UserRole.CLIENT || (!!profile?.address && !!profile?.phone && pets.length > 0);
            setRegistrationComplete(isComplete);

            return userRole;
        } catch (err) {
            console.error('Error fetching role:', err);
            const fallbackRole = user.email === 'admin@admin.com' ? UserRole.ADMIN :
                user.email === 'funcionario@aleestetica.com' ? UserRole.STAFF :
                    UserRole.CLIENT;
            setRole(fallbackRole);
            setRegistrationComplete(fallbackRole !== UserRole.CLIENT);
            return fallbackRole;
        }
    }, []);

    const refreshAuthData = React.useCallback(async () => {
        if (user) {
            await fetchRole(user);
        }
    }, [user, fetchRole]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await fetchRole(session.user);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session);
            const newUser = session?.user ?? null;
            setUser(newUser);

            if (newUser) {
                // Only show loading if it's a new sign in or change
                if (event === 'SIGNED_IN') setLoading(true);
                await fetchRole(newUser);
                if (event === 'SIGNED_IN') setLoading(false);
            } else {
                setRole(null);
                setRegistrationComplete(true);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchRole]);

    // Auto-logout after 15 minutes of inactivity
    useEffect(() => {
        let inactivityTimer: any;

        const resetInactivityTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            if (session) {
                inactivityTimer = setTimeout(() => {
                    console.log('User inactive for 15 minutes. Logging out.');
                    signOut();
                }, 15 * 60 * 1000); // 15 minutes
            }
        };

        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        if (session) {
            resetInactivityTimer();
            activityEvents.forEach(event => {
                window.addEventListener(event, resetInactivityTimer);
            });
        }

        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
        };
    }, [session]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();

            // Reforce clearing local storage to prevent auto-login on some browsers/mobile
            for (const key in localStorage) {
                if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setSession(null);
            setUser(null);
            setRole(null);
            // Force a slight delay or just let the state change handle the UI
        }
    };

    const signIn = () => {
        // Usually handled in LoginScreen
    };

    const value = {
        user,
        session,
        loading,
        role,
        registrationComplete,
        profile,
        pets,
        refreshAuthData,
        signIn,
        signOut
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
