import { useState } from 'react';
import { Copy, Type, X } from 'lucide-react';

type QuickInputProps = {
  onClose: () => void;
  onSubmit: (text: string) => void;
  title: string;
  placeholder: string;
  helperText?: string;
};

export default function QuickInput({ onClose, onSubmit, title, placeholder, helperText }: QuickInputProps) {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'manual' | 'paste'>('manual');

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    onSubmit(inputText);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 px-4 pt-3 pb-2">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Type size={16} />
            Manual
          </button>
          <button
            onClick={() => setMode('paste')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'paste'
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Copy size={16} />
            Copy-Paste
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {helperText && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-xs text-blue-800">{helperText}</p>
            </div>
          )}

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholder}
            className="w-full h-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 resize-none"
            autoFocus
          />
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proses & Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
