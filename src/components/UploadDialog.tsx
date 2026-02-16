'use client';

import { useState, useRef } from 'react';

interface UploadDialogProps {
  onUploadSuccess: () => void;
}

export function UploadDialog({ onUploadSuccess }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      if (name.trim()) formData.set('name', name.trim());
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Upload failed');
        return;
      }
      setOpen(false);
      setName('');
      if (fileRef.current) fileRef.current.value = '';
      onUploadSuccess();
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
      >
        + Upload CSV
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !uploading && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Upload CSV
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Required columns: Company, Location, Date, Time, Rocket, Mission, RocketStatus,
              Price, MissionStatus. Date format: YYYY-MM-DD.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="upload-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dataset name (optional)
                </label>
                <input
                  id="upload-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My missions"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="upload-file" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CSV file
                </label>
                <input
                  id="upload-file"
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  required
                  className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-2 file:text-sky-700 dark:file:bg-sky-900/30 dark:file:text-sky-300"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => !uploading && setOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg"
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
