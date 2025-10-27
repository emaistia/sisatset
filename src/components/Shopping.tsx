import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, ShoppingItem } from '../lib/supabase';
import { ShoppingCart, Plus, X, Check, Trash2, Zap } from 'lucide-react';
import QuickInput from './QuickInput';

const CATEGORIES = [
  'Sayuran',
  'Buah',
  'Daging & Ikan',
  'Bumbu Dapur',
  'Kebutuhan Harian',
  'Snack',
  'Lainnya',
];

export default function Shopping() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: string; price: string }>({ quantity: '', price: '' });
  const [newItem, setNewItem] = useState({
    item: '',
    quantity: '1',
    price: '',
    category: 'Lainnya',
  });

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  const loadItems = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user.id)
      .order('checked', { ascending: true })
      .order('created_at', { ascending: false });

    if (data) setItems(data);
  };

  const handleAdd = async () => {
    if (!user || !newItem.item.trim()) return;

    await supabase.from('shopping_list').insert({
      user_id: user.id,
      item: newItem.item.trim(),
      quantity: newItem.quantity,
      price: parseFloat(newItem.price) || 0,
      category: newItem.category,
      checked: false,
      source: 'manual',
    });

    setNewItem({ item: '', quantity: '1', price: '', category: 'Lainnya' });
    setShowAddModal(false);
    loadItems();
  };

  const toggleCheck = async (id: string, currentChecked: boolean) => {
    await supabase
      .from('shopping_list')
      .update({ checked: !currentChecked })
      .eq('id', id);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus item ini?')) {
      await supabase.from('shopping_list').delete().eq('id', id);
      loadItems();
    }
  };

  const startEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditValues({ quantity: item.quantity, price: item.price.toString() });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ quantity: '', price: '' });
  };

  const saveEdit = async (id: string) => {
    await supabase
      .from('shopping_list')
      .update({
        quantity: editValues.quantity,
        price: parseFloat(editValues.price) || 0,
      })
      .eq('id', id);

    setEditingId(null);
    loadItems();
  };

  const handleQuickInput = async (text: string) => {
    if (!user) return;

    const lines = text.split('\n').filter(line => line.trim());
    const items: Array<{ item: string; quantity: string; price: number; category: string }> = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let itemName = trimmed;
      let quantity = '1';
      let price = 0;
      let category = 'Lainnya';

      const qtyMatch = trimmed.match(/(\d+)\s*(kg|gr|g|liter|l|buah|biji|pack|pcs|botol|kaleng)/i);
      if (qtyMatch) {
        quantity = qtyMatch[0];
        itemName = trimmed.replace(qtyMatch[0], '').trim();
      }

      const priceMatch = trimmed.match(/rp\.?\s?([\d.,]+)/i);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/[.,]/g, ''));
        itemName = itemName.replace(priceMatch[0], '').trim();
      }

      itemName = itemName.replace(/[-:]/g, '').trim();

      const lowerItem = itemName.toLowerCase();
      if (lowerItem.includes('sayur') || lowerItem.includes('brokoli') || lowerItem.includes('wortel') || lowerItem.includes('bayam')) {
        category = 'Sayuran';
      } else if (lowerItem.includes('buah') || lowerItem.includes('apel') || lowerItem.includes('pisang') || lowerItem.includes('jeruk')) {
        category = 'Buah';
      } else if (lowerItem.includes('daging') || lowerItem.includes('ayam') || lowerItem.includes('ikan') || lowerItem.includes('sapi')) {
        category = 'Daging & Ikan';
      } else if (lowerItem.includes('bumbu') || lowerItem.includes('bawang') || lowerItem.includes('garam') || lowerItem.includes('merica')) {
        category = 'Bumbu Dapur';
      } else if (lowerItem.includes('snack') || lowerItem.includes('kue') || lowerItem.includes('keripik')) {
        category = 'Snack';
      }

      if (itemName) {
        items.push({ item: itemName, quantity, price, category });
      }
    }

    if (items.length === 0) {
      alert('Tidak ada item yang terdeteksi!');
      return;
    }

    for (const item of items) {
      await supabase.from('shopping_list').insert({
        user_id: user.id,
        ...item,
        checked: false,
        source: 'quick_input',
      });
    }

    setShowQuickInput(false);
    loadItems();
    alert(`Berhasil menambahkan ${items.length} item!`);
  };

  const pendingItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  const getTotalPrice = (itemList: ShoppingItem[]) => {
    return itemList.reduce((sum, item) => sum + Number(item.price), 0);
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShoppingCart size={28} />
            <h1 className="text-2xl font-bold">Daftar Belanja</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-pink-600 p-2 rounded-full hover:bg-pink-50 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span>Total Item: {pendingItems.length}</span>
              <span>Sudah Dibeli: {checkedItems.length}</span>
            </div>
            {pendingItems.length > 0 && (
              <div className="mt-2 text-center font-bold">
                Estimasi: Rp {getTotalPrice(pendingItems).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <button
          onClick={() => setShowQuickInput(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-md"
        >
          <Zap size={20} />
          Quick Input Belanja (Copy-Paste List)
        </button>

        {pendingItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Belum Dibeli</h2>
            <div className="space-y-3">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCheck(item.id, item.checked)}
                      className="mt-1 w-6 h-6 rounded border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      {item.checked && <Check size={18} className="text-green-500" />}
                    </button>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2">{item.item}</h3>

                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editValues.quantity}
                              onChange={(e) => setEditValues({ ...editValues, quantity: e.target.value })}
                              placeholder="Qty (misal: 1 kg)"
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                              placeholder="Harga"
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-600"
                            >
                              ✓ Simpan
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm font-medium hover:bg-gray-400"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>Qty: {item.quantity || '-'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.price > 0 && (
                              <span className="font-semibold text-pink-600 whitespace-nowrap">
                                Rp {Number(item.price).toLocaleString('id-ID')}
                              </span>
                            )}
                            <button
                              onClick={() => startEdit(item)}
                              className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                              title="Edit"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {editingId !== item.id && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Belum ada daftar belanja</p>
            <p className="text-sm text-gray-500 mt-1">Klik tombol + untuk menambah item</p>
          </div>
        )}

        {checkedItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-5">
            <h2 className="font-bold text-gray-800 mb-4">Sudah Dibeli</h2>
            <div className="space-y-3">
              {checkedItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleCheck(item.id, item.checked)}
                      className="mt-1 w-6 h-6 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={18} className="text-white" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-700 line-through">{item.item}</h3>
                          <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                        </div>
                        {item.price > 0 && (
                          <span className="font-semibold text-gray-500 whitespace-nowrap">
                            Rp {Number(item.price).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
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
              <h2 className="text-xl font-bold text-gray-800">Tambah Item Belanja</h2>
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
                  Nama Item
                </label>
                <input
                  type="text"
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Beras, Telur, dll"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah
                  </label>
                  <input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="1 kg, 2 ikat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga (Opsional)
                  </label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newItem.item.trim()}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tambah Item
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuickInput && (
        <QuickInput
          onClose={() => setShowQuickInput(false)}
          onSubmit={handleQuickInput}
          title="Quick Input Belanja"
          placeholder="Beras 5kg
Ayam 1kg Rp.35000
Sayur bayam 2 ikat
Minyak goreng 2 liter
Telur 1kg Rp.28000
Gula pasir
Garam
Bawang merah 250gr"
          helperText="Copy-paste list belanja dari WhatsApp atau Notes. Format: nama item, bisa tambah jumlah (kg/gr/buah/dll) dan harga (Rp.)"
        />
      )}
    </div>
  );
}
