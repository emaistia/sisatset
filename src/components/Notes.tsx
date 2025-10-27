import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Note } from '../lib/supabase';
import { StickyNote, Plus, X, Pin, Check, Trash2 } from 'lucide-react';

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) setNotes(data);
  };

  const handleAdd = async () => {
    if (!user || !newNote.trim()) return;

    await supabase.from('notes').insert({
      user_id: user.id,
      content: newNote.trim(),
      pinned: false,
      done: false,
    });

    setNewNote('');
    setShowAddModal(false);
    loadNotes();
  };

  const togglePin = async (id: string, currentPinned: boolean) => {
    await supabase
      .from('notes')
      .update({ pinned: !currentPinned, updated_at: new Date().toISOString() })
      .eq('id', id);
    loadNotes();
  };

  const toggleDone = async (id: string, currentDone: boolean) => {
    await supabase
      .from('notes')
      .update({ done: !currentDone, updated_at: new Date().toISOString() })
      .eq('id', id);
    loadNotes();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      await supabase.from('notes').delete().eq('id', id);
      loadNotes();
    }
  };

  const pinnedNotes = notes.filter((n) => n.pinned && !n.done);
  const activeNotes = notes.filter((n) => !n.pinned && !n.done);
  const doneNotes = notes.filter((n) => n.done);

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StickyNote size={28} />
            <h1 className="text-2xl font-bold">Catatan</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-pink-600 p-2 rounded-full hover:bg-pink-50 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {pinnedNotes.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Pin size={18} className="text-yellow-500" />
              Catatan Penting
            </h2>
            <div className="space-y-3">
              {pinnedNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDone(note.id, note.done)}
                      className="mt-1 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      {note.done && <Check size={16} className="text-green-500" />}
                    </button>

                    <p className="flex-1 text-gray-800">{note.content}</p>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => togglePin(note.id, note.pinned)}
                        className="text-yellow-600 hover:text-yellow-700 p-1"
                        title="Unpin"
                      >
                        <Pin size={18} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNotes.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Catatan Aktif</h2>
            <div className="space-y-3">
              {activeNotes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDone(note.id, note.done)}
                      className="mt-1 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      {note.done && <Check size={16} className="text-green-500" />}
                    </button>

                    <p className="flex-1 text-gray-700">{note.content}</p>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => togglePin(note.id, note.pinned)}
                        className="text-gray-400 hover:text-yellow-600 p-1"
                        title="Pin"
                      >
                        <Pin size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <StickyNote size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Belum ada catatan</p>
            <p className="text-sm text-gray-500 mt-1">Klik tombol + untuk menambah catatan</p>
          </div>
        )}

        {doneNotes.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Selesai</h2>
            <div className="space-y-3">
              {doneNotes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-lg p-4 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleDone(note.id, note.done)}
                      className="mt-1 w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={16} className="text-white" />
                    </button>

                    <p className="flex-1 text-gray-700 line-through">{note.content}</p>

                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                      title="Hapus"
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
              <h2 className="text-xl font-bold text-gray-800">Tambah Catatan</h2>
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
                  Catatan
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Tulis catatan..."
                  autoFocus
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!newNote.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah Catatan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
