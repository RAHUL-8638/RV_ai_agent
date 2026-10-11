import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

import { db, User } from './server/db.js';
import { askCyberAgent } from './server/agentService.js';
import {
  generateStoryboardAndScript,
  executeVideoJobPipeline,
  generateSrtSubtitles,
} from './server/videoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'rvcyber-agent-cryptographic-master-key-2026';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser(SESSION_SECRET));

// Ensure upload folders exist
const uploadsDir = path.resolve(__dirname, 'uploads');
const docsDir = path.join(uploadsDir, 'documents');
const videosDir = path.join(uploadsDir, 'videos');
const audioDir = path.join(uploadsDir, 'audio');

for (const dir of [uploadsDir, docsDir, videosDir, audioDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Serve uploaded static files
app.use('/uploads', express.static(uploadsDir));

// Sample dummy PDF files so downloads work immediately for seed documents
const sampleOwaspPdf = path.join(docsDir, 'owasp-top-10-guide.pdf');
if (!fs.existsSync(sampleOwaspPdf)) {
  fs.writeFileSync(
    sampleOwaspPdf,
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF',
    'utf-8'
  );
}

const sampleLinuxPdf = path.join(docsDir, 'linux-security-handbook.pdf');
if (!fs.existsSync(sampleLinuxPdf)) {
  fs.writeFileSync(
    sampleLinuxPdf,
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF',
    'utf-8'
  );
}

// ----------------------------------------------------
// Authentication & Cryptographic Session Helpers
// ----------------------------------------------------
function signToken(userId: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${userId}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${hmac}`;
}

function verifyToken(token: string): string | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (expectedHmac !== signature) return null;

    const [userId, expiresAtStr] = payload.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) return null;

    return userId;
  } catch {
    return null;
  }
}

// Request extension
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Auth Middleware: extracts user if token present in cookie, Authorization header, or x-access-token
function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.rvcyber_session;

  if (!token && req.headers.authorization) {
    const rawAuth = req.headers.authorization.trim();
    if (rawAuth.toLowerCase().startsWith('bearer ')) {
      token = rawAuth.substring(7).trim();
    } else {
      token = rawAuth;
    }
  }

  if (!token && req.headers['x-access-token']) {
    token = String(req.headers['x-access-token']).trim();
  }

  if (token) {
    const userId = verifyToken(token);
    if (userId) {
      const user = db.findUserById(userId);
      if (user && user.status === 'active') {
        // Automatically verify and promote platform creator to OWNER
        if (
          (user.email.toLowerCase() === 'rahulamirisetti@gmail.com' ||
            user.username.toLowerCase() === 'rahul_amirisetti') &&
          user.role !== 'OWNER'
        ) {
          db.promoteToOwner(user.id);
          user.role = 'OWNER';
        }
        req.user = user;
      }
    }
  }
  next();
}

app.use(authMiddleware);

// Strict authentication enforcement middleware (401 Unauthorized)
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED: Please sign in to proceed.',
      code: 'AUTH_REQUIRED',
    });
  }
  next();
}

// CRITICAL: Owner-Only Authorization Middleware (401 for unauthenticated, 403 for non-owner)
function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'UNAUTHORIZED: Authentication required. Please sign in.',
      code: 'AUTH_REQUIRED',
    });
  }

  // Ensure verified creator always holds OWNER role
  if (
    (req.user.email.toLowerCase() === 'rahulamirisetti@gmail.com' ||
      req.user.username.toLowerCase() === 'rahul_amirisetti') &&
    req.user.role !== 'OWNER'
  ) {
    db.promoteToOwner(req.user.id);
    req.user.role = 'OWNER';
  }

  if (req.user.role !== 'OWNER') {
    db.logAudit(
      'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
      req.user.id,
      req.user.username,
      `Non-owner attempted access to administrative route: ${req.originalUrl}`,
      'warning',
      req.ip
    );
    // Use 401 with FORBIDDEN_OWNER_ONLY code to prevent Nginx proxy_intercept_errors from replacing JSON with HTML 403 page
    return res.status(401).json({
      error: 'FORBIDDEN_OWNER_ONLY: Administrative access is strictly restricted to the platform owner.',
      code: 'FORBIDDEN_OWNER_ONLY',
    });
  }
  next();
}

// ----------------------------------------------------
// Public Auth Endpoints
// ----------------------------------------------------
app.get('/api/auth/status', (req: AuthenticatedRequest, res) => {
  res.json({
    ownerConfigured: db.hasOwner(),
    authenticated: !!req.user,
    user: req.user
      ? {
          id: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName,
          email: req.user.email,
          role: req.user.role,
          avatar: req.user.avatar,
        }
      : null,
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    const newUser = db.createUser(username, email, password, displayName || username);
    const token = signToken(newUser.id);

    res.cookie('rvcyber_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash, ...safeUser } = newUser;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required.' });
  }

  const user = db.findUserByUsernameOrEmail(identifier);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(401).json({ error: 'Your account has been suspended by the platform administrator.' });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    db.logAudit('FAILED_LOGIN_ATTEMPT', user.id, user.username, 'Incorrect password attempt.', 'warning', req.ip);
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  // Automatically ensure verified creator email has OWNER role
  if (user.email.toLowerCase() === 'rahulamirisetti@gmail.com' && user.role !== 'OWNER') {
    db.promoteToOwner(user.id);
    user.role = 'OWNER';
  }

  const token = signToken(user.id);
  res.cookie('rvcyber_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  db.logAudit('LOGIN_SUCCESS', user.id, user.username, 'User logged in successfully.', 'info', req.ip);
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('rvcyber_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  const { passwordHash, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// ----------------------------------------------------
// Owner Bootstrap Endpoint
// ----------------------------------------------------
app.post('/api/admin/bootstrap', (req, res) => {
  const { username, email, password, displayName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Owner username, email, and password are required.' });
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const isVerifiedOwner =
    normalizedEmail === 'rahulamirisetti@gmail.com' || normalizedUsername === 'rahul_amirisetti';

  if (db.hasOwner() && !isVerifiedOwner) {
    return res.status(409).json({
      error: 'OWNER_ALREADY_INITIALIZED: The platform owner has already been established.',
      code: 'OWNER_ALREADY_INITIALIZED',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Owner password must be at least 8 characters long.' });
  }

  try {
    const owner = db.createFirstOwner(username, normalizedEmail, password, displayName || 'System Owner');
    const token = signToken(owner.id);

    res.cookie('rvcyber_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash, ...safeOwner } = owner;
    res.json({
      message: 'Owner successfully provisioned. Administrative privileges secured.',
      user: safeOwner,
      token,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Owner initialization failed' });
  }
});

app.post('/api/admin/claim-owner', (req: AuthenticatedRequest, res) => {
  const { email, password, username, displayName } = req.body;
  const targetEmail = (email || req.user?.email || '').trim().toLowerCase();
  const targetUsername = (username || req.user?.username || '').trim().toLowerCase();
  const isVerifiedOwner =
    targetEmail === 'rahulamirisetti@gmail.com' || targetUsername === 'rahul_amirisetti';

  if (!isVerifiedOwner && db.hasOwner()) {
    return res.status(401).json({
      error: 'FORBIDDEN: Only the verified platform creator may claim administrative ownership.',
      code: 'FORBIDDEN',
    });
  }

  if (req.user) {
    db.promoteToOwner(req.user.id);
    const updated = db.findUserById(req.user.id);
    const { passwordHash, ...safe } = updated!;
    return res.json({ success: true, message: 'Platform ownership claimed successfully.', user: safe });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required to claim ownership.' });
  }

  try {
    const owner = db.createFirstOwner(username, targetEmail, password, displayName || 'System Owner');
    const token = signToken(owner.id);
    res.cookie('rvcyber_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const { passwordHash, ...safeOwner } = owner;
    res.json({ success: true, message: 'Platform ownership established successfully.', user: safeOwner, token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to claim owner' });
  }
});

// ----------------------------------------------------
// Owner Administration Protected Endpoints
// ----------------------------------------------------
app.get('/api/admin/stats', requireOwner, (req, res) => {
  const users = db.getAllUsers();
  const projects = db.getAllVideoProjects();
  const articles = db.getArticles(false);
  const docs = db.getDocuments(false);
  const auditLogs = db.getAuditLogs(true);
  const reports = db.getReports(true);

  res.json({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    totalVideoJobs: projects.length,
    completedVideos: projects.filter((p) => p.status === 'completed').length,
    renderingJobs: projects.filter((p) => ['queued', 'generating_script', 'generating_assets', 'generating_voice', 'rendering'].includes(p.status)).length,
    totalArticles: articles.length,
    totalDocuments: docs.length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    auditLogsCount: auditLogs.length,
  });
});

app.get('/api/admin/users', requireOwner, (req, res) => {
  res.json({ users: db.getAllUsers() });
});

app.post('/api/admin/users/:id/status', requireOwner, (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const updated = db.setUserStatus(req.params.id, status, req.user!);
    const { passwordHash, ...safe } = updated;
    res.json({ user: safe });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', requireOwner, (req: AuthenticatedRequest, res) => {
  try {
    db.deleteUser(req.params.id, req.user!);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/audit-logs', requireOwner, (req, res) => {
  res.json({ logs: db.getAuditLogs(true) });
});

app.get('/api/admin/reports', requireOwner, (req, res) => {
  res.json({ reports: db.getReports(true) });
});

app.post('/api/admin/reports/:id/status', requireOwner, (req, res) => {
  const { status } = req.body;
  if (!['resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.updateReportStatus(req.params.id, status, true);
  res.json({ success: true });
});

app.get('/api/admin/video-jobs', requireOwner, (req, res) => {
  res.json({ projects: db.getAllVideoProjects() });
});

// ----------------------------------------------------
// AI Cybersecurity Agent Endpoints
// ----------------------------------------------------
app.post('/api/agent/ask', async (req, res) => {
  const { prompt, language = 'en', mode = 'chat', history = [] } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await askCyberAgent(prompt, language, mode, history);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Agent failed to respond' });
  }
});

// ----------------------------------------------------
// AI Video Studio Endpoints
// ----------------------------------------------------
// Step 1: Pre-generate Storyboard & Script for review
app.post('/api/video/storyboard', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { topic, userPrompt, language = 'en', durationSeconds = 60, audience = 'beginner', style = 'cyberpunk' } = req.body;

  if (!topic && !userPrompt) {
    return res.status(400).json({ error: 'Topic or Prompt is required' });
  }

  try {
    const result = await generateStoryboardAndScript(
      topic || userPrompt,
      userPrompt || topic,
      language,
      parseInt(durationSeconds, 10) || 60,
      audience,
      style
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate storyboard' });
  }
});

// Step 2: Create Project and initiate background rendering
app.post('/api/video/create', requireAuth, (req: AuthenticatedRequest, res) => {
  const {
    title,
    topic,
    language = 'en',
    durationSeconds = 60,
    aspectRatio = '16:9',
    style = 'cyberpunk',
    voice = 'Kore',
    narrationSpeed = 1,
    subtitlesEnabled = true,
    audience = 'beginner',
    storyboard = [],
    script = '',
    isPublic = false,
  } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required.' });
  }

  try {
    const project = db.createVideoProject({
      userId: req.user!.id,
      title: title || `${topic} Explained`,
      topic,
      language,
      durationSeconds: parseInt(durationSeconds, 10) || 60,
      aspectRatio,
      style,
      voice,
      narrationSpeed: parseFloat(narrationSpeed) || 1,
      subtitlesEnabled: !!subtitlesEnabled,
      audience,
      storyboard,
      script,
      isPublic: !!isPublic,
    });

    // Run real video rendering pipeline asynchronously in background
    executeVideoJobPipeline(project.id).catch((err) => {
      console.error(`Error in background video job ${project.id}:`, err);
    });

    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create video project' });
  }
});

app.get('/api/video/projects', requireAuth, (req: AuthenticatedRequest, res) => {
  const projects = db.getUserVideoProjects(req.user!.id);
  res.json({ projects });
});

app.get('/api/video/projects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const project = db.getVideoProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Video project not found' });
  }
  // User can only view their own projects unless they are owner or project is public
  if (project.userId !== req.user!.id && req.user!.role !== 'OWNER' && !project.isPublic) {
    return res.status(401).json({ error: 'FORBIDDEN: Private video project. Access denied.', code: 'FORBIDDEN' });
  }
  res.json({ project });
});

app.put('/api/video/projects/:id/update-storyboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const { storyboard, script, title } = req.body;
  const project = db.getVideoProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.userId !== req.user!.id && req.user!.role !== 'OWNER') {
    return res.status(401).json({ error: 'FORBIDDEN: You do not have permission to modify this project.', code: 'FORBIDDEN' });
  }

  const updated = db.updateVideoProject(req.params.id, {
    storyboard: storyboard || project.storyboard,
    script: script || project.script,
    title: title || project.title,
  });

  res.json({ project: updated });
});

app.post('/api/video/projects/:id/rerender', requireAuth, (req: AuthenticatedRequest, res) => {
  const project = db.getVideoProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.userId !== req.user!.id && req.user!.role !== 'OWNER') {
    return res.status(401).json({ error: 'FORBIDDEN: You do not have permission to re-render this project.', code: 'FORBIDDEN' });
  }

  db.updateVideoProject(req.params.id, {
    status: 'queued',
    progress: 5,
    statusMessage: 'Re-render queued...',
  });

  executeVideoJobPipeline(req.params.id).catch((err) => {
    console.error(`Error in rerender ${req.params.id}:`, err);
  });

  res.json({ message: 'Re-rendering initiated', projectId: req.params.id });
});

app.delete('/api/video/projects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const success = db.deleteVideoProject(req.params.id, req.user!.id, req.user!.role === 'OWNER');
    if (!success) return res.status(404).json({ error: 'Video project not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'FORBIDDEN', code: 'FORBIDDEN' });
  }
});

// Download finished MP4 with correct headers
app.get('/api/video/projects/:id/download', requireAuth, (req: AuthenticatedRequest, res) => {
  const project = db.getVideoProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Video not found' });
  if (project.userId !== req.user!.id && req.user!.role !== 'OWNER' && !project.isPublic) {
    return res.status(401).json({ error: 'FORBIDDEN: Access denied to private video project.', code: 'FORBIDDEN' });
  }

  const videoFilePath = path.join(videosDir, `${project.id}.mp4`);
  if (!fs.existsSync(videoFilePath)) {
    return res.status(404).json({ error: 'Rendered video file is not yet available.' });
  }

  const cleanFilename = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
  res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
  res.setHeader('Content-Type', 'video/mp4');
  fs.createReadStream(videoFilePath).pipe(res);
});

app.get('/api/video/public', (req, res) => {
  const videos = db.getPublicVideos();
  res.json({ videos });
});

// ----------------------------------------------------
// Articles Endpoints
// ----------------------------------------------------
app.get('/api/articles', (req, res) => {
  const articles = db.getArticles(true);
  res.json({ articles });
});

app.get('/api/articles/:identifier', (req, res) => {
  const { identifier } = req.params;
  const article = db.getArticleBySlug(identifier) || db.getArticleById(identifier);
  if (!article) return res.status(404).json({ error: 'Article not found' });

  db.incrementArticleViews(article.id);
  res.json({ article });
});

app.post('/api/articles', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, summary, content, category, tags = [], coverImage, isPublished = true } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}-${Date.now().toString().slice(-4)}`;

  const article = db.createArticle(req.user!, {
    title,
    slug,
    summary: summary || content.slice(0, 160),
    content,
    category: category || 'General Cybersecurity',
    tags,
    coverImage,
    isPublished: !!isPublished,
  });

  res.json({ article });
});

app.put('/api/articles/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = db.updateArticle(req.params.id, req.user!.id, req.body, req.user!.role === 'OWNER');
    res.json({ article: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const ok = db.deleteArticle(req.params.id, req.user!.id, req.user!.role === 'OWNER');
    if (!ok) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Documents & Books Endpoints
// ----------------------------------------------------
app.get('/api/documents', (req, res) => {
  const documents = db.getDocuments(true);
  res.json({ documents });
});

app.get('/api/documents/:id', (req, res) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ document: doc });
});

app.post('/api/documents', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, description, category, tags = [], author, previewSnippet, fileUrl, fileSize, pageCount } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const newDoc = db.createDocument(req.user!, {
    title,
    description,
    category: category || 'Cybersecurity Guides',
    tags,
    author: author || req.user!.displayName,
    fileSize: fileSize || '1.5 MB',
    pageCount: parseInt(pageCount, 10) || 12,
    fileUrl: fileUrl || '/uploads/documents/owasp-top-10-guide.pdf',
    previewSnippet: previewSnippet || description,
    isPublic: true,
  });

  res.json({ document: newDoc });
});

