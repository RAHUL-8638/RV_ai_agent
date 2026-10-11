import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  syncArticleToFirestore,
  syncVideoProjectToFirestore,
  syncDocumentToFirestore,
  syncUserToFirestore,
} from './firebaseSync.js';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio: string;
  avatar: string;
  role: 'OWNER' | 'USER';
  skills: string[];
  interests: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface VideoScene {
  id: string;
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  narration: string;
  visualDescription: string;
  codeOrCommand?: string;
  terminalOutput?: string;
}

export interface VideoProject {
  id: string;
  userId: string;
  title: string;
  topic: string;
  language: 'en' | 'te' | 'hi';
  durationSeconds: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  style: 'cyberpunk' | 'terminal' | 'motion_graphics' | 'whiteboard';
  voice: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';
  narrationSpeed: number;
  subtitlesEnabled: boolean;
  audience: 'beginner' | 'intermediate' | 'advanced';
  status: 'queued' | 'generating_script' | 'generating_assets' | 'generating_voice' | 'rendering' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  statusMessage?: string;
  storyboard: VideoScene[];
  script: string;
  videoUrl?: string;
  audioUrl?: string;
  subtitleSrt?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  viewsCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  uploaderId: string;
  uploaderUsername: string;
  uploaderName: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  fileSize: string;
  pageCount: number;
  fileUrl: string;
  previewSnippet: string;
  isPublic: boolean;
  downloadsCount: number;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  replies: {
    id: string;
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
    content: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorUsername: string;
  ipAddress?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: 'article' | 'video' | 'document' | 'post';
  contentId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  videoProjects: VideoProject[];
  articles: Article[];
  documents: DocumentItem[];
  communityPosts: CommunityPost[];
  auditLogs: AuditLog[];
  reports: ContentReport[];
  meta: {
    ownerConfigured: boolean;
    initializedAt: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'rvcyber_database.json');

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.data = this.load();
    this.seedDefaultsIfEmpty();
  }

