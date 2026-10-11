export interface User {
  id: string;
  username: string;
  email: string;
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
