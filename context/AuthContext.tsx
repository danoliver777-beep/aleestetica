
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
    signIn: () => void; // Placeholder, actions handled in components mostly
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole | null>(null);

    useEffect(() => {
        const fetchRole = async (user: User) => {
            try {
                // Hardcoded fallback for the main admin
                if (user.email === 'admin@admin.com') {
                    setRole(UserRole.ADMIN);
                    return UserRole.ADMIN;
                }
                const profile = await getProfile(user.id);
                const userRole = (profile?.role as UserRole) ?? UserRole.CLIENT;
                setRole(userRole);
                return userRole;
            } catch (err) {
                console.error('Error fetching role:', err);
                setRole(UserRole.CLIENT);
                return UserRole.CLIENT;
            }
        };

        // Check active session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchRole(session.user);
            }
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchRole(session.user);
            } else {
                setRole(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const signIn = () => {
        // Usually handled in LoginScreen, but provided for completeness if needed
    };

    const value = {
        user,
        session,
        loading,
        role,
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
