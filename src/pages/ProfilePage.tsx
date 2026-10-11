import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Shield,
  Edit2,
  Video,
  FileText,
  BookOpen,
  Calendar,
  CheckCircle2,
  Save,
  X,
  Lock,
} from 'lucide-react';
import { MatrixRain } from '../components/MatrixRain';
import { User, Article, VideoProject, DocumentItem } from '../types';
import { safeFetch } from '../utils/api';

interface ProfilePageProps {
  currentUser: User | null;
  onRefreshUser: () => void;
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onRefreshUser,
  onOpenAuth,
}) => {
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [userVideos, setUserVideos] = useState<VideoProject[]>([]);
  const [userDocs, setUserDocs] = useState<DocumentItem[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit fields
  const [editDisplayName, setEditDisplayName] = useState(currentUser?.displayName || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editSkills, setEditSkills] = useState(currentUser?.skills?.join(', ') || '');
  const [editInterests, setEditInterests] = useState(currentUser?.interests?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setEditDisplayName(currentUser.displayName);
    setEditBio(currentUser.bio);
    setEditSkills(currentUser.skills?.join(', ') || '');
    setEditInterests(currentUser.interests?.join(', ') || '');

    // Fetch user public contributions
    const fetchUserData = async () => {
      try {
        const res = await safeFetch<{ articles: Article[]; videos: VideoProject[]; documents: DocumentItem[] }>(
          `/api/users/${currentUser.username}`
        );
        if (res.ok && res.data) {
          setUserArticles(res.data.articles || []);
          setUserVideos(res.data.videos || []);
          setUserDocs(res.data.documents || []);
        }
      } catch (err) {
        console.warn('Notice fetching user data:', err);
      }
    };
    fetchUserData();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="relative min-h-[600px] flex items-center justify-center p-4">
        <MatrixRain opacity={0.3} />
        <div className="relative z-10 rounded-lg border border-zinc-800 bg-zinc-950/90 p-8 text-center max-w-md font-mono text-xs space-y-4 shadow-[0_0_30px_rgba(0,255,102,0.1)]">
          <Lock className="h-8 w-8 text-emerald-400 mx-auto" />
          <h2 className="text-base font-bold text-white">AUTHENTICATION REQUIRED</h2>
          <p className="text-zinc-400">Please sign in to view and manage your cybersecurity profile, generated videos, and research contributions.</p>
          <button
            onClick={onOpenAuth}
            className="w-full rounded bg-emerald-500 py-2.5 font-bold text-black hover:bg-emerald-400 transition-colors"
          >
            Open Access Terminal
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await safeFetch('/api/users/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName,
          bio: editBio,
          skills: editSkills.split(',').map((s) => s.trim()).filter(Boolean),
          interests: editInterests.split(',').map((i) => i.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        onRefreshUser();
      } else {
        alert(res.error || 'Failed to update profile');
      }
    } catch (err) {
      console.warn('Notice updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* Background Matrix Rain for Hacker Profile Atmosphere */}
      <div className="absolute inset-0 h-[360px] overflow-hidden border-b border-emerald-950/80">
        <MatrixRain opacity={0.35} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6">
        {/* Profile Card */}
        <div className="rounded-lg border border-emerald-500/40 bg-zinc-950/90 p-6 sm:p-8 backdrop-blur-md shadow-[0_0_35px_rgba(0,255,102,0.15)] mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              {/* Avatar with Neon Green Glowing Border */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-[0_0_20px_#00ff66]">
                <UserIcon className="h-10 w-10 text-emerald-400" />
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-black" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-mono">{currentUser.displayName}</h1>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                      currentUser.role === 'OWNER'
                        ? 'border border-emerald-500 bg-emerald-950 text-emerald-300'
                        : 'border border-zinc-700 bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-0.5">
                  @{currentUser.username}
                </div>
                <div className="text-xs font-mono text-zinc-500 mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 rounded border border-emerald-500/50 bg-emerald-950/40 px-3.5 py-1.5 font-mono text-xs text-emerald-300 hover:bg-emerald-900/60 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Bio & Details */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-zinc-500 uppercase tracking-wider block mb-1">Mission / Biography:</span>
                <p className="text-sm font-sans text-zinc-200 leading-relaxed">
                  {currentUser.bio || 'Security researcher actively studying threat models, defensive engineering, and authorized lab testing.'}
                </p>
              </div>

              <div>
                <span className="text-zinc-500 uppercase tracking-wider block mb-2">Technical Skills & Arsenal:</span>
                <div className="flex flex-wrap gap-2">
                  {(currentUser.skills?.length ? currentUser.skills : ['Web Defense', 'Linux Triage', 'OWASP Top 10']).map((s) => (
                    <span
                      key={s}
                      className="rounded border border-emerald-900/60 bg-emerald-950/30 px-2.5 py-1 text-emerald-400 text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded border border-zinc-800 bg-black/60 p-4 space-y-3">
              <span className="text-zinc-500 uppercase tracking-wider block">Areas of Interest:</span>
              <div className="flex flex-wrap gap-1.5">
                {(currentUser.interests?.length ? currentUser.interests : ['Zero Trust', 'Memory Forensics', 'AI Defense']).map((int) => (
                  <span key={int} className="text-zinc-300 text-xs">
                    #{int}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-zinc-900 text-zinc-400 space-y-1 text-[11px]">
                <div>Email: <span className="text-zinc-300">[Private & Protected]</span></div>
                <div>Status: <span className="text-emerald-400 uppercase font-bold">{currentUser.status}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* User Contributions: Articles, Videos, Docs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Articles */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>Published Articles</span>
              </span>
              <span className="text-zinc-500">{userArticles.length}</span>
            </div>
            {userArticles.length === 0 ? (
              <div className="text-xs font-mono text-zinc-600 py-4 text-center">No public articles yet.</div>
            ) : (
              userArticles.map((a) => (
                <div key={a.id} className="text-xs font-mono text-zinc-300 truncate hover:text-emerald-400">
                  • {a.title}
                </div>
              ))
            )}
          </div>

          {/* Videos */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span>Generated Videos</span>
              </span>
              <span className="text-zinc-500">{userVideos.length}</span>
            </div>
            {userVideos.length === 0 ? (
              <div className="text-xs font-mono text-zinc-600 py-4 text-center">No public videos yet.</div>
            ) : (
              userVideos.map((v) => (
                <div key={v.id} className="text-xs font-mono text-zinc-300 truncate hover:text-emerald-400">
                  • {v.title} ({v.durationSeconds}s)
                </div>
              ))
            )}
          </div>

          {/* Documents */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>Contributed Guides</span>
              </span>
              <span className="text-zinc-500">{userDocs.length}</span>
            </div>
            {userDocs.length === 0 ? (
              <div className="text-xs font-mono text-zinc-600 py-4 text-center">No documents shared yet.</div>
            ) : (
              userDocs.map((d) => (
                <div key={d.id} className="text-xs font-mono text-zinc-300 truncate hover:text-emerald-400">
                  • {d.title}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(0,255,102,0.15)] font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h2 className="text-sm font-bold text-white">EDIT RESEARCHER PROFILE</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-zinc-300 mb-1">Display Name:</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Bio / Mission Statement:</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Skills (comma separated):</label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="e.g. Reverse Engineering, Burp Suite, Python"
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Interests (comma separated):</label>
                <input
                  type="text"
                  value={editInterests}
                  onChange={(e) => setEditInterests(e.target.value)}
                  placeholder="e.g. Cloud Security, Bug Bounty, Cryptography"
                  className="w-full rounded border border-zinc-800 bg-black p-2.5 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-emerald-500 px-5 py-2 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
