import { useState, useRef } from 'react';

export default function ImportLeadsModal({ onImport, onClose, importing }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setError('');
    if (f) {
      if (!f.name.toLowerCase().endsWith('.csv')) {
        setError('Please select a CSV file.');
        setFile(null);
        return;
      }
      setFile(f);
    } else {
      setFile(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    onImport(formData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Import leads from CSV</h3>
        <p className="text-sm text-slate-600 mb-4">Upload a CSV with columns: hotel_name, owner_name, phone, email, rooms, location, status, tags, notes.</p>
        <form onSubmit={handleSubmit}>
          <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={!file || importing} className="btn-primary-gradient rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">{importing ? 'Importing…' : 'Import'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
