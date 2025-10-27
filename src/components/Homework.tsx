import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Homework as HomeworkType, Child } from '../lib/supabase';
import { BookOpen, Plus, Check, X, Trash2, Zap } from 'lucide-react';
import QuickInput from './QuickInput';

export default function Homework() {
  const { user } = useAuth();
  const { children, selectedChild, setSelectedChild } = useApp();
  const [homework, setHomework] = useState<(HomeworkType & { children: Child })[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [newHomework, setNewHomework] = useState({
    child_id: '',
    subject: '',
    description: '',
    deadline: '',
  });

  useEffect(() => {
    if (user) {
      loadHomework();
    }
  }, [user, selectedChild]);

  useEffect(() => {
    if (showAddModal && selectedChild) {
      setNewHomework((prev) => ({ ...prev, child_id: selectedChild.id }));
    }
  }, [showAddModal, selectedChild]);

  const loadHomework = async () => {
    if (!user) return;

    let query = supabase
      .from('homework')
      .select('*, children!inner(id, name, grade, color)');

    if (selectedChild) {
      query = query.eq('child_id', selectedChild.id);
    }

    const { data } = await query.order('deadline', { ascending: true });

    if (data) setHomework(data as any);
  };

  const handleAdd = async () => {
    if (!user || !newHomework.child_id || !newHomework.subject || !newHomework.deadline) {
      alert('Harap lengkapi: anak, mata pelajaran, dan deadline!');
      return;
    }

    const { error } = await supabase.from('homework').insert({
      user_id: user.id,
      ...newHomework,
      completed: false,
    });

    if (error) {
      console.error('Error adding homework:', error);
      alert('Gagal menambahkan PR');
      return;
    }

    setNewHomework({ child_id: '', subject: '', description: '', deadline: '' });
    setShowAddModal(false);
    loadHomework();
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    await supabase.from('homework').update({ completed: !completed }).eq('id', id);
    loadHomework();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus PR ini?')) {
      await supabase.from('homework').delete().eq('id', id);
      loadHomework();
    }
  };

  const handleQuickInput = async (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const homeworkList: Array<{ child_id: string; subject: string; description: string; deadline: string }> = [];

    let currentChild = selectedChild?.id || children[0]?.id;
    let currentSubject = '';
    let currentDesc = '';
    let currentDeadline = '';

    for (const line of lines) {
      const trimmed = line.trim();
      const lowerLine = trimmed.toLowerCase();

      const childMatch = children.find(c => lowerLine.includes(c.name.toLowerCase()));
      if (childMatch) {
        currentChild = childMatch.id;
        continue;
      }

      const dateMatch = trimmed.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const fullYear = year ? (year.length === 2 ? '20' + year : year) : new Date().getFullYear();
        currentDeadline = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        continue;
      }

      if (lowerLine.includes('deadline:') || lowerLine.includes('sampai:') || lowerLine.includes('tenggat:')) {
        const dateText = trimmed.split(':')[1]?.trim();
        if (dateText) {
          const match = dateText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/);
          if (match) {
            const [, day, month, year] = match;
            const fullYear = year ? (year.length === 2 ? '20' + year : year) : new Date().getFullYear();
            currentDeadline = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        continue;
      }

      if (lowerLine.includes('pr ') || lowerLine.includes('tugas ') || trimmed.includes(':')) {
        if (currentSubject && currentChild) {
          homeworkList.push({
            child_id: currentChild,
            subject: currentSubject,
            description: currentDesc,
            deadline: currentDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
        }
        currentSubject = trimmed.replace(/^(pr|tugas)\s+/i, '').split(':')[0].trim();
        currentDesc = trimmed.includes(':') ? trimmed.split(':').slice(1).join(':').trim() : '';
        currentDeadline = '';
      } else if (currentSubject) {
        currentDesc += (currentDesc ? ' ' : '') + trimmed;
      }
    }

    if (currentSubject && currentChild) {
      homeworkList.push({
        child_id: currentChild,
        subject: currentSubject,
        description: currentDesc,
        deadline: currentDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }

    if (homeworkList.length === 0) {
      alert('Tidak ada PR yang terdeteksi. Pastikan format benar!');
      return;
    }

    for (const hw of homeworkList) {
      await supabase.from('homework').insert(hw);
    }

    setShowQuickInput(false);
    loadHomework();
    alert(`Berhasil menambahkan ${homeworkList.length} PR!`);
  };

  const getFilteredHomework = (completed: boolean) => {
    return homework.filter((hw) => hw.completed === completed);
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen size={28} />
            <h1 className="text-2xl font-bold">PR & Tugas</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-pink-600 p-2 rounded-full hover:bg-pink-50 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedChild(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedChild
                  ? 'bg-white text-pink-600'
                  : 'bg-pink-400 text-white hover:bg-pink-300'
              }`}
            >
              Semua Anak
            </button>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedChild?.id === child.id
                    ? 'bg-white text-pink-600'
                    : 'bg-pink-400 text-white hover:bg-pink-300'
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <button
          onClick={() => setShowQuickInput(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md"
        >
          <Zap size={20} />
          Quick Input PR (Copy-Paste dari WA)
        </button>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="font-bold text-gray-800 mb-4">Belum Selesai</h2>
          {getFilteredHomework(false).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Tidak ada PR yang perlu dikerjakan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getFilteredHomework(false).map((hw) => {
                const deadline = new Date(hw.deadline);
                const today = new Date();
                const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= 2;

                return (
                  <div
                    key={hw.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleComplete(hw.id, hw.completed)}
                        className="mt-1 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center justify-center"
                      >
                        {hw.completed && <Check size={16} className="text-green-500" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: hw.children.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {hw.children.name} - {hw.children.grade}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-800">{hw.subject}</h3>
                        {hw.description && (
                          <p className="text-sm text-gray-600 mt-1">{hw.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-xs text-gray-500">
                            {deadline.toLocaleDateString('id-ID')}
                          </p>
                          {isUrgent && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                              Mendesak!
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(hw.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {getFilteredHomework(true).length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Selesai</h2>
            <div className="space-y-3">
              {getFilteredHomework(true).map((hw) => (
                <div
                  key={hw.id}
                  className="border border-gray-200 rounded-lg p-4 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(hw.id, hw.completed)}
                      className="mt-1 w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center"
                    >
                      <Check size={16} className="text-white" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hw.children.color }}
                        />
                        <span className="text-sm text-gray-600">
                          {hw.children.name} - {hw.children.grade}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 line-through">{hw.subject}</h3>
                    </div>

                    <button
                      onClick={() => handleDelete(hw.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Tambah PR</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anak
                </label>
                <select
                  value={newHomework.child_id}
                  onChange={(e) =>
                    setNewHomework({ ...newHomework, child_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Pilih anak</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} ({child.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={newHomework.subject}
                  onChange={(e) =>
                    setNewHomework({ ...newHomework, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Matematika, Bahasa Indonesia, dll"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={newHomework.description}
                  onChange={(e) =>
                    setNewHomework({ ...newHomework, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Detail tugas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  value={newHomework.deadline}
                  onChange={(e) =>
                    setNewHomework({ ...newHomework, deadline: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!newHomework.child_id || !newHomework.subject || !newHomework.deadline}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah PR
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickInput && (
        <QuickInput
          onClose={() => setShowQuickInput(false)}
          onSubmit={handleQuickInput}
          title="Quick Input PR"
          placeholder="PR Matematika: Halaman 45-50
Deadline: 25/10/2025

Tugas IPA: Buat laporan percobaan
30/10/2025

PR Bahasa Indonesia
Karangan tentang liburan
01/11/2025"
          helperText="Copy-paste dari WhatsApp atau ketik manual. Bisa include nama anak, mata pelajaran, deskripsi, dan deadline (format: DD/MM/YYYY atau DD/MM)"
        />
      )}
    </div>
  );
}
