
import { supabase } from '../supabaseClient';

// ============ PROFILES ============

export interface Profile {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    created_at: string;
    address?: string | null;
    neighborhood?: string | null;
}

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
    }
    return data;
};

export const upsertProfile = async (profile: Partial<Profile> & { id: string }) => {
    const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error upserting profile:', error);
        throw error;
    }
    return data;
};

// ============ PETS ============

export interface Pet {
    id: string;
    user_id: string;
    name: string;
    breed: string | null;
    age: string | null;
    type: string;
    image_url: string | null;
    created_at: string;
}

export const getPets = async (userId: string): Promise<Pet[]> => {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pets:', error);
        return [];
    }
    return data || [];
};

export const createPet = async (pet: Omit<Pet, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('pets')
        .insert(pet)
        .select()
        .single();

    if (error) {
        console.error('Error creating pet:', error);
        throw error;
    }
    return data;
};

export const updatePet = async (id: string, updates: Partial<Pet>) => {
    const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating pet:', error);
        throw error;
    }
    return data;
};

export const deletePet = async (id: string) => {
    const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting pet:', error);
        throw error;
    }
};

// ============ SERVICES ============

export interface Service {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: string | null;
    image_url: string | null;
    rating: number;
}

export const getServices = async (): Promise<Service[]> => {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching services:', error);
        return [];
    }
    return data || [];
};

// ============ APPOINTMENTS ============

export interface Appointment {
    id: string;
    user_id: string;
    pet_id: string | null;
    service_id: string | null;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    notes: string | null;
    created_at: string;
    // Joined data
    pet?: Pet;
    service?: Service;
}

export const getAppointments = async (userId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
        .from('appointments')
        .select(`
      *,
      pet:pets(*),
      service:services(*)
    `)
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true });

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
    return data || [];
};

export const createAppointment = async (appointment: {
    user_id: string;
    pet_id: string;
    service_id: string;
    scheduled_date: string;
    scheduled_time: string;
    notes?: string;
}) => {
    const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
    return data;
};

export const updateAppointmentStatus = async (id: string, status: string) => {
    const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating appointment:', error);
        throw error;
    }
    return data;
};

export const updateAppointment = async (id: string, updates: {
    pet_id?: string;
    service_id?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    notes?: string;
}) => {
    const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating appointment:', error);
        throw error;
    }
    return data;
};

export const deleteAppointment = async (id: string) => {
    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting appointment:', error);
        throw error;
    }
    return true;
};

// ============ STORAGE ============

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
};

export const uploadPetImage = async (userId: string, petId: string, file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${petId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('pets')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Error uploading pet image:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage.from('pets').getPublicUrl(filePath);
    return data.publicUrl;
};

// ============ ADMIN FUNCTIONS ============

export interface AppointmentWithDetails extends Appointment {
    profile?: Profile;
}

// Get ALL appointments (for admin)
export const getAllAppointments = async (dateFilter?: string): Promise<AppointmentWithDetails[]> => {
    // First, get appointments with pet and service (but NOT profile, since FK points to auth.users)
    let query = supabase
        .from('appointments')
        .select(`
            *,
            pet:pets(*),
            service:services(*)
        `)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

    if (dateFilter) {
        query = query.eq('scheduled_date', dateFilter);
    }

    const { data: appointments, error } = await query;

    if (error) {
        console.error('Error fetching all appointments:', error);
        return [];
    }

    if (!appointments || appointments.length === 0) {
        return [];
    }

    // Get unique user IDs from appointments
    const userIds = [...new Set(appointments.map(a => a.user_id))];

    // Fetch profiles for those user IDs
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return appointments without profiles
        return appointments.map(a => ({ ...a, profile: undefined }));
    }

    // Create a map for quick profile lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Join profiles to appointments
    return appointments.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || undefined
    }));
};