app.get('/api/documents/:id/download', (req, res) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  db.incrementDocumentDownloads(doc.id);
  const targetPath = path.resolve(__dirname, doc.fileUrl.replace(/^\//, ''));
  if (fs.existsSync(targetPath)) {
    return res.download(targetPath, `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
  }
  // Fallback to sample pdf
  res.download(sampleOwaspPdf, `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
});

app.delete('/api/documents/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const ok = db.deleteDocument(req.params.id, req.user!.id, req.user!.role === 'OWNER');
    if (!ok) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Community Posts & Discussions
// ----------------------------------------------------
app.get('/api/community/posts', (req, res) => {
  res.json({ posts: db.getCommunityPosts() });
});

app.post('/api/community/posts', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, content, category = 'General', tags = [] } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  const post = db.createCommunityPost(req.user!, title, content, category, tags);
  res.json({ post });
});

app.post('/api/community/posts/:id/reply', requireAuth, (req: AuthenticatedRequest, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const reply = db.addPostReply(req.params.id, req.user!, content);
    res.json({ reply });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/community/posts/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const ok = db.deleteCommunityPost(req.params.id, req.user!.id, req.user!.role === 'OWNER');
    if (!ok) return res.status(404).json({ error: 'Post not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// User Profiles
// ----------------------------------------------------
app.get('/api/users/:username', (req, res) => {
  const user = db.findUserByUsernameOrEmail(req.params.username);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const articles = db.getArticles(true).filter((a) => a.authorId === user.id);
  const videos = db.getPublicVideos().filter((v) => v.userId === user.id);
  const documents = db.getDocuments(true).filter((d) => d.uploaderId === user.id);

  const { passwordHash, email, ...safeProfile } = user;
  res.json({
    profile: safeProfile,
    articles,
    videos,
    documents,
  });
});

app.put('/api/users/profile/update', requireAuth, (req: AuthenticatedRequest, res) => {
  const { displayName, bio, avatar, skills, interests } = req.body;
  try {
    const updated = db.updateUserProfile(req.user!.id, {
      displayName,
      bio,
      avatar,
      skills,
      interests,
    });
    const { passwordHash, ...safe } = updated;
    res.json({ user: safe });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Content Reports
// ----------------------------------------------------
app.post('/api/reports', requireAuth, (req: AuthenticatedRequest, res) => {
  const { contentType, contentId, reason } = req.body;
  if (!contentType || !contentId || !reason) {
    return res.status(400).json({ error: 'Content type, ID, and reason are required' });
  }
  const report = db.createReport(req.user!.id, contentType, contentId, reason);
  res.json({ report, message: 'Report submitted for administrator moderation.' });
});

// ----------------------------------------------------
// Route Aliases
// ----------------------------------------------------
app.get('/api/videos', (req, res) => {
  res.json({ videos: db.getPublicVideos() });
});
app.get('/api/docs', (req, res) => {
  res.json({ documents: db.getDocuments(true) });
});
app.get('/api/posts', (req, res) => {
  res.json({ posts: db.getCommunityPosts() });
});

// ----------------------------------------------------
// Strict JSON Catch-All for /api and /api/* (Prevents returning HTML to client API requests)
// ----------------------------------------------------
app.all(['/api', '/api/*'], (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Express Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Express Error]:', err);
  if (req.originalUrl.startsWith('/api')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
  next(err);
});

// ----------------------------------------------------
// Vite Middleware / Production Server Integration
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RVCYBER AGENT] Server initialized on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
});
