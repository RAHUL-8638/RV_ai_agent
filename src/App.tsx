import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

import { HomePage } from './pages/HomePage';
import { AgentPage } from './pages/AgentPage';
import { VideoStudioPage } from './pages/VideoStudioPage';
import { LearnPage } from './pages/LearnPage';
import { RoadmapsPage } from './pages/RoadmapsPage';
import { LabsPage } from './pages/LabsPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { VideosPage } from './pages/VideosPage';
import { CommunityPage } from './pages/CommunityPage';
import { CareersPage } from './pages/CareersPage';
import { ProfilePage } from './pages/ProfilePage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';

import { User, Article, DocumentItem } from './types';
import { safeFetch, clearStoredToken } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ownerConfigured, setOwnerConfigured] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Check auth status safely
  const checkAuthStatus = async () => {
    try {
      const res = await safeFetch<{ ownerConfigured: boolean; user: User | null }>('/api/auth/status');
      if (res.ok && res.data) {
        setOwnerConfigured(Boolean(res.data.ownerConfigured));
        if (res.data.user) {
          // Fetch full user profile
          const meRes = await safeFetch<{ user: User }>('/api/auth/me');
          if (meRes.ok && meRes.data?.user) {
            setCurrentUser(meRes.data.user);
          } else {
            setCurrentUser(res.data.user);
          }
        } else {
          // Check /api/auth/me with bearer token from localStorage
          const meRes = await safeFetch<{ user: User }>('/api/auth/me');
          if (meRes.ok && meRes.data?.user) {
            setCurrentUser(meRes.data.user);
          } else {
            setCurrentUser(null);
          }
        }
      }
    } catch (err) {
      console.warn('Notice verifying auth status:', err);
    }
  };

  // Fetch articles & documents safely
  const fetchContent = async () => {
    try {
      const [artRes, docRes] = await Promise.all([
        safeFetch<{ articles: Article[] }>('/api/articles'),
        safeFetch<{ documents: DocumentItem[] }>('/api/documents'),
      ]);
      if (artRes.ok && artRes.data?.articles) {
        setArticles(artRes.data.articles);
      }
      if (docRes.ok && docRes.data?.documents) {
        setDocuments(docRes.data.documents);
      }
    } catch (err) {
      console.warn('Notice fetching content:', err);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    fetchContent();
  }, []);

  const handleLogout = async () => {
    try {
      await safeFetch('/api/auth/logout', { method: 'POST' });
      clearStoredToken();
      setCurrentUser(null);
      if (activeTab === 'admin' || activeTab === 'profile') {
        setActiveTab('home');
      }
    } catch (err) {
      console.warn('Logout notice:', err);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setOwnerConfigured(true);
    fetchContent();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onNavigate={(tab) => setActiveTab(tab)}
            articles={articles}
            documents={documents}
          />
        )}

        {activeTab === 'agent' && <AgentPage />}

        {activeTab === 'studio' && (
          <VideoStudioPage
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'learn' && <LearnPage />}

        {activeTab === 'roadmaps' && <RoadmapsPage />}

        {activeTab === 'labs' && <LabsPage />}

        {activeTab === 'articles' && (
          <ArticlesPage
            articles={articles}
            currentUser={currentUser}
            onRefresh={fetchContent}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'books' && (
          <DocumentsPage
            documents={documents}
            currentUser={currentUser}
            onRefresh={fetchContent}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'videos' && (
          <VideosPage onNavigateToStudio={() => setActiveTab('studio')} />
        )}

        {activeTab === 'community' && (
          <CommunityPage
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'careers' && <CareersPage />}

        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onRefreshUser={checkAuthStatus}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <OwnerDashboardPage currentUser={currentUser} />
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={(tab) => setActiveTab(tab)} />

      {/* Authentication & Bootstrap Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        ownerConfigured={ownerConfigured}
      />
    </div>
  );
}