  private load(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to read db file, creating clean state', err);
      }
    }
    return {
      users: [],
      videoProjects: [],
      articles: [],
      documents: [],
      communityPosts: [],
      auditLogs: [],
      reports: [],
      meta: {
        ownerConfigured: false,
        initializedAt: new Date().toISOString(),
      },
    };
  }

  public save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  private seedDefaultsIfEmpty() {
    // Seed initial curated educational articles if empty
    if (this.data.articles.length === 0) {
      this.data.articles = [
        {
          id: 'art-1',
          authorId: 'system',
          authorName: 'RVCYBER Threat Research',
          authorUsername: 'rvcyber_sec',
          authorAvatar: '',
          title: 'Understanding SQL Injection: From Syntax Breakdown to Prepared Statements',
          slug: 'understanding-sql-injection-syntax-breakdown',
          summary: 'A deep-dive technical guide into how relational databases interpret unfiltered input, blind vs error-based SQLi, and modern parameterized queries.',
          content: `## What is SQL Injection (SQLi)?

SQL Injection occurs when untrusted user input is directly concatenated into a dynamic SQL query without validation or parameterization. This allows an attacker to alter the query logic executed by the database engine.

\`\`\`sql
-- Vulnerable Dynamic Query:
SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1';
\`\`\`

### Safe Defense: Parameterized Queries

Always use prepared statements where variables are treated as literal data, never executable syntax:

\`\`\`typescript
// Safe parameterized query in modern Node.js / PostgreSQL:
const query = 'SELECT id, email, role FROM users WHERE username = $1 AND status = $2';
const result = await db.query(query, [inputUsername, 'active']);
\`\`\`

### Key Takeaways
1. Never concatenate raw strings into SQL statements.
2. Employ least privilege principles for database service credentials.
3. Validate and enforce type constraints at application boundaries.`,
          category: 'Web Security',
          tags: ['OWASP', 'SQLi', 'Defense', 'AppSec'],
          isPublished: true,
          viewsCount: 342,
          likesCount: 58,
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: 'art-2',
          authorId: 'system',
          authorName: 'Defense Matrix Labs',
          authorUsername: 'matrix_analyst',
          authorAvatar: '',
          title: 'SOC Analyst Incident Response Playbook: Investigating Suspicious PowerShell Execution',
          slug: 'soc-incident-response-powershell-analysis',
          summary: 'Practical steps for Security Operations Center triage when Windows Event ID 4104 flags encoded base64 PowerShell commands.',
          content: `## Event Log Analysis for Windows Endpoint Triage

When monitoring endpoints via Sysmon or Windows Event Forwarding, PowerShell Script Block Logging (Event ID 4104) provides full visibility into decoded commands.

### Triage Workflow:
1. **Identify Parent Process:** Was powershell.exe spawned by cmd.exe, winword.exe, or an administrative scheduler?
2. **Decode EncodedCommand:** Extract the Base64 string and decode Unicode bytes safely in an isolated sandbox.
3. **Network Telemetry:** Check firewall and proxy logs for external IP sockets created within 30 seconds of execution.

\`\`\`powershell
# Safe Sandbox decoding of suspicious script block:
$encoded = "V3JpdGUtSG9zdCAnaGVsbG8n"
[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String($encoded))
\`\`\`

### Remediation
Isolate the machine from the network subnet, revoke active Kerberos tickets, and collect volatile memory dump using FTK Imager.`,
          category: 'SOC & Incident Response',
          tags: ['SOC', 'BlueTeam', 'PowerShell', 'WindowsSecurity'],
          isPublished: true,
          viewsCount: 215,
          likesCount: 39,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
    }

    // Seed initial cybersecurity books / reference documents
    if (this.data.documents.length === 0) {
      this.data.documents = [
        {
          id: 'doc-1',
          uploaderId: 'system',
          uploaderUsername: 'rvcyber_sec',
          uploaderName: 'RVCYBER Library',
          title: 'OWASP Top 10 Web Application Security Reference Guide',
          description: 'Comprehensive reference document detailing modern web application security risks including Broken Access Control, Cryptographic Failures, and Injection.',
          category: 'Web Security',
          tags: ['OWASP', 'AppSec', 'Reference'],
          author: 'OWASP Foundation (Open Source Distribution)',
          fileSize: '2.4 MB',
          pageCount: 48,
          fileUrl: '/uploads/documents/owasp-top-10-guide.pdf',
          previewSnippet: 'This document provides a consensus-based overview of critical security vulnerabilities in web applications, complete with remediation code patterns and threat modeling examples.',
          isPublic: true,
          downloadsCount: 142,
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'doc-2',
          uploaderId: 'system',
          uploaderUsername: 'rvcyber_sec',
          uploaderName: 'RVCYBER Library',
          title: 'Linux Command Line Survival Guide for Security Analysts',
          description: 'Quick reference sheet covering grep, awk, sed, netstat, ss, tcpdump, and journalctl for log analysis and incident investigation.',
          category: 'Linux & Systems',
          tags: ['Linux', 'Bash', 'Networking', 'Forensics'],
          author: 'RVCYBER Research Team',
          fileSize: '1.1 MB',
          pageCount: 24,
          fileUrl: '/uploads/documents/linux-security-handbook.pdf',
          previewSnippet: 'Command syntax reference for incident triage on Debian and RHEL systems: analyzing /var/log/auth.log, listening sockets, and process hierarchy.',
          isPublic: true,
          downloadsCount: 98,
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
      ];
    }

    // Seed initial community discussions
    if (this.data.communityPosts.length === 0) {
      this.data.communityPosts = [
        {
          id: 'post-1',
          authorId: 'system',
          authorName: 'Security Ops Team',
          authorUsername: 'rvcyber_sec',
          authorAvatar: '',
          title: 'Tips for passing the CompTIA Security+ or CEH exams on first attempt',
          content: 'What study resources, practice question banks, and lab exercises helped you the most? Share your study timeline and key focus areas like cryptographic protocols and attack vectors.',
          category: 'Certifications',
          tags: ['SecurityPlus', 'CEH', 'StudyTips'],
          upvotes: 18,
          replies: [
            {
              id: 'rep-1',
              authorId: 'user-sample',
              authorName: 'Arjun Cyber',
              authorUsername: 'arjun_def',
              authorAvatar: '',
              content: 'Focus heavily on ports, protocols, and scenario-based log analysis questions. Doing hands-on packet captures in Wireshark helped solidify TCP flags!',
              createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ];
    }

    this.save();
  }

  // Owner management methods
  public hasOwner(): boolean {
    return this.data.users.some(
      (u) => u.role === 'OWNER' && u.email !== 'owner@rvcyber.local' && u.username !== 'lead_architect'
    );
  }

  public getOwner(): User | undefined {
    return this.data.users.find(
      (u) => u.role === 'OWNER' && u.email !== 'owner@rvcyber.local' && u.username !== 'lead_architect'
    );
  }

  public purgeMockOwner(): void {
    const beforeCount = this.data.users.length;
    this.data.users = this.data.users.filter(
      (u) => !(u.role === 'OWNER' && (u.email === 'owner@rvcyber.local' || u.username === 'lead_architect'))
    );
    if (this.data.users.length !== beforeCount) {
      this.data.meta.ownerConfigured = this.hasOwner();
      this.save();
    }
  }

  public resetOwner(): void {
    this.data.users = this.data.users.filter((u) => u.role !== 'OWNER');
    this.data.meta.ownerConfigured = false;
    this.save();
  }

  public promoteToOwner(userId: string): User | undefined {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return undefined;
    user.role = 'OWNER';
    user.updatedAt = new Date().toISOString();
    this.data.meta.ownerConfigured = true;
    this.logAudit('OWNER_PROMOTED', user.id, user.username, 'User established as platform owner.', 'critical');
    this.save();
    syncUserToFirestore(user).catch(() => {});
    return user;
  }

  public createFirstOwner(username: string, email: string, passwordPlain: string, displayName: string): User {
    // Purge mock owner if left behind by test suites
    this.purgeMockOwner();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const isVerifiedOwner =
      normalizedEmail === 'rahulamirisetti@gmail.com' || normalizedUsername === 'rahul_amirisetti';

    if (this.hasOwner() && !isVerifiedOwner) {
      throw new Error('OWNER_ALREADY_EXISTS: The platform already has an established owner. No additional owner accounts may be provisioned.');
    }

    // If verified owner is re-provisioning, remove previous owner to allow clean credential replacement
    if (isVerifiedOwner) {
      this.data.users = this.data.users.filter((u) => u.role !== 'OWNER');
    }

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);

    const owner: User = {
      id: `owner-${Date.now()}`,
      username: username.trim().toLowerCase(),
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim() || 'System Owner',
      bio: 'Owner & Chief Administrator of RVCYBER AGENT',
      avatar: '',
      role: 'OWNER',
      skills: ['Application Security', 'Threat Intelligence', 'Platform Administration'],
      interests: ['Zero Trust Architecture', 'AI-assisted Cyber Defense'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.users.unshift(owner);
    this.data.meta.ownerConfigured = true;
    this.logAudit('OWNER_INITIALIZED', owner.id, owner.username, 'Owner account provisioned securely.', 'critical');
    this.save();
    syncUserToFirestore(owner).catch(() => {});
    return owner;
  }

  // User management
  public createUser(username: string, email: string, passwordPlain: string, displayName: string): User {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const existing = this.data.users.find(
      (u) => u.username.toLowerCase() === normalizedUsername || u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      throw new Error('Username or email is already registered.');
    }

    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(passwordPlain, salt);

    const isPlatformOwner =
      normalizedEmail === 'rahulamirisetti@gmail.com' || normalizedUsername === 'rahul_amirisetti';

    const newUser: User = {
      id: isPlatformOwner ? `owner-${Date.now()}` : `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim() || username.trim(),
      bio: isPlatformOwner ? 'Owner & Chief Administrator of RVCYBER AGENT' : '',
      avatar: '',
      role: isPlatformOwner ? 'OWNER' : 'USER',
      skills: isPlatformOwner ? ['Platform Administration', 'Threat Intelligence', 'Cyber Operations'] : [],
      interests: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isPlatformOwner) {
      this.purgeMockOwner();
      this.data.meta.ownerConfigured = true;
    }

    this.data.users.push(newUser);
    this.logAudit(
      isPlatformOwner ? 'OWNER_INITIALIZED' : 'USER_REGISTERED',
      newUser.id,
      newUser.username,
      isPlatformOwner ? 'Platform owner registered and provisioned.' : 'New regular user account registered.',
      isPlatformOwner ? 'critical' : 'info'
    );
    this.save();
    syncUserToFirestore(newUser).catch(() => {});
    return newUser;
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByUsernameOrEmail(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
  }

  public updateUserProfile(id: string, updates: Partial<Pick<User, 'displayName' | 'bio' | 'avatar' | 'skills' | 'interests'>>): User {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error('User not found.');

    if (updates.displayName !== undefined) user.displayName = updates.displayName.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.avatar !== undefined) user.avatar = updates.avatar.trim();
    if (updates.skills !== undefined) user.skills = updates.skills;
    if (updates.interests !== undefined) user.interests = updates.interests;
    user.updatedAt = new Date().toISOString();

    this.save();
    return user;
  }

  // Owner user management (owner cannot change roles, but can suspend/delete regular users)
  public getAllUsers(): Omit<User, 'passwordHash'>[] {
    return this.data.users.map(({ passwordHash, ...safe }) => safe);
  }

  public setUserStatus(id: string, status: 'active' | 'suspended', actor: User): User {
    if (actor.role !== 'OWNER') throw new Error('Unauthorized');
    const target = this.data.users.find((u) => u.id === id);
    if (!target) throw new Error('User not found');
    if (target.role === 'OWNER') throw new Error('Cannot suspend the owner account.');

    target.status = status;
    target.updatedAt = new Date().toISOString();
    this.logAudit('USER_STATUS_CHANGE', actor.id, actor.username, `Updated user ${target.username} status to ${status}`, 'warning');
    this.save();
    return target;
  }

  public deleteUser(id: string, actor: User) {
    if (actor.role !== 'OWNER') throw new Error('Unauthorized');
    const target = this.data.users.find((u) => u.id === id);
    if (!target) throw new Error('User not found');
    if (target.role === 'OWNER') throw new Error('Cannot delete owner account');

    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.logAudit('USER_DELETED', actor.id, actor.username, `Deleted user ${target.username}`, 'warning');
    this.save();
  }

  // Video projects
  public createVideoProject(data: Omit<VideoProject, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>): VideoProject {
    const project: VideoProject = {
      ...data,
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.videoProjects.unshift(project);
    this.save();
    syncVideoProjectToFirestore(project).catch(() => {});
    return project;
  }

  public getVideoProject(id: string): VideoProject | undefined {
    return this.data.videoProjects.find((v) => v.id === id);
  }

  public getUserVideoProjects(userId: string): VideoProject[] {
    return this.data.videoProjects.filter((v) => v.userId === userId);
  }

  public getPublicVideos(): VideoProject[] {
    return this.data.videoProjects.filter((v) => v.isPublic && v.status === 'completed');
  }

  public getAllVideoProjects(): VideoProject[] {
    return this.data.videoProjects;
  }

  public updateVideoProject(id: string, updates: Partial<VideoProject>): VideoProject {
    const project = this.data.videoProjects.find((v) => v.id === id);
    if (!project) throw new Error('Video project not found');

    Object.assign(project, updates);
    project.updatedAt = new Date().toISOString();
    this.save();
    syncVideoProjectToFirestore(project).catch(() => {});
    return project;
  }

  public deleteVideoProject(id: string, userId: string, isOwner = false): boolean {
    const project = this.data.videoProjects.find((v) => v.id === id);
    if (!project) return false;
    if (project.userId !== userId && !isOwner) {
      throw new Error('Unauthorized to delete this video project');
    }
    this.data.videoProjects = this.data.videoProjects.filter((v) => v.id !== id);
    this.save();
    return true;
  }

  // Articles
  public getArticles(onlyPublished = true): Article[] {
    if (onlyPublished) {
      return this.data.articles.filter((a) => a.isPublished);
    }
    return this.data.articles;
  }

  public getArticleById(id: string): Article | undefined {
    return this.data.articles.find((a) => a.id === id);
  }

  public getArticleBySlug(slug: string): Article | undefined {
    return this.data.articles.find((a) => a.slug === slug);
  }

  public createArticle(author: User, articleData: Omit<Article, 'id' | 'authorId' | 'authorName' | 'authorUsername' | 'authorAvatar' | 'viewsCount' | 'likesCount' | 'createdAt' | 'updatedAt'>): Article {
    const article: Article = {
      ...articleData,
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorId: author.id,
      authorName: author.displayName,
      authorUsername: author.username,
      authorAvatar: author.avatar,
      viewsCount: 0,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.articles.unshift(article);
    this.save();
    syncArticleToFirestore(article).catch(() => {});
    return article;
  }

  public updateArticle(id: string, userId: string, updates: Partial<Article>, isOwner = false): Article {
    const article = this.data.articles.find((a) => a.id === id);
    if (!article) throw new Error('Article not found');
    if (article.authorId !== userId && !isOwner) throw new Error('Unauthorized');

    Object.assign(article, updates);
    article.updatedAt = new Date().toISOString();
    this.save();
    return article;
  }

  public deleteArticle(id: string, userId: string, isOwner = false): boolean {
    const article = this.data.articles.find((a) => a.id === id);
    if (!article) return false;
    if (article.authorId !== userId && !isOwner) throw new Error('Unauthorized');

    this.data.articles = this.data.articles.filter((a) => a.id !== id);
    this.save();
    return true;
  }

  public incrementArticleViews(id: string) {
    const article = this.data.articles.find((a) => a.id === id);
    if (article) {
      article.viewsCount = (article.viewsCount || 0) + 1;
      this.save();
    }
  }

  // Documents
  public getDocuments(onlyPublic = true): DocumentItem[] {
    if (onlyPublic) {
      return this.data.documents.filter((d) => d.isPublic);
    }
    return this.data.documents;
  }

  public getDocumentById(id: string): DocumentItem | undefined {
    return this.data.documents.find((d) => d.id === id);
  }

  public createDocument(uploader: User, docData: Omit<DocumentItem, 'id' | 'uploaderId' | 'uploaderUsername' | 'uploaderName' | 'downloadsCount' | 'createdAt'>): DocumentItem {
    const doc: DocumentItem = {
      ...docData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploaderId: uploader.id,
      uploaderUsername: uploader.username,
      uploaderName: uploader.displayName,
      downloadsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.data.documents.unshift(doc);
    this.save();
    syncDocumentToFirestore(doc).catch(() => {});
    return doc;
  }

  public incrementDocumentDownloads(id: string) {
    const doc = this.data.documents.find((d) => d.id === id);
    if (doc) {
      doc.downloadsCount = (doc.downloadsCount || 0) + 1;
      this.save();
    }
  }

  public deleteDocument(id: string, userId: string, isOwner = false): boolean {
    const doc = this.data.documents.find((d) => d.id === id);
    if (!doc) return false;
    if (doc.uploaderId !== userId && !isOwner) throw new Error('Unauthorized');

    this.data.documents = this.data.documents.filter((d) => d.id !== id);
    this.save();
    return true;
  }

  // Community posts
  public getCommunityPosts(): CommunityPost[] {
    return this.data.communityPosts;
  }

  public getCommunityPostById(id: string): CommunityPost | undefined {
    return this.data.communityPosts.find((p) => p.id === id);
  }

  public createCommunityPost(author: User, title: string, content: string, category: string, tags: string[]): CommunityPost {
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorId: author.id,
      authorName: author.displayName,
      authorUsername: author.username,
      authorAvatar: author.avatar,
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags,
      upvotes: 0,
      replies: [],
      createdAt: new Date().toISOString(),
    };
    this.data.communityPosts.unshift(post);
    this.save();
    return post;
  }

  public addPostReply(postId: string, author: User, content: string) {
    const post = this.data.communityPosts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    const reply = {
      id: `rep-${Date.now()}`,
      authorId: author.id,
      authorName: author.displayName,
      authorUsername: author.username,
      authorAvatar: author.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    post.replies.push(reply);
    this.save();
    return reply;
  }

  public deleteCommunityPost(id: string, userId: string, isOwner = false): boolean {
    const post = this.data.communityPosts.find((p) => p.id === id);
    if (!post) return false;
    if (post.authorId !== userId && !isOwner) throw new Error('Unauthorized');

    this.data.communityPosts = this.data.communityPosts.filter((p) => p.id !== id);
    this.save();
    return true;
  }

  // Audit logs & reports
  public logAudit(action: string, actorId: string, actorUsername: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info', ipAddress?: string) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      actorId,
      actorUsername,
      ipAddress,
      details,
      severity,
    };
    this.data.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
  }

  public getAuditLogs(isOwner: boolean): AuditLog[] {
    if (!isOwner) throw new Error('Unauthorized');
    return this.data.auditLogs;
  }

  public createReport(reporterId: string, contentType: 'article' | 'video' | 'document' | 'post', contentId: string, reason: string): ContentReport {
    const report: ContentReport = {
      id: `rep-${Date.now()}`,
      reporterId,
      contentType,
      contentId,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  public getReports(isOwner: boolean): ContentReport[] {
    if (!isOwner) throw new Error('Unauthorized');
    return this.data.reports;
  }

  public updateReportStatus(reportId: string, status: 'resolved' | 'dismissed', isOwner: boolean) {
    if (!isOwner) throw new Error('Unauthorized');
    const r = this.data.reports.find((rep) => rep.id === reportId);
    if (r) {
      r.status = status;
      this.save();
    }
  }
}

export const db = new DatabaseService();
