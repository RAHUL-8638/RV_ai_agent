import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  MessageSquare,
  ThumbsUp,
  Share2,
  Trash2,
  Send,
  User as UserIcon,
  Tag,
} from 'lucide-react';
import { CommunityPost, User } from '../types';
import { safeFetch } from '../utils/api';

interface CommunityPageProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({ currentUser, onOpenAuth }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  // New Post Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Threat Research');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('Discussion, Defense');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await safeFetch<{ posts: CommunityPost[] }>('/api/community/posts');
      if (res.ok && res.data?.posts) {
        setPosts(res.data.posts);
        if (selectedPost) {
          const fresh = res.data.posts.find((p: CommunityPost) => p.id === selectedPost.id);
          if (fresh) setSelectedPost(fresh);
        }
      }
    } catch (err) {
      console.warn('Notice fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await safeFetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsNewPostOpen(false);
        setTitle('');
        setContent('');
        fetchPosts();
      }
    } catch (err) {
      console.warn('Notice creating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!selectedPost || !replyText.trim()) return;

    try {
      const res = await safeFetch(`/api/community/posts/${selectedPost.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      });

      if (res.ok) {
        setReplyText('');
        fetchPosts();
      }
    } catch (err) {
      console.warn('Notice sending reply:', err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await safeFetch(`/api/community/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedPost?.id === id) setSelectedPost(null);
        fetchPosts();
      }
    } catch (err) {
      console.warn('Notice deleting post:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
              HACKER & RESEARCHER COMMUNITY
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Technical exchange, bug bounty debriefs, certification strategies, and defensive architectures.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setIsNewPostOpen(true);
          }}
          className="flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-emerald-400 transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Discussion Thread</span>
        </button>
      </div>

      {/* Main Grid: Post list & Thread detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Posts Stream */}
        <div className="lg:col-span-7 space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className={`cursor-pointer rounded-lg border p-5 transition-colors ${
                selectedPost?.id === post.id
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-2">
                <span className="text-emerald-400 font-bold">{post.category}</span>
                <span>·</span>
                <span>By {post.authorName} (@{post.authorUsername})</span>
                <span>·</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">{post.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                {post.content}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{post.replies?.length || 0} Replies</span>
                  </span>
                </div>

                {(currentUser?.id === post.authorId || currentUser?.role === 'OWNER') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePost(post.id);
                    }}
                    className="text-zinc-600 hover:text-red-400 p-1"
                    title="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Thread Replies */}
        <div className="lg:col-span-5">
          {selectedPost ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-6 sticky top-20">
              <div className="border-b border-zinc-800 pb-3">
                <div className="text-xs font-mono text-emerald-400 mb-1">
                  THREAD BY @{selectedPost.authorUsername}
                </div>
                <h2 className="text-base font-bold text-white">{selectedPost.title}</h2>
              </div>

              {/* Replies list */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedPost.replies?.length === 0 ? (
                  <div className="text-xs font-mono text-zinc-500 text-center py-6">
                    No replies yet. Join the conversation below!
                  </div>
                ) : (
                  selectedPost.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded border border-zinc-800/80 bg-black/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="text-emerald-400 font-bold">{reply.authorName}</span>
                        <span>{new Date(reply.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed font-sans">{reply.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Form */}
              <div className="border-t border-zinc-800 pt-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={currentUser ? "Write a technical reply..." : "Log in to join discussion..."}
                    disabled={!currentUser}
                    className="flex-1 rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!currentUser || !replyText.trim()}
                    className="rounded bg-emerald-500 p-2 text-black hover:bg-emerald-400 disabled:opacity-40 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center text-xs font-mono text-zinc-500">
              Select a discussion thread on the left to view technical exchange and replies.
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      {isNewPostOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="font-mono text-sm font-bold text-white">NEW THREAD</h2>
              <button
                onClick={() => setIsNewPostOpen(false)}
                className="text-zinc-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Thread Title:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Effective strategies for fuzzing REST APIs with ffuf"
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white"
                  >
                    <option value="Threat Research">Threat Research</option>
                    <option value="Bug Bounty">Bug Bounty</option>
                    <option value="Certifications">Certifications</option>
                    <option value="Career & Advice">Career & Advice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Tags:</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="ffuf, APIs, Fuzzing"
                    className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Post Content:</label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your research, question, or scenario..."
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPostOpen(false)}
                  className="rounded border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-emerald-500 px-5 py-2 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Post Thread'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
