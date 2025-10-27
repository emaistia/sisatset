import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { supabase, Event, Child } from '../lib/supabase';
import { Calendar as CalendarIcon, Plus, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import QuickInput from './QuickInput';

const CATEGORIES = ['Sekolah', 'Les', 'Ekstrakurikuler', 'Acara Keluarga', 'Lainnya'];

export default function Calendar() {
  const { user } = useAuth();
  const { children } = useApp();
  const [events, setEvents] = useState<(Event & { child_name?: string; child_color?: string })[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<(Event & { child_name?: string; child_color?: string })[] | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Sekolah',
    event_date: '',
    event_time: '',
    notes: '',
    child_id: '',
  });

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentDate]);

  const loadEvents = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', startOfMonth.toISOString().split('T')[0])
      .lte('event_date', endOfMonth.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (data) {
      const eventsWithChild = data.map((event) => {
        if (event.child_id) {
          const child = children.find((c) => c.id === event.child_id);
          return {
            ...event,
            child_name: child?.name,
            child_color: child?.color,
          };
        }
        return event;
      });
      setEvents(eventsWithChild as any);
    }
  };

  const handleAddEvent = async () => {
    if (!user || !newEvent.title || !newEvent.event_date) return;

    await supabase.from('events').insert({
      user_id: user.id,
      title: newEvent.title,
      category: newEvent.category,
      event_date: newEvent.event_date,
      event_time: newEvent.event_time,
      notes: newEvent.notes,
      child_id: newEvent.child_id || null,
    });

    setNewEvent({
      title: '',
      category: 'Sekolah',
      event_date: '',
      event_time: '',
      notes: '',
      child_id: '',
    });
    setShowAddModal(false);
    loadEvents();
  };

  const handleDeleteEvent = async (id: string) => {
    if (confirm('Hapus event ini?')) {
      await supabase.from('events').delete().eq('id', id);
      loadEvents();
    }
  };

  const handleQuickInput = async (text: string) => {
    if (!user) return;

    const lines = text.split('\n').filter((line) => line.trim());
    const eventsList: Array<{
      title: string;
      category: string;
      event_date: string;
      event_time: string;
      notes: string;
      child_id: string | null;
    }> = [];

    let currentCategory = 'Lainnya';
    let currentChild: string | null = null;
    let currentDate = '';
    let currentTime = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const lowerLine = trimmed.toLowerCase();

      const categoryMatch = CATEGORIES.find((cat) => lowerLine.includes(cat.toLowerCase()));
      if (categoryMatch) {
        currentCategory = categoryMatch;
        continue;
      }

      const childMatch = children.find((c) => lowerLine.includes(c.name.toLowerCase()));
      if (childMatch) {
        currentChild = childMatch.id;
      }

      const dateMatch = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year ? (year.length === 2 ? '20' + year : year) : currentDate.getFullYear().toString();
        currentDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        currentTime = timeMatch[0];
      }

      if (!dateMatch && !timeMatch && !categoryMatch && !childMatch && trimmed) {
        const title = trimmed.replace(/^[-*•]\s*/, '');
        if (title && currentDate) {
          eventsList.push({
            title,
            category: currentCategory,
            event_date: currentDate,
            event_time: currentTime,
            notes: '',
            child_id: currentChild,
          });
        }
      }
    }

    if (eventsList.length === 0) {
      alert('Tidak ada event yang terdeteksi!');
      return;
    }

    for (const event of eventsList) {
      await supabase.from('events').insert({
        user_id: user.id,
        ...event,
      });
    }

    setShowQuickInput(false);
    loadEvents();
    alert(`Berhasil menambahkan ${eventsList.length} event!`);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;

    return events.filter((event) => {
      if (selectedCategory !== 'Semua' && event.category !== selectedCategory) return false;
      return event.event_date === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const days = getDaysInMonth();
  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date())
    .filter((e) => selectedCategory === 'Semua' || e.category === selectedCategory)
    .slice(0, 5);

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon size={28} />
            <h1 className="text-2xl font-bold">Kalender</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowQuickInput(true)}
              className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              <Sparkles size={20} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-pink-600 p-2 rounded-full hover:bg-pink-50 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'Semua' ? 'bg-white text-pink-600' : 'bg-pink-400 text-white hover:bg-pink-300'
            }`}
          >
            Semua
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-white text-pink-600' : 'bg-pink-400 text-white hover:bg-pink-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <h2 className="text-lg font-bold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday =
                day &&
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();
              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={index}
                  onClick={() => day && hasEvents && setSelectedDateEvents(dayEvents)}
                  className={`min-h-[50px] border rounded-lg p-1 text-left relative ${
                    day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50 cursor-default'
                  } ${isToday ? 'ring-2 ring-pink-400' : ''} ${hasEvents ? 'hover:ring-2 hover:ring-pink-200' : ''}`}
                  disabled={!day || !hasEvents}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-semibold ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      {hasEvents && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: event.child_color || '#EC4899',
                              }}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="text-[8px] text-gray-500">+{dayEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Event Mendatang</h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.event_date);
                const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                    style={{ borderLeftWidth: '4px', borderLeftColor: event.child_color || '#EC4899' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{event.title}</h3>
                        {event.child_name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {event.child_name}
                          </span>
                        )}
                        <div className="text-sm text-gray-600 mt-1">
                          {dayNames[eventDate.getDay()]}, {eventDate.getDate()} {monthNamesShort[eventDate.getMonth()]}
                          {event.event_time && ` • ${event.event_time}`}
                        </div>
                        {event.notes && <p className="text-sm text-gray-600 mt-1">{event.notes}</p>}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 mt-2 inline-block">
                          {event.category}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-800">Tambah Event</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="Nama event"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {children.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anak (opsional)</label>
                  <select
                    value={newEvent.child_id}
                    onChange={(e) => setNewEvent({ ...newEvent, child_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Semua / Tidak spesifik</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Waktu (opsional)</label>
                <input
                  type="time"
                  value={newEvent.event_time}
                  onChange={(e) => setNewEvent({ ...newEvent, event_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 resize-none"
                  rows={3}
                  placeholder="Catatan tambahan"
                />
              </div>

              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.event_date}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah Event
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickInput && (
        <QuickInput
          onClose={() => setShowQuickInput(false)}
          onSubmit={handleQuickInput}
          title="Quick Input Event"
          placeholder="Sekolah
Lomba OMNAS - Rara
26/10/2025
10:30
Bawa pensil 2B, papan, seragam

Les
Ujian Piano
28/10/2025
15:00"
          helperText="Copy-paste event dari WhatsApp atau ketik manual. Format: kategori (opsional), judul event, tanggal (DD/MM/YYYY), waktu (HH:MM, opsional), catatan (opsional). Bisa include nama anak."
        />
      )}

      {selectedDateEvents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50" onClick={() => setSelectedDateEvents(null)}>
          <div className="bg-white rounded-t-3xl w-full max-w-2xl max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-lg font-bold text-gray-800">
                Event - {selectedDateEvents[0]?.event_date && new Date(selectedDateEvents[0].event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => setSelectedDateEvents(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  style={{ borderLeftWidth: '4px', borderLeftColor: event.child_color || '#EC4899' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-base">{event.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {event.child_name && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {event.child_name}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {event.category}
                        </span>
                      </div>
                      {event.event_time && (
                        <div className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                          <CalendarIcon size={14} />
                          {event.event_time}
                        </div>
                      )}
                      {event.notes && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{event.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                        if (selectedDateEvents.length === 1) {
                          setSelectedDateEvents(null);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
