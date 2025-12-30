import React, { useState, useMemo } from 'react';
import { AppointmentWithDetails, updateAppointment, checkTimeConflict } from '../lib/database';

interface AdminCalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: AppointmentWithDetails[];
    onRefresh?: () => void;
}

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({ isOpen, onClose, appointments, onRefresh }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedAppointment, setDraggedAppointment] = useState<AppointmentWithDetails | null>(null);
    const [dropTarget, setDropTarget] = useState<{ date: string; hour: number } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => app.status !== 'CANCELLED' && app.status !== 'CANCELED');
    }, [appointments]);

    const navigate = (direction: 'PREV' | 'NEXT') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'NEXT' ? 7 : -7));
        setCurrentDate(newDate);
    };

    const getWeekDays = (baseDate: Date) => {
        const startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const getAppointmentsForDate = (dateStr: string) => {
        return filteredAppointments.filter(app => app.scheduled_date === dateStr);
    };

    const goToToday = () => setCurrentDate(new Date());

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, app: AppointmentWithDetails) => {
        setDraggedAppointment(app);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', app.id);
    };

    const handleDragEnd = () => {
        setDraggedAppointment(null);
        setDropTarget(null);
    };

    const handleDragOver = (e: React.DragEvent, date: string, hour: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget({ date, hour });
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = async (e: React.DragEvent, date: string, hour: number) => {
        e.preventDefault();
        setDropTarget(null);

        if (!draggedAppointment || isUpdating) return;

        const newTime = `${String(hour).padStart(2, '0')}:00`;

        // Skip if dropping in the same slot
        if (draggedAppointment.scheduled_date === date && draggedAppointment.scheduled_time.startsWith(`${String(hour).padStart(2, '0')}:`)) {
            setDraggedAppointment(null);
            return;
        }

        // Check for conflicts
        const { hasConflict } = await checkTimeConflict(date, newTime);
        if (hasConflict) {
            alert(`⚠️ Já existe um agendamento para ${date} às ${newTime}. Escolha outro horário.`);
            setDraggedAppointment(null);
            return;
        }

        setIsUpdating(true);
        try {
            await updateAppointment(draggedAppointment.id, {
                scheduled_date: date,
                scheduled_time: newTime
            });

            if (onRefresh) {
                onRefresh();
            }

            // Show success feedback
            const petName = draggedAppointment.pet?.name || 'Pet';
            const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
            alert(`✅ ${petName} reagendado para ${formattedDate} às ${newTime}`);
        } catch (err) {
            console.error('Error updating appointment:', err);
            alert('❌ Erro ao reagendar. Tente novamente.');
        } finally {
            setIsUpdating(false);
            setDraggedAppointment(null);
        }
    };

    const weekDates = getWeekDays(currentDate);
    const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 to 19:00

    // Get week range for display
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const weekRangeText = `${weekStart.getDate()} - ${weekEnd.getDate()} ${months[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#202124] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] gap-3">
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">arrow_back</span>
                        </button>
                        <span className="text-xl text-gray-600 dark:text-gray-300 flex items-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-blue-600">calendar_month</span>
                            <span className="font-medium hidden sm:inline">Agenda Semanal</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2">
                    <button
                        onClick={goToToday}
                        className="px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Hoje
                    </button>
                    <div className="flex items-center gap-0.5">
                        <button onClick={() => navigate('PREV')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button onClick={() => navigate('NEXT')} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                    <h2 className="text-base sm:text-lg font-normal ml-1 sm:ml-2 min-w-[150px] sm:min-w-[200px]">
                        {weekRangeText}
                    </h2>
                </div>

                {/* Info badge */}
                <div className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-xs">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Arraste os cards para reagendar
                </div>
            </header>

            {/* Main Content - Split Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Tutors List */}
                <div className="w-52 sm:w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col overflow-hidden">
                    <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">pets</span>
                            Agendamentos
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1">Arraste para reagendar</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredAppointments.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <span className="material-symbols-outlined text-3xl mb-2">event_busy</span>
                                <p className="text-xs">Nenhum agendamento</p>
                            </div>
                        ) : (
                            filteredAppointments.map(app => (
                                <div
                                    key={app.id}
                                    draggable={!isUpdating}
                                    onDragStart={(e) => handleDragStart(e, app)}
                                    onDragEnd={handleDragEnd}
                                    className={`
                                        p-3 rounded-xl bg-white dark:bg-gray-700 shadow-sm border-l-4 cursor-grab active:cursor-grabbing
                                        transition-all duration-200 hover:shadow-md hover:scale-[1.02]
                                        ${app.status === 'CONFIRMED' ? 'border-green-500' : app.status === 'PENDING' ? 'border-orange-500' : 'border-blue-500'}
                                        ${draggedAppointment?.id === app.id ? 'opacity-50 scale-95' : ''}
                                        ${isUpdating ? 'pointer-events-none opacity-70' : ''}
                                    `}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="size-8 shrink-0 rounded-lg bg-slate-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center">
                                            {app.pet?.image_url ? (
                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${app.pet.image_url}")` }}></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-sm text-gray-400">pets</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate text-gray-900 dark:text-white">
                                                {app.pet?.name || 'Pet'}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                {app.profile?.full_name?.split(' ')[0] || 'Cliente'}
                                                {app.profile?.neighborhood && (
                                                    <span className="text-primary font-medium ml-1">({app.profile.neighborhood})</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[10px]">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {new Date(app.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                                        </span>
                                        <span className="font-bold text-primary">
                                            {app.scheduled_time.substring(0, 5)}
                                        </span>
                                    </div>
                                    <div className="mt-1">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                app.status === 'PENDING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                            {app.status === 'CONFIRMED' ? 'Confirmado' : app.status === 'PENDING' ? 'Pendente' : app.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Week Grid */}
                <div className="flex-1 overflow-auto bg-white dark:bg-[#202124]">
                    <WeekView
                        weekDates={weekDates}
                        weekDays={weekDays}
                        hours={hours}
                        getAppointmentsForDate={getAppointmentsForDate}
                        dropTarget={dropTarget}
                        draggedAppointment={draggedAppointment}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    />
                </div>
            </div>

            {/* Loading overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-xl flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="text-sm font-medium">Reagendando...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Week View Component ---

interface WeekViewProps {
    weekDates: Date[];
    weekDays: string[];
    hours: number[];
    getAppointmentsForDate: (dateStr: string) => AppointmentWithDetails[];
    dropTarget: { date: string; hour: number } | null;
    draggedAppointment: AppointmentWithDetails | null;
    onDragOver: (e: React.DragEvent, date: string, hour: number) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, date: string, hour: number) => void;
}

const WeekView: React.FC<WeekViewProps> = ({
    weekDates,
    weekDays,
    hours,
    getAppointmentsForDate,
    dropTarget,
    draggedAppointment,
    onDragOver,
    onDragLeave,
    onDrop
}) => {
    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header (Days) */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#202124] z-10">
                {/* Time column spacer */}
                <div className="w-14 flex-none border-r border-gray-200 dark:border-gray-700"></div>
                {weekDates.map((date: Date, idx: number) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <div key={idx} className="flex-1 text-center py-3 border-l border-gray-200 dark:border-gray-700 min-w-[100px]">
                            <div className={`text-xs uppercase font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                {weekDays[date.getDay()]}
                            </div>
                            <div className={`text-xl font-normal mx-auto h-9 w-9 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <div className="flex min-w-full">
                    {/* Time Column */}
                    <div className="w-14 flex-none border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] sticky left-0 z-10">
                        {hours.map(hour => (
                            <div key={hour} className="h-16 border-b border-gray-100 dark:border-gray-800 relative">
                                <span className="absolute -top-2 left-2 text-[10px] text-gray-400 bg-white dark:bg-[#202124] px-1">
                                    {String(hour).padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map((date: Date, dayIdx: number) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        const dayApps = getAppointmentsForDate(dateStr);

                        return (
                            <div key={dayIdx} className="flex-1 border-l border-gray-200 dark:border-gray-700 relative min-w-[100px]">
                                {/* Hour cells - drop zones */}
                                {hours.map(hour => {
                                    const isDropTarget = dropTarget?.date === dateStr && dropTarget?.hour === hour;

                                    return (
                                        <div
                                            key={hour}
                                            className={`h-16 border-b border-gray-100 dark:border-gray-800 transition-colors ${isDropTarget ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-inset ring-blue-400' : ''
                                                } ${draggedAppointment ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}`}
                                            onDragOver={(e) => onDragOver(e, dateStr, hour)}
                                            onDragLeave={onDragLeave}
                                            onDrop={(e) => onDrop(e, dateStr, hour)}
                                        >
                                            {isDropTarget && (
                                                <div className="flex items-center justify-center h-full text-blue-500 text-xs font-medium">
                                                    <span className="material-symbols-outlined text-sm mr-1">add_circle</span>
                                                    Soltar aqui
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Positioned appointments */}
                                {dayApps.map((app: AppointmentWithDetails) => {
                                    const [h, m] = app.scheduled_time.split(':').map(Number);
                                    const startHour = 7;
                                    const top = ((h - startHour) * 64) + ((m / 60) * 64); // 64px per hour
                                    const height = 56;

                                    return (
                                        <div
                                            key={app.id}
                                            className={`absolute left-1 right-1 rounded-lg p-2 text-xs overflow-hidden border-l-3 shadow-sm z-20 ${app.status === 'CONFIRMED'
                                                    ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-900 dark:text-green-100'
                                                    : app.status === 'PENDING'
                                                        ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-500 text-orange-900 dark:text-orange-100'
                                                        : 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-900 dark:text-blue-100'
                                                }`}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                            title={`${app.scheduled_time} - ${app.pet?.name} - ${app.profile?.full_name}`}
                                        >
                                            <div className="font-bold truncate">{app.pet?.name}</div>
                                            <div className="text-[10px] opacity-80 truncate">
                                                {app.scheduled_time.substring(0, 5)} - {app.profile?.full_name?.split(' ')[0]}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdminCalendarView;
