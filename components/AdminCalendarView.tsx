import React, { useState, useMemo } from 'react';
import { AppointmentWithDetails, updateAppointment, checkTimeConflict, deleteAppointment } from '../lib/database';
import AdminEditBookingModal from './AdminEditBookingModal';

interface AdminCalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: AppointmentWithDetails[];
    onRefresh?: () => void;
    onCreateAppointment?: (date: string, time: string) => void;
}

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({
    isOpen,
    onClose,
    appointments,
    onRefresh,
    onCreateAppointment
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [draggedAppointment, setDraggedAppointment] = useState<AppointmentWithDetails | null>(null);
    const [dropTarget, setDropTarget] = useState<{ date: string; hour: number } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isOverTrash, setIsOverTrash] = useState(false);
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<AppointmentWithDetails | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, app: AppointmentWithDetails) => {
        setDraggedAppointment(app);
        // Collapse sidebar on drag start to give more space for the grid
        setShowSidebar(false);
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

        if (draggedAppointment.scheduled_date === date && draggedAppointment.scheduled_time.startsWith(`${String(hour).padStart(2, '0')}:`)) {
            setDraggedAppointment(null);
            return;
        }

        const { hasConflict } = await checkTimeConflict(date, newTime);
        if (hasConflict) {
            alert(`⚠️ Horário ocupado! Escolha outro.`);
            setDraggedAppointment(null);
            return;
        }

        setIsUpdating(true);
        try {
            await updateAppointment(draggedAppointment.id, {
                scheduled_date: date,
                scheduled_time: newTime
            });
            if (onRefresh) onRefresh();
            const petName = draggedAppointment.pet?.name || 'Pet';
            alert(`✅ ${petName} reagendado!`);
        } catch (err) {
            console.error('Error updating appointment:', err);
            alert('❌ Erro ao reagendar.');
        } finally {
            setIsUpdating(false);
            setDraggedAppointment(null);
        }
    };

    const handleTrashDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsOverTrash(false);

        if (!draggedAppointment || isUpdating) return;

        const confirmDelete = window.confirm(`Deseja realmente excluir o agendamento de ${draggedAppointment.pet?.name || 'este pet'}?`);
        if (!confirmDelete) {
            setDraggedAppointment(null);
            return;
        }

        setIsUpdating(true);
        try {
            await deleteAppointment(draggedAppointment.id);
            if (onRefresh) onRefresh();
            alert('✅ Agendamento excluído com sucesso!');
        } catch (err) {
            console.error('Error deleting appointment:', err);
            alert('❌ Erro ao excluir agendamento.');
        } finally {
            setIsUpdating(false);
            setDraggedAppointment(null);
        }
    };

    // Click on empty slot to create new appointment
    const handleSlotClick = (date: string, hour: number) => {
        if (draggedAppointment || isUpdating) return;
        const time = `${String(hour).padStart(2, '0')}:00`;
        if (onCreateAppointment) {
            onCreateAppointment(date, time);
        }
    };

    const handleEditAppointment = (app: AppointmentWithDetails) => {
        if (draggedAppointment || isUpdating) return;
        setSelectedAppointmentForEdit(app);
        setIsEditModalOpen(true);
    };

    const weekDates = getWeekDays(currentDate);
    const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00 to 19:00

    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const weekRangeText = `${weekStart.getDate()}-${weekEnd.getDate()} ${months[weekEnd.getMonth()]}`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#202124] flex flex-col animate-in fade-in duration-200">
            {/* Compact Header */}
            <header className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-xl text-gray-600 dark:text-gray-300">arrow_back</span>
                    </button>
                    <span className="material-symbols-outlined text-xl text-blue-600 hidden sm:block">calendar_month</span>
                    <span className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200">Semana</span>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={goToToday} className="px-2 py-1 rounded text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Hoje
                    </button>
                    <button onClick={() => navigate('PREV')} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <span className="text-xs sm:text-sm font-medium min-w-[70px] sm:min-w-[90px] text-center">{weekRangeText}</span>
                    <button onClick={() => navigate('NEXT')} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    {/* Toggle sidebar on mobile */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="sm:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                    >
                        <span className="material-symbols-outlined text-xl">list</span>
                        {filteredAppointments.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 size-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {filteredAppointments.length}
                            </span>
                        )}
                    </button>
                    {/* New appointment button */}
                    {onCreateAppointment && (
                        <button
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                onCreateAppointment(today, '09:00');
                            }}
                            className="p-1.5 sm:px-3 sm:py-1.5 rounded-full sm:rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            <span className="hidden sm:inline text-xs font-medium">Novo</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar - Desktop always visible, Mobile toggleable */}
                <div className={`
                    ${showSidebar ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
                    absolute sm:relative inset-y-0 left-0 z-30
                    w-48 sm:w-44 lg:w-52 
                    border-r border-gray-200 dark:border-gray-700 
                    bg-gray-50 dark:bg-gray-800/50 
                    flex flex-col overflow-hidden
                    transition-transform duration-200 sm:transition-none
                `}>
                    <div className="px-2 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">pets</span>
                            Agendamentos
                        </h3>
                        <button onClick={() => setShowSidebar(false)} className="sm:hidden p-1 rounded hover:bg-gray-200">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                        {filteredAppointments.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <span className="material-symbols-outlined text-2xl mb-1">event_busy</span>
                                <p className="text-[10px]">Nenhum</p>
                            </div>
                        ) : (
                            filteredAppointments.map(app => (
                                <div
                                    key={app.id}
                                    draggable={!isUpdating}
                                    onDragStart={(e) => handleDragStart(e, app)}
                                    onDragEnd={handleDragEnd}
                                    className={`
                                        p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm border-l-3 cursor-grab active:cursor-grabbing
                                        transition-all duration-150 hover:shadow hover:scale-[1.01]
                                        ${app.status === 'CONFIRMED' ? 'border-green-500' : app.status === 'PENDING' ? 'border-orange-500' : 'border-blue-500'}
                                        ${draggedAppointment?.id === app.id ? 'opacity-40 scale-95' : ''}
                                        ${isUpdating ? 'pointer-events-none opacity-60' : ''}
                                    `}
                                    onClick={() => handleEditAppointment(app)}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-6 shrink-0 rounded bg-slate-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center">
                                            {app.pet?.image_url ? (
                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${app.pet.image_url}")` }}></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-xs text-gray-400">pets</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[11px] truncate text-gray-900 dark:text-white leading-tight">
                                                {app.pet?.name || 'Pet'}
                                            </p>
                                            <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                                                {app.profile?.full_name?.split(' ')[0]}
                                                {app.profile?.neighborhood && <span className="text-primary ml-0.5">({app.profile.neighborhood})</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-[9px] text-gray-400">
                                            {new Date(app.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                                        </span>
                                        <span className="text-[10px] font-bold text-primary">{app.scheduled_time.substring(0, 5)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Trash Drop Zone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsOverTrash(true);
                        }}
                        onDragLeave={() => setIsOverTrash(false)}
                        onDrop={handleTrashDrop}
                        className={`
                            px-4 py-3 border-t transition-all duration-200 flex items-center justify-center gap-2
                            ${isOverTrash
                                ? 'bg-red-500 text-white py-6 border-red-600'
                                : 'bg-gray-50 dark:bg-gray-800 text-red-500 border-gray-200 dark:border-gray-700'}
                            ${draggedAppointment ? 'animate-pulse' : ''}
                        `}
                    >
                        <span className={`material-symbols-outlined ${isOverTrash ? 'text-2xl scale-125' : 'text-xl'} transition-transform`}>
                            delete
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {isOverTrash ? 'Soltar para excluir' : 'Excluir'}
                        </span>
                    </div>
                </div>

                {/* Fixed Trash Overlay (Visible when dragging and sidebar is collapsed) */}
                {draggedAppointment && !showSidebar && (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsOverTrash(true);
                        }}
                        onDragLeave={() => setIsOverTrash(false)}
                        onDrop={handleTrashDrop}
                        className={`
                            fixed bottom-4 left-4 z-[60] size-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl
                            ${isOverTrash
                                ? 'bg-red-600 scale-125 ring-4 ring-red-200'
                                : 'bg-red-500 scale-100'}
                            animate-in slide-in-from-bottom-4
                        `}
                    >
                        <span className="material-symbols-outlined text-white text-3xl">delete</span>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Excluir
                        </div>
                    </div>
                )}

                {/* Overlay for mobile sidebar */}
                {showSidebar && (
                    <div
                        className="absolute inset-0 bg-black/30 z-20 sm:hidden"
                        onClick={() => setShowSidebar(false)}
                    />
                )}

                {/* Week Grid - Compact for mobile */}
                <div className="flex-1 overflow-auto bg-white dark:bg-[#202124]">
                    <WeekViewCompact
                        weekDates={weekDates}
                        weekDays={weekDays}
                        weekDaysShort={weekDaysShort}
                        hours={hours}
                        getAppointmentsForDate={getAppointmentsForDate}
                        dropTarget={dropTarget}
                        draggedAppointment={draggedAppointment}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onSlotClick={handleSlotClick}
                        onEditAppointment={handleEditAppointment}
                        hasCreateHandler={!!onCreateAppointment}
                        isUpdating={isUpdating}
                    />
                </div>
            </div>

            {/* Edit Appointment Modal */}
            <AdminEditBookingModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedAppointmentForEdit(null);
                }}
                onSuccess={() => {
                    if (onRefresh) onRefresh();
                }}
                appointment={selectedAppointmentForEdit}
            />

            {/* Loading overlay */}
            {isUpdating && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-xl flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-xs font-medium">Reagendando...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Compact Week View for Mobile ---

interface WeekViewCompactProps {
    weekDates: Date[];
    weekDays: string[];
    weekDaysShort: string[];
    hours: number[];
    getAppointmentsForDate: (dateStr: string) => AppointmentWithDetails[];
    dropTarget: { date: string; hour: number } | null;
    draggedAppointment: AppointmentWithDetails | null;
    onDragStart: (e: React.DragEvent, app: AppointmentWithDetails) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent, date: string, hour: number) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, date: string, hour: number) => void;
    onSlotClick: (date: string, hour: number) => void;
    onEditAppointment: (app: AppointmentWithDetails) => void;
    hasCreateHandler: boolean;
    isUpdating: boolean;
}

const WeekViewCompact: React.FC<WeekViewCompactProps> = ({
    weekDates,
    weekDays,
    weekDaysShort,
    hours,
    getAppointmentsForDate,
    dropTarget,
    draggedAppointment,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onSlotClick,
    onEditAppointment,
    hasCreateHandler,
    isUpdating
}) => {
    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header (Days) - Compact */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#202124] z-10">
                <div className="w-10 sm:w-12 flex-none border-r border-gray-200 dark:border-gray-700"></div>
                {weekDates.map((date: Date, idx: number) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <div key={idx} className="flex-1 text-center py-1.5 sm:py-2 border-l border-gray-200 dark:border-gray-700 min-w-[40px] sm:min-w-[60px]">
                            <div className={`text-[9px] sm:text-[10px] uppercase font-semibold ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                                <span className="hidden sm:inline">{weekDays[date.getDay()]}</span>
                                <span className="sm:hidden">{weekDaysShort[date.getDay()]}</span>
                            </div>
                            <div className={`text-sm sm:text-base font-medium mx-auto h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Grid - Compact */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
                <div className="flex min-w-full">
                    {/* Time Column */}
                    <div className="w-12 sm:w-14 flex-none border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#202124] sticky left-0 z-10">
                        {hours.map(hour => (
                            <div key={hour} className="h-12 sm:h-14 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center">
                                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {String(hour).padStart(2, '0')}
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
                            <div key={dayIdx} className="flex-1 border-l border-gray-200 dark:border-gray-700 relative min-w-[40px] sm:min-w-[60px]">
                                {/* Hour cells */}
                                {hours.map(hour => {
                                    const isDropTarget = dropTarget?.date === dateStr && dropTarget?.hour === hour;

                                    return (
                                        <div
                                            key={hour}
                                            className={`h-12 sm:h-14 border-b border-gray-100 dark:border-gray-800 transition-colors ${isDropTarget ? 'bg-blue-100 dark:bg-blue-900/40 ring-1 ring-inset ring-blue-400' : ''
                                                } ${draggedAppointment ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''} ${hasCreateHandler && !draggedAppointment ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                                                }`}
                                            onDragOver={(e) => onDragOver(e, dateStr, hour)}
                                            onDragLeave={onDragLeave}
                                            onDrop={(e) => onDrop(e, dateStr, hour)}
                                            onClick={() => !draggedAppointment && onSlotClick(dateStr, hour)}
                                        >
                                            {isDropTarget && (
                                                <div className="flex items-center justify-center h-full text-blue-500">
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Positioned appointments */}
                                {dayApps.map((app: AppointmentWithDetails) => {
                                    const [h, m] = app.scheduled_time.split(':').map(Number);
                                    const startHour = 7;
                                    // Mobile: 48px per hour, Desktop: 56px
                                    const topMobile = ((h - startHour) * 48) + ((m / 60) * 48);
                                    const topDesktop = ((h - startHour) * 56) + ((m / 60) * 56);
                                    const heightMobile = 44;
                                    const heightDesktop = 52;

                                    return (
                                        <div
                                            key={app.id}
                                            draggable={!isUpdating}
                                            onDragStart={(e) => onDragStart(e, app)}
                                            onDragEnd={onDragEnd}
                                            className={`absolute left-0.5 right-0.5 rounded p-1 text-[9px] sm:text-[10px] overflow-hidden border-l-2 shadow-sm z-20 cursor-grab active:cursor-grabbing hover:z-30 transition-all duration-150 ${app.status === 'CONFIRMED'
                                                ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-800 dark:text-green-200'
                                                : app.status === 'PENDING'
                                                    ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-500 text-orange-800 dark:text-orange-200'
                                                    : 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-800 dark:text-blue-200'
                                                } ${draggedAppointment?.id === app.id ? 'opacity-30 scale-95' : 'hover:scale-[1.02] hover:shadow-md'} ${isUpdating ? 'pointer-events-none opacity-60' : ''}`}
                                            style={{
                                                top: `${topMobile}px`,
                                                height: `${heightMobile}px`,
                                            }}
                                            title={`${app.scheduled_time} - ${app.pet?.name}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditAppointment(app);
                                            }}
                                        >
                                            <div className="font-bold truncate leading-tight">{app.pet?.name}</div>
                                            <div className="opacity-70 truncate leading-tight hidden sm:block">
                                                {app.scheduled_time.substring(0, 5)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Hint for creating */}
            {hasCreateHandler && (
                <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border-t border-blue-100 dark:border-blue-800 text-center">
                    <p className="text-[10px] text-blue-600 dark:text-blue-300 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">touch_app</span>
                        Toque em um horário vazio para agendar
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminCalendarView;
