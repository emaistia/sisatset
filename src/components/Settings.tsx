import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { supabase, Child, Note, ShoppingItem } from '../lib/supabase';
import { Settings as SettingsIcon, Users, Calendar, StickyNote, ShoppingCart, LogOut, Plus, X, Trash2, Zap } from 'lucide-react';
import QuickInput from './QuickInput';

const COLORS = ['#FF6B9D', '#FF8C42', '#FFD93D', '#6BCF7F', '#4ECDC4', '#A78BFA'];
const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, children, refreshProfile, refreshChildren } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [mamaName, setMamaName] = useState('');
  const [showChildrenGreeting, setShowChildrenGreeting] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', grade: '', color: COLORS[0] });
  const [selectedChildForSchedule, setSelectedChildForSchedule] = useState<Child | null>(null);
  const [scheduleDay, setScheduleDay] = useState('senin');
  const [scheduleData, setScheduleData] = useState({ subjects: '', uniform: '', school_hours: '' });
  const [notes, setNotes] = useState<Note[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [showQuickNotes, setShowQuickNotes] = useState(false);

  useEffect(() => {
    if (profile) {
      setMamaName(profile.mama_name);
      setShowChildrenGreeting(profile.show_children_in_greeting);
    }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'notes' && user) loadNotes();
    if (activeTab === 'shopping' && user) loadShoppingList();
  }, [activeTab, user]);

  useEffect(() => {
    const loadExistingSchedule = async () => {
      if (!selectedChildForSchedule || !scheduleDay) return;

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('child_id', selectedChildForSchedule.id)
        .eq('day_of_week', scheduleDay)
        .maybeSingle();

      if (data && !error) {
        setScheduleData({
          subjects: Array.isArray(data.subjects) ? data.subjects.join(', ') : '',
          uniform: data.uniform || '',
          school_hours: data.school_hours || '',
        });
      } else {
        setScheduleData({ subjects: '', uniform: '', school_hours: '' });
      }
    };

    loadExistingSchedule();
  }, [selectedChildForSchedule, scheduleDay]);

  const loadNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setNotes(data);
  };

  const loadShoppingList = async () => {
    if (!user) return;
    const { data } = await supabase.from('shopping_list').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setShoppingList(data);
  };

  const handleUpdateProfile = async () => {
    if (!user || !mamaName.trim()) return;
    await supabase.from('user_profiles').update({
      mama_name: mamaName,
      show_children_in_greeting: showChildrenGreeting,
    }).eq('id', user.id);
    await refreshProfile();
  };

  const handleAddChild = async () => {
    if (!user || !newChild.name.trim() || !newChild.grade.trim()) return;
    await supabase.from('children').insert({
      user_id: user.id,
      name: newChild.name,
      grade: newChild.grade,
      color: newChild.color,
    });
    setNewChild({ name: '', grade: '', color: COLORS[0] });
    setShowAddChild(false);
    await refreshChildren();
    window.dispatchEvent(new CustomEvent('scheduleUpdated'));
  };

  const handleDeleteChild = async (id: string) => {
    if (confirm('Hapus data anak ini? Semua jadwal dan PR akan ikut terhapus.')) {
      await supabase.from('children').delete().eq('id', id);
      await refreshChildren();
      window.dispatchEvent(new CustomEvent('scheduleUpdated'));
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedChildForSchedule) {
      alert('Pilih anak terlebih dahulu!');
      return;
    }

    const subjects = scheduleData.subjects.split(',').map(s => s.trim()).filter(s => s);

    const { data, error } = await supabase.from('schedules').upsert({
      child_id: selectedChildForSchedule.id,
      day_of_week: scheduleDay,
      subjects,
      uniform: scheduleData.uniform,
      school_hours: scheduleData.school_hours,
    }, { onConflict: 'child_id,day_of_week' });

    if (error) {
      console.error('Error saving schedule:', error);
      alert('Gagal menyimpan jadwal: ' + error.message);
      return;
    }

    window.dispatchEvent(new CustomEvent('scheduleUpdated'));
    alert('Jadwal berhasil disimpan!');
  };

  const handleAddNote = async () => {
    if (!user || !newNote.trim()) return;
    await supabase.from('notes').insert({
      user_id: user.id,
      content: newNote,
      pinned: false,
      done: false,
    });
    setNewNote('');
    loadNotes();
  };

  const togglePinNote = async (id: string, pinned: boolean) => {
    await supabase.from('notes').update({ pinned: !pinned }).eq('id', id);
    loadNotes();
  };

  const toggleDoneNote = async (id: string, done: boolean) => {
    await supabase.from('notes').update({ done: !done }).eq('id', id);
    loadNotes();
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    loadNotes();
  };

  const handleAddShoppingItem = async () => {
    if (!user || !newShoppingItem.trim()) return;
    await supabase.from('shopping_list').insert({
      user_id: user.id,
      item: newShoppingItem,
      checked: false,
    });
    setNewShoppingItem('');
    loadShoppingList();
  };

  const toggleCheckItem = async (id: string, checked: boolean) => {
    await supabase.from('shopping_list').update({ checked: !checked }).eq('id', id);
    loadShoppingList();
  };

  const deleteShoppingItem = async (id: string) => {
    await supabase.from('shopping_list').delete().eq('id', id);
    loadShoppingList();
  };

  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar?')) {
      await signOut();
    }
  };

  const handleQuickNotes = async (text: string) => {
    if (!user) return;

    const lines = text.split('\n').filter(line => line.trim());
    let saved = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        await supabase.from('notes').insert({
          user_id: user.id,
          content: trimmed,
          pinned: false,
          done: false,
        });
        saved++;
      }
    }

    setShowQuickNotes(false);
    loadNotes();
    alert(`Berhasil menambahkan ${saved} catatan!`);
  };

  const handleQuickSchedule = async (text: string) => {
    if (!selectedChildForSchedule) {
      alert('Pilih anak terlebih dahulu!');
      return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    const schedulesByDay: { [key: string]: { subjects: string[], uniform: string, hours: string } } = {};

    let currentDay = '';
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();

      if (DAYS.some(day => trimmed.includes(day))) {
        const foundDay = DAYS.find(day => trimmed.includes(day));
        if (foundDay) currentDay = foundDay;
        schedulesByDay[currentDay] = { subjects: [], uniform: '', hours: '' };
      } else if (currentDay && trimmed) {
        if (trimmed.includes('jam') || trimmed.match(/\d{1,2}[:.-]\d{2}/)) {
          schedulesByDay[currentDay].hours = line.trim();
        } else if (trimmed.includes('seragam') || trimmed.includes('baju')) {
          schedulesByDay[currentDay].uniform = line.replace(/seragam:?|baju:?/gi, '').trim();
        } else {
          schedulesByDay[currentDay].subjects.push(line.trim());
        }
      }
    }

    let saved = 0;
    for (const [day, data] of Object.entries(schedulesByDay)) {
      if (data.subjects.length > 0 || data.uniform || data.hours) {
        const { error } = await supabase.from('schedules').upsert({
          child_id: selectedChildForSchedule.id,
          day_of_week: day,
          subjects: data.subjects,
          uniform: data.uniform,
          school_hours: data.hours,
        }, { onConflict: 'child_id,day_of_week' });

        if (!error) saved++;
      }
    }

    window.dispatchEvent(new CustomEvent('scheduleUpdated'));
    setShowQuickSchedule(false);
    alert(`Berhasil menyimpan ${saved} jadwal!`);
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <SettingsIcon size={28} />
          <h1 className="text-2xl font-bold">Pengaturan</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'profile', label: 'Profil', icon: SettingsIcon },
              { id: 'children', label: 'Anak', icon: Users },
              { id: 'schedule', label: 'Jadwal', icon: Calendar },
              { id: 'notes', label: 'Catatan', icon: StickyNote },
              { id: 'shopping', label: 'Belanja', icon: ShoppingCart },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                <Icon size={18} className="inline mr-1" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mama</label>
                  <input
                    type="text"
                    value={mamaName}
                    onChange={(e) => setMamaName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showChildrenGreeting}
                    onChange={(e) => setShowChildrenGreeting(e.target.checked)}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                  />
                  <label className="text-sm text-gray-700">
                    Tampilkan nama anak di sapaan dashboard
                  </label>
                </div>

                <button
                  onClick={handleUpdateProfile}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium"
                >
                  Simpan Profil
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <LogOut size={20} />
                  Keluar
                </button>
              </div>
            )}

            {activeTab === 'children' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowAddChild(true)}
                  className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Tambah Anak
                </button>

                {children.map((child) => (
                  <div key={child.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: child.color }} />
                      <div>
                        <p className="font-semibold text-gray-800">{child.name}</p>
                        <p className="text-sm text-gray-600">{child.grade}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteChild(child.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowQuickSchedule(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-3"
                >
                  <Zap size={20} />
                  Quick Input Jadwal (Copy-Paste dari WA)
                </button>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Anak</label>
                  <select
                    value={selectedChildForSchedule?.id || ''}
                    onChange={(e) => {
                      const child = children.find(c => c.id === e.target.value);
                      setSelectedChildForSchedule(child || null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Pilih anak</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </select>
                </div>

                {selectedChildForSchedule && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hari</label>
                      <select
                        value={scheduleDay}
                        onChange={(e) => setScheduleDay(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                      >
                        {DAYS.map((day) => (
                          <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mata Pelajaran (pisahkan dengan koma)
                      </label>
                      <input
                        type="text"
                        value={scheduleData.subjects}
                        onChange={(e) => setScheduleData({ ...scheduleData, subjects: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                        placeholder="Matematika, Bahasa Indonesia, IPA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Seragam</label>
                      <input
                        type="text"
                        value={scheduleData.uniform}
                        onChange={(e) => setScheduleData({ ...scheduleData, uniform: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                        placeholder="Putih Merah, Batik, Olahraga"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jam Sekolah</label>
                      <input
                        type="text"
                        value={scheduleData.school_hours}
                        onChange={(e) => setScheduleData({ ...scheduleData, school_hours: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                        placeholder="07:00 - 13:00"
                      />
                    </div>

                    <button
                      onClick={handleSaveSchedule}
                      className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium"
                    >
                      Simpan Jadwal
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowQuickNotes(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 mb-3"
                >
                  <Zap size={20} />
                  Quick Input Notes (Batch)
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Tambah catatan..."
                  />
                  <button
                    onClick={handleAddNote}
                    className="bg-pink-500 text-white p-2 rounded-lg"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className={`border rounded-lg p-3 ${note.done ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={note.done}
                          onChange={() => toggleDoneNote(note.id, note.done)}
                          className="mt-1"
                        />
                        <p className={`flex-1 ${note.done ? 'line-through' : ''}`}>{note.content}</p>
                        <button
                          onClick={() => togglePinNote(note.id, note.pinned)}
                          className={note.pinned ? 'text-yellow-500' : 'text-gray-400'}
                        >
                          📌
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'shopping' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newShoppingItem}
                    onChange={(e) => setNewShoppingItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddShoppingItem()}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                    placeholder="Tambah item belanja..."
                  />
                  <button
                    onClick={handleAddShoppingItem}
                    className="bg-pink-500 text-white p-2 rounded-lg"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div className="space-y-2">
                  {shoppingList.map((item) => (
                    <div key={item.id} className={`border rounded-lg p-3 ${item.checked ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleCheckItem(item.id, item.checked)}
                        />
                        <p className={`flex-1 ${item.checked ? 'line-through' : ''}`}>{item.item}</p>
                        <button
                          onClick={() => deleteShoppingItem(item.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tambah Anak</h2>
              <button onClick={() => setShowAddChild(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={newChild.name}
                  onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                <input
                  type="text"
                  value={newChild.grade}
                  onChange={(e) => setNewChild({ ...newChild, grade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                  placeholder="TK A, SD 1, SMP 2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warna</label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewChild({ ...newChild, color })}
                      className={`w-8 h-8 rounded-full ${newChild.color === color ? 'ring-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddChild}
                disabled={!newChild.name.trim() || !newChild.grade.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickSchedule && (
        <QuickInput
          onClose={() => setShowQuickSchedule(false)}
          onSubmit={handleQuickSchedule}
          title="Quick Input Jadwal"
          placeholder="Senin
Matematika
Bahasa Indonesia
IPA
Jam: 07:00 - 13:00
Seragam: Putih Merah

Selasa
Bahasa Inggris
IPS
..."
          helperText="Copy-paste jadwal dari WhatsApp atau ketik manual. Format: nama hari, lalu mata pelajaran per baris, bisa tambah jam dan seragam."
        />
      )}

      {showQuickNotes && (
        <QuickInput
          onClose={() => setShowQuickNotes(false)}
          onSubmit={handleQuickNotes}
          title="Quick Input Notes"
          placeholder="Beli buku tulis untuk Rania
Bayar SPP sebelum tanggal 10
Siapkan kostum pentas seni
Cek jadwal ekskul
Lengkapi form pendaftaran les"
          helperText="Copy-paste list catatan atau ketik manual. Satu catatan per baris."
        />
      )}
    </div>
  );
}
