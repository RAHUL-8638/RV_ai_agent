import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Search,
  Plus,
  FileText,
  FileCheck,
  Eye,
  Trash2,
  Lock,
} from 'lucide-react';
import { DocumentItem, User } from '../types';
import { safeFetch } from '../utils/api';

interface DocumentsPageProps {
  documents: DocumentItem[];
  currentUser: User | null;
  onRefresh: () => void;
  onOpenAuth: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  currentUser,
  onRefresh,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // New Doc Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Web Security');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPageCount, setNewPageCount] = useState('32');
  const [submitting, setSubmitting] = useState(false);

  const filtered = documents.filter((d) => {
    return (
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newDescription.trim()) {
      alert('Please enter title and description');
      return;
    }

    setSubmitting(true);
    try {
      const res = await safeFetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          author: newAuthor || currentUser.displayName,
          pageCount: parseInt(newPageCount, 10) || 20,
          fileSize: '1.8 MB',
          fileUrl: '/uploads/documents/owasp-top-10-guide.pdf',
          previewSnippet: newDescription,
        }),
      });

      if (res.ok) {
        setIsUploadOpen(false);
        setNewTitle('');
        setNewDescription('');
        onRefresh();
      } else {
        alert(res.error || 'Failed to upload document');
      }
    } catch (err) {
      console.warn('Notice uploading document:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await safeFetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (previewDoc?.id === id) setPreviewDoc(null);
        onRefresh();
      } else {
        alert(res.error || 'Failed to delete document');
      }
    } catch (err) {
      console.warn('Notice deleting document:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
              CYBERSECURITY BOOKS & PDF GUIDES
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Reference literature, handbook cheat sheets, and technical guides. Download authorized educational resources.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setIsUploadOpen(true);
          }}
          className="flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-emerald-400 transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Contribute PDF Guide</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-8 max-w-md relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search books, handbooks, and cheat sheets..."
          className="w-full rounded border border-zinc-800 bg-zinc-950 pl-9 pr-4 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2">
                <span className="text-emerald-400">{doc.category}</span>
                <span>{doc.fileSize} · {doc.pageCount} pgs</span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">{doc.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                {doc.description}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-900 text-xs font-mono space-y-3">
              <div className="text-zinc-500 text-[11px] truncate">
                Author: <span className="text-zinc-300">{doc.author}</span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>

                <a
                  href={`/api/documents/${doc.id}/download`}
                  download
                  className="flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:border-emerald-500 hover:text-emerald-300 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(0,255,102,0.15)] space-y-4">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-mono text-emerald-400">PDF REFERENCE PREVIEW</span>
                <h3 className="text-lg font-bold text-white">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-zinc-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <div className="rounded border border-zinc-800 bg-black/70 p-4 font-mono text-xs text-zinc-300 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-zinc-400 border-b border-zinc-900 pb-2">
                <div>Pages: {previewDoc.pageCount}</div>
                <div>Size: {previewDoc.fileSize}</div>
                <div>Attribution: {previewDoc.author}</div>
                <div>Downloads: {previewDoc.downloadsCount}</div>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">Synopsis:</span>
                <p className="mt-1 leading-relaxed text-zinc-300">{previewDoc.previewSnippet || previewDoc.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {(currentUser?.id === previewDoc.uploaderId || currentUser?.role === 'OWNER') && (
                <button
                  onClick={() => handleDelete(previewDoc.id)}
                  className="flex items-center gap-1 text-xs font-mono text-red-400 hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Document</span>
                </button>
              )}

              <a
                href={`/api/documents/${previewDoc.id}/download`}
                download
                className="ml-auto flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black hover:bg-emerald-400"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Secure PDF</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="font-mono text-sm font-bold text-white">CONTRIBUTE EDUCATIONAL PDF</h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-zinc-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Document Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Wireshark Packet Analysis Survival Guide"
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white"
                  >
                    <option value="Web Security">Web Security</option>
                    <option value="Linux & Systems">Linux & Systems</option>
                    <option value="SOC Operations">SOC Operations</option>
                    <option value="Certifications">Certifications</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Page Count:</label>
                  <input
                    type="number"
                    value={newPageCount}
                    onChange={(e) => setNewPageCount(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Author / Source Attribution:</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. RVCYBER Research / Open Source"
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Description & Key Topics:</label>
                <textarea
                  rows={4}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Overview of concepts covered, lab prerequisites..."
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-emerald-500 px-5 py-2 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Publish PDF Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
