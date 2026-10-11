import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  ThumbsUp,
  Eye,
  Calendar,
  User as UserIcon,
  X,
  Share2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Article, User } from '../types';
import { safeFetch } from '../utils/api';

interface ArticlesPageProps {
  articles: Article[];
  currentUser: User | null;
  onRefresh: () => void;
  onOpenAuth: () => void;
}

export const ArticlesPage: React.FC<ArticlesPageProps> = ({
  articles,
  currentUser,
  onRefresh,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New Article Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Web Security');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('OWASP, Defense');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['All', 'Web Security', 'SOC & Incident Response', 'Linux & Systems', 'Cryptography', 'General Cybersecurity'];

  const filtered = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please provide a title and article body content.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await safeFetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          summary: newSummary || newContent.slice(0, 160),
          content: newContent,
          category: newCategory,
          tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
          isPublished: true,
        }),
      });

      if (result.ok) {
        setIsWriteModalOpen(false);
        setNewTitle('');
        setNewSummary('');
        setNewContent('');
        onRefresh();
      } else {
        alert(result.error || 'Failed to publish article');
      }
    } catch (err: any) {
      alert(err.message || 'Error publishing article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const result = await safeFetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (result.ok) {
        if (readingArticle?.id === id) setReadingArticle(null);
        onRefresh();
      } else {
        alert(result.error || 'Failed to delete article');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting article');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
              CYBERSECURITY ARTICLES & RESEARCH
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Technical writeups, threat advisories, and defensive engineering guides contributed by the community.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setIsWriteModalOpen(true);
          }}
          className="flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-emerald-400 transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Article</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles by title, tags, or topic..."
            className="w-full rounded border border-zinc-800 bg-zinc-950 pl-9 pr-4 py-2 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                selectedCategory === cat
                  ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                  : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-zinc-800/80 rounded-lg bg-zinc-950 text-xs font-mono text-zinc-500">
          No articles found matching query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <div
              key={article.id}
              onClick={() => setReadingArticle(article)}
              className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/70 p-5 hover:border-emerald-500/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
                  <span className="text-emerald-400">{article.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                  {article.summary}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap gap-1.5 mb-3 text-[11px] font-mono text-zinc-500">
                  {article.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-xs font-mono text-zinc-400">
                  <span className="truncate max-w-[140px] text-zinc-300">
                    By {article.authorName}
                  </span>
                  <div className="flex items-center gap-3 text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.viewsCount || 0}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read Article Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
                  <span>{readingArticle.category}</span>
                  <span>·</span>
                  <span>By {readingArticle.authorName} (@{readingArticle.authorUsername})</span>
                </div>
                <h2 className="text-2xl font-bold text-white">{readingArticle.title}</h2>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="rounded border border-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {/* Content Body */}
            <div className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed space-y-4 mb-8 whitespace-pre-wrap font-sans">
              {readingArticle.content}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-4">
                <span>Published on {new Date(readingArticle.createdAt).toLocaleDateString()}</span>
              </div>

              {(currentUser?.id === readingArticle.authorId || currentUser?.role === 'OWNER') && (
                <button
                  onClick={() => handleDeleteArticle(readingArticle.id)}
                  className="flex items-center gap-1.5 text-red-400 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Article</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publish Article Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="font-mono text-sm font-bold text-white">PUBLISH CYBERSECURITY ARTICLE</h2>
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="text-zinc-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Article Title:</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Preventing Broken Object Level Authorization (BOLA) in REST APIs"
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 mb-1">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                  >
                    <option value="Web Security">Web Security</option>
                    <option value="SOC & Incident Response">SOC & Incident Response</option>
                    <option value="Linux & Systems">Linux & Systems</option>
                    <option value="Cryptography">Cryptography</option>
                    <option value="General Cybersecurity">General Cybersecurity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Tags (comma separated):</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="OWASP, API, Defense"
                    className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Summary / Abstract:</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Short brief of findings and defensive takeaway..."
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Content (Markdown supported):</label>
                <textarea
                  rows={8}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your technical writeup, code examples, defense mechanisms, and verification commands..."
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="rounded border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-emerald-500 px-5 py-2 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish to RVCYBER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
