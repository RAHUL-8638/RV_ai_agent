import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Users,
  ShieldAlert,
  Video,
  FileText,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Lock,
  Terminal,
  Cpu,
} from 'lucide-react';
import { User, AuditLog, ContentReport, VideoProject } from '../types';
import { safeFetch } from '../utils/api';

interface OwnerDashboardProps {
  currentUser: User | null;
}

export const OwnerDashboardPage: React.FC<OwnerDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'video_jobs' | 'audit_logs'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reportsList, setReportsList] = useState<ContentReport[]>([]);
  const [videoJobs, setVideoJobs] = useState<VideoProject[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Security Verification Guard
  if (!currentUser || currentUser.role !== 'OWNER') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono">
        <div className="rounded-lg border border-red-500/60 bg-red-950/20 p-8 text-red-400 space-y-4 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
          <ShieldAlert className="h-12 w-12 mx-auto text-red-500" />
          <h1 className="text-xl font-bold tracking-wider">ACCESS DENIED: OWNER AUTHORIZATION MANDATORY</h1>
          <p className="text-xs text-zinc-300 max-w-md mx-auto">
            This administrative control system is strictly restricted to the sole application owner. Any unauthorized access attempt has been logged in security audit telemetry.
          </p>
        </div>
      </div>
    );
  }

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [resStats, resUsers, resReports, resJobs, resLogs] = await Promise.all([
        safeFetch<any>('/api/admin/stats'),
        safeFetch<{ users: User[] }>('/api/admin/users'),
        safeFetch<{ reports: ContentReport[] }>('/api/admin/reports'),
        safeFetch<{ projects: VideoProject[] }>('/api/admin/video-jobs'),
        safeFetch<{ logs: AuditLog[] }>('/api/admin/audit-logs'),
      ]);

      if (resStats.ok && resStats.data) setStats(resStats.data);
      if (resUsers.ok && resUsers.data?.users) {
        setUsersList(resUsers.data.users);
      }
      if (resReports.ok && resReports.data?.reports) {
        setReportsList(resReports.data.reports);
      }
      if (resJobs.ok && resJobs.data?.projects) {
        setVideoJobs(resJobs.data.projects);
      }
      if (resLogs.ok && resLogs.data?.logs) {
        setAuditLogs(resLogs.data.logs);
      }
    } catch (err) {
      console.warn('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await safeFetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        alert(res.error || 'Failed to update user status');
      }
    } catch (err) {
      console.warn('Notice updating user status:', err);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
    try {
      const res = await safeFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAdminData();
      } else {
        alert(res.error || 'Failed to delete user');
      }
    } catch (err) {
      console.warn('Notice deleting user:', err);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const res = await safeFetch(`/api/admin/reports/${reportId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        alert(res.error || 'Failed to resolve report');
      }
    } catch (err) {
      console.warn('Notice resolving report:', err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Admin Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
              <Sliders className="h-4 w-4" />
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
              OWNER ADMINISTRATIVE TERMINAL
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Authenticated as Sole Owner: <span className="text-emerald-400 font-mono">@{currentUser.username}</span>. Absolute authority over accounts, moderation, video queues, and security logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-zinc-300 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-900">
        {[
          { id: 'overview', label: 'Platform Telemetry' },
          { id: 'users', label: `Users (${usersList.length})` },
          { id: 'reports', label: `Moderation Reports (${reportsList.filter((r) => r.status === 'pending').length})` },
          { id: 'video_jobs', label: `Video Queue (${videoJobs.length})` },
          { id: 'audit_logs', label: `Security Logs (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-mono rounded-t transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-emerald-400 text-emerald-400 font-bold bg-emerald-950/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & TELEMETRY */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
              <span className="text-zinc-500">TOTAL USERS</span>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</div>
              <div className="text-[11px] text-emerald-400 mt-1">{stats.activeUsers} Active Accounts</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
              <span className="text-zinc-500">VIDEO PIPELINE JOBS</span>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalVideoJobs}</div>
              <div className="text-[11px] text-emerald-400 mt-1">{stats.completedVideos} Rendered MP4s</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
              <span className="text-zinc-500">PUBLISHED RESEARCH</span>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalArticles}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{stats.totalDocuments} PDFs & Books</div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs">
              <span className="text-zinc-500">SECURITY AUDIT EVENTS</span>
              <div className="text-2xl font-bold text-white mt-1">{stats.auditLogsCount}</div>
              <div className="text-[11px] text-amber-400 mt-1">{stats.pendingReports} Pending Moderations</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-3 font-mono text-xs">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <span>SERVER-SIDE AI ENGINE STATUS</span>
              </div>
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">Agent LLM:</span>
                  <span className="text-emerald-400">gemini-3.8-flash</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">Voice Synthesis:</span>
                  <span className="text-emerald-400">gemini-3.8-flash-lite-tts</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-500">Media Renderer:</span>
                  <span className="text-emerald-400">FFmpeg 4.4.2 (libx264, aac)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Security Architecture:</span>
                  <span className="text-emerald-400">Single-Owner Invariant Enforced</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-3 font-mono text-xs">
              <div className="text-emerald-400 font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>SINGLE-OWNER SECURITY POLICY</span>
              </div>
              <p className="text-zinc-300 leading-relaxed font-sans text-xs">
                In accordance with system security specifications, the role of OWNER is singleton and immutable through public APIs. All standard user registrations receive role USER. Privilege escalation attempts are automatically blocked, audited, and logged.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/60 border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40">
                    <td className="p-3">
                      <div className="font-bold text-white">{u.displayName}</div>
                      <div className="text-zinc-500">@{u.username}</div>
                    </td>
                    <td className="p-3 text-zinc-400">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'OWNER'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : 'bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[11px] font-bold ${
                          u.status === 'active' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-2">
                      {u.role !== 'OWNER' && (
                        <>
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.status)}
                            className="rounded border border-zinc-700 px-2.5 py-1 text-zinc-300 hover:border-emerald-500"
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            className="rounded border border-red-900 px-2.5 py-1 text-red-400 hover:bg-red-950"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MODERATION REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4 font-mono text-xs">
          {reportsList.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-500">
              No content reports submitted. Platform content is clean.
            </div>
          ) : (
            reportsList.map((rep) => (
              <div
                key={rep.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-bold uppercase">[{rep.contentType} REPORT]</span>
                    <span className="text-zinc-500">ID: {rep.contentId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${rep.status === 'pending' ? 'bg-amber-950 text-amber-300' : 'bg-zinc-900 text-zinc-400'}`}>
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-xs font-sans">{rep.reason}</p>
                </div>

                {rep.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="rounded bg-emerald-600 px-3 py-1 font-bold text-black hover:bg-emerald-500"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="rounded border border-zinc-700 px-3 py-1 text-zinc-400 hover:text-white"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: VIDEO QUEUE MONITOR */}
      {activeTab === 'video_jobs' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/60 border-b border-zinc-800 text-zinc-400">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Lang</th>
                  <th className="p-3">Voice</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {videoJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-zinc-900/40">
                    <td className="p-3 text-zinc-400 truncate max-w-[100px]">{job.id}</td>
                    <td className="p-3 text-white font-bold truncate max-w-[200px]">{job.title}</td>
                    <td className="p-3 text-emerald-400 uppercase">{job.language}</td>
                    <td className="p-3 text-zinc-300">{job.voice}</td>
                    <td className="p-3">
                      <span
                        className={`text-[11px] font-bold ${
                          job.status === 'completed'
                            ? 'text-emerald-400'
                            : job.status === 'failed'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-300">{job.progress}%</td>
                    <td className="p-3 text-zinc-500">{new Date(job.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="rounded-lg border border-zinc-800 bg-black p-4 font-mono text-xs space-y-2 max-h-[550px] overflow-y-auto">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded border text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                log.severity === 'critical'
                  ? 'border-red-900/60 bg-red-950/20 text-red-300'
                  : log.severity === 'warning'
                  ? 'border-amber-900/60 bg-amber-950/20 text-amber-300'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300'
              }`}
            >
              <div>
                <span className="text-zinc-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className="font-bold text-white">[{log.action}]</span>{' '}
                <span className="text-emerald-400">@{log.actorUsername}:</span>{' '}
                <span>{log.details}</span>
              </div>
              {log.ipAddress && <span className="text-zinc-600 shrink-0">IP: {log.ipAddress}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