// Get admin dashboard stats
export const getAdminStats = async (): Promise<{
    todayCount: number;
    pendingCount: number;
    todayRevenue: number;
}> => {
    const today = new Date().toISOString().split('T')[0];

    // Get today's appointments
    const { data: todayApps, error: todayError } = await supabase
        .from('appointments')
        .select('id, status, service:services(price)')
        .eq('scheduled_date', today);

    // Get ALL pending appointments (across all dates)
    const { data: allPending, error: pendingError } = await supabase
        .from('appointments')
        .select('id')
        .eq('status', 'PENDING')
        .gte('scheduled_date', today);

    if (todayError || pendingError) {
        console.error('Error fetching stats:', todayError || pendingError);
        return { todayCount: 0, pendingCount: 0, todayRevenue: 0 };
    }

    const todayCount = todayApps?.length || 0;
    const pendingCount = allPending?.length || 0;
    const todayRevenue = todayApps?.reduce((sum, a) => {
        const svc = a.service as any;
        return sum + (svc?.price || 0);
    }, 0) || 0;

    return { todayCount, pendingCount, todayRevenue };
};

// Get financial statistics for the dashboard
export interface FinancialStats {
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    currentMonthAppointments: number;
    completedAppointments: number;
    averageTicket: number;
    topServices: { name: string; count: number; revenue: number }[];
}

export const getFinancialStats = async (): Promise<FinancialStats> => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Current month date range
    const currentMonthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    // Last month date range
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    // Fetch current month appointments
    const { data: currentMonthApps, error: currentError } = await supabase
        .from('appointments')
        .select('id, status, service:services(id, name, price)')
        .gte('scheduled_date', currentMonthStart)
        .lte('scheduled_date', currentMonthEnd);

    // Fetch last month appointments
    const { data: lastMonthApps, error: lastError } = await supabase
        .from('appointments')
        .select('id, status, service:services(price)')
        .gte('scheduled_date', lastMonthStart)
        .lte('scheduled_date', lastMonthEnd);

    if (currentError || lastError) {
        console.error('Error fetching financial stats:', currentError || lastError);
        return {
            currentMonthRevenue: 0,
            lastMonthRevenue: 0,
            currentMonthAppointments: 0,
            completedAppointments: 0,
            averageTicket: 0,
            topServices: []
        };
    }

    // Calculate current month revenue (from completed or confirmed appointments)
    const currentMonthRevenue = currentMonthApps?.reduce((sum, a) => {
        const svc = a.service as any;
        return sum + (svc?.price || 0);
    }, 0) || 0;

    // Calculate last month revenue
    const lastMonthRevenue = lastMonthApps?.reduce((sum, a) => {
        const svc = a.service as any;
        return sum + (svc?.price || 0);
    }, 0) || 0;

    const currentMonthAppointments = currentMonthApps?.length || 0;
    const completedAppointments = currentMonthApps?.filter(a => a.status === 'COMPLETED').length || 0;
    const averageTicket = currentMonthAppointments > 0 ? currentMonthRevenue / currentMonthAppointments : 0;

    // Calculate top services
    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    currentMonthApps?.forEach(a => {
        const svc = a.service as any;
        if (svc?.name) {
            const existing = serviceMap.get(svc.id) || { name: svc.name, count: 0, revenue: 0 };
            existing.count += 1;
            existing.revenue += svc.price || 0;
            serviceMap.set(svc.id, existing);
        }
    });

    const topServices = Array.from(serviceMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        currentMonthRevenue,
        lastMonthRevenue,
        currentMonthAppointments,
        completedAppointments,
        averageTicket,
        topServices
    };
};

// Create a new service (admin only)
export const createService = async (service: Omit<Service, 'id'>) => {
    const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single();

    if (error) {
        console.error('Error creating service:', error);
        throw error;
    }
    return data;
};

// Update a service (admin only)
export const updateService = async (id: string, updates: Partial<Service>) => {
    const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating service:', error);
        throw error;
    }
    return data;
};

// Delete a service (admin only)
export const deleteService = async (id: string) => {
    const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
};

// ============ ADMIN SETTINGS ============

export interface AdminSetting {
    category: string;
    value: any;
    updated_at: string;
}

export const getAdminSetting = async <T>(category: string): Promise<T | null> => {
    const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('category', category)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error(`Error fetching setting ${category}:`, error);
        return null;
    }
    return data?.value || null;
};

export const upsertAdminSetting = async (category: string, value: any) => {
    const { data, error } = await supabase
        .from('admin_settings')
        .upsert({ category, value }, { onConflict: 'category' })
        .select()
        .single();

    if (error) {
        console.error(`Error upserting setting ${category}:`, error);
        throw error;
    }
    return data;
};

