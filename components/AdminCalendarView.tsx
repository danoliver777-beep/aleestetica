import React, { useState, useMemo } from 'react';
import { AppointmentWithDetails } from '../lib/database';

interface AdminCalendarViewProps {
    isOpen: boolean;
    onClose: () => void;
    appointments: AppointmentWithDetails[];
}

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({ isOpen, onClose, appointments }) => {
    const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('MONTH');
    const [currentDate, setCurrentDate] = useState(new Date());

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const filteredAppointments = useMemo(() => {
        return appointments.filter(app => app.status !== 'CANCELLED');
    }, [appointments]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay();
    };

    const navigate = (direction: 'PREV' | 'NEXT') => {
        const newDate = new Date(currentDate);
        if (viewMode === 'MONTH') {
            newDate.setMonth(newDate.getMonth() + (direction === 'NEXT' ? 1 : -1));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'NEXT' ? 7 : -7));
        }
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
                            <span className="font-medium hidden sm:inline">Agenda</span>
                        </span>
                    </div>

                    {/* Toggle Semana/Mês - Visível em mobile */}
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 flex text-sm sm:hidden">
                        <button
                            onClick={() => setViewMode('WEEK')}
                            className={`px-3 py-1.5 rounded-md font-medium transition-all ${viewMode === 'WEEK' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setViewMode('MONTH')}
                            className={`px-3 py-1.5 rounded-md font-medium transition-all ${viewMode === 'MONTH' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            Mês
                        </button>
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
                    <h2 className="text-base sm:text-lg font-normal ml-1 sm:ml-2 min-w-[100px] sm:min-w-[150px]">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>

                {/* Toggle Semana/Mês - Desktop */}
                <div className="hidden sm:flex items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 flex text-sm">
                        <button
                            onClick={() => setViewMode('WEEK')}
                            className={`px-3 py-1.5 rounded-md font-medium transition-all ${viewMode === 'WEEK' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setViewMode('MONTH')}
                            className={`px-3 py-1.5 rounded-md font-medium transition-all ${viewMode === 'MONTH' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                        >
                            Mês
                        </button>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                        A
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-white dark:bg-[#202124]">
                {viewMode === 'MONTH' ? (
                    <MonthView
                        currentDate={currentDate}
                        weekDays={weekDays}
                        appointments={filteredAppointments}
                        getDaysInMonth={getDaysInMonth}
                        getFirstDayOfMonth={getFirstDayOfMonth}
                        getAppointmentsForDate={getAppointmentsForDate}
                    />
                ) : (
                    <WeekView
                        currentDate={currentDate}
                        weekDays={weekDays}
                        appointments={filteredAppointments}
                        getWeekDays={getWeekDays}
                        getAppointmentsForDate={getAppointmentsForDate}
                    />
                )}
            </div>
        </div>
    );
};

// --- Sub Components ---

const MonthView: React.FC<any> = ({ currentDate, weekDays, getDaysInMonth, getFirstDayOfMonth, getAppointmentsForDate }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    return (
        <div className="h-full flex flex-col">
            {/* Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {weekDays.map((day: string) => (
                    <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
                {days.map((day, idx) => {
                    const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                    const dayApps = day ? getAppointmentsForDate(dateStr) : [];
                    const isToday = day &&
                        new Date().getDate() === day &&
                        new Date().getMonth() === month &&
                        new Date().getFullYear() === year;

                    return (
                        <div
                            key={idx}
                            className={`min-h-[100px] border-b border-r border-gray-200 dark:border-gray-700 p-1 lg:p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 ${!day ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}
                        >
                            {day && (
                                <>
                                    <div className="flex justify-center mb-1">
                                        <span className={`text-xs font-medium h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
                                            {day}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        {dayApps.map((app: any) => (
                                            <div
                                                key={app.id}
                                                className={`truncate text-[10px] px-1.5 py-0.5 rounded border-l-2 ${app.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500'}`}
                                                title={`${app.scheduled_time} - ${app.pet?.name} - ${app.profile?.full_name} (${app.service?.name})`}
                                            >
                                                <span className="font-bold mr-1">{app.scheduled_time.substring(0, 5)}</span>
                                                {app.pet?.name} <span className="opacity-70">- {app.profile?.full_name?.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const WeekView: React.FC<any> = ({ currentDate, weekDays, getWeekDays, getAppointmentsForDate }) => {
    const weekDates = getWeekDays(currentDate);
    const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 to 22:00

    return (
        <div className="flex h-full flex-col overflow-hidden">
            {/* Header (Days) */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 ml-14">
                {weekDates.map((date: Date, idx: number) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                        <div key={idx} className="flex-1 text-center py-3 border-l border-gray-200 dark:border-gray-700">
                            <div className={`text-xs uppercase font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                {weekDays[date.getDay()]}
                            </div>
                            <div className={`text-2xl font-normal mx-auto h-10 w-10 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-800 dark:text-gray-200'}`}>
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
                            <div key={hour} className="h-20 border-b border-gray-100 dark:border-gray-800 relative">
                                <span className="absolute -top-3 left-2 text-xs text-gray-400 bg-white dark:bg-[#202124] px-1">
                                    {String(hour).padStart(2, '0')}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map((date: Date, dayIdx: number) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayApps = getAppointmentsForDate(dateStr);

                        return (
                            <div key={dayIdx} className="flex-1 border-l border-gray-200 dark:border-gray-700 relative min-w-[120px]">
                                {/* Background Lines */}
                                {hours.map(hour => (
                                    <div key={hour} className="h-20 border-b border-gray-100 dark:border-gray-800"></div>
                                ))}

                                {/* Events */}
                                {dayApps.map((app: any) => {
                                    const [h, m] = app.scheduled_time.split(':').map(Number);
                                    const startHour = 7;
                                    const top = ((h - startHour) * 80) + ((m / 60) * 80); // 80px per hour

                                    // Duration Mock (assume 1h if not present) or use service duration
                                    // For now fixed height 60px approx 45min
                                    const height = 70;

                                    return (
                                        <div
                                            key={app.id}
                                            className={`absolute left-1 right-1 rounded-md p-2 text-xs overflow-hidden border-l-4 shadow-sm cursor-pointer hover:brightness-95 transition-all z-10 ${app.status === 'CONFIRMED'
                                                ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-900 dark:text-green-100'
                                                : 'bg-blue-100 dark:bg-blue-900/40 border-blue-500 text-blue-900 dark:text-blue-100'
                                                }`}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                            title={`${app.scheduled_time} - ${app.pet?.name} - ${app.profile?.full_name}`}
                                        >
                                            <div className="font-bold mb-0.5">{app.pet?.name}</div>
                                            <div className="text-[10px] opacity-80">{app.scheduled_time} - {app.profile?.full_name?.split(' ')[0]}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Current Time Line (if today) */}
                {/* Logic omitted for brevity, can be added later */}
            </div>
        </div>
    );
};

export default AdminCalendarView;
