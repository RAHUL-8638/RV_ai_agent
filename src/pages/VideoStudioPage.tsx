import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Pause,
  Download,
  Share2,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Volume2,
  Subtitles,
  FileText,
  Sliders,
  ChevronRight,
  Eye,
  Lock,
  Globe,
  Loader2,
} from 'lucide-react';
import { VideoProject, VideoScene, User } from '../types';
import { safeFetch } from '../utils/api';

interface VideoStudioProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const VideoStudioPage: React.FC<VideoStudioProps> = ({ currentUser, onOpenAuth }) => {
  // Step state: 1 = Config & Prompt, 2 = Storyboard Review & Script Editor, 3 = Rendering / Live Preview
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Configuration Form State
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [promptText, setPromptText] = useState(
    'Create an animated educational video explaining SQL Injection in Telugu, including threat introduction, a safe demonstration in a local lab, syntax breakdown, and parameterized query defense.'
  );
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>('te');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [style, setStyle] = useState<'cyberpunk' | 'terminal' | 'motion_graphics' | 'whiteboard'>('cyberpunk');
  const [voice, setVoice] = useState<'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon'>('Kore');
  const [narrationSpeed, setNarrationSpeed] = useState(1.0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [audience, setAudience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [isPublic, setIsPublic] = useState(false);

  // Storyboard review state
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [scenes, setScenes] = useState<VideoScene[]>([]);
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);

  // Active video rendering project
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null);

  // User library
  const [userProjects, setUserProjects] = useState<VideoProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch user projects
  const fetchProjects = async () => {
    if (!currentUser) return;
    setLoadingProjects(true);
    try {
      const result = await safeFetch<{ projects: VideoProject[] }>('/api/video/projects');
      if (result.ok && result.data) {
        setUserProjects(result.data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load user projects', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentUser]);

  // Polling for active project rendering progress
  useEffect(() => {
    if (!activeProjectId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const result = await safeFetch<{ project: VideoProject }>(`/api/video/projects/${activeProjectId}`);
        if (isMounted && result.ok && result.data?.project) {
          setActiveProject(result.data.project);

          // If completed or failed, refresh library
          if (result.data.project.status === 'completed' || result.data.project.status === 'failed') {
            fetchProjects();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeProjectId]);

  // Step 1 -> Step 2: Generate Storyboard & Script
  const handleGenerateStoryboard = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!topic && !promptText) {
      alert('Please enter a topic or prompt for your cybersecurity video.');
      return;
    }

    setLoadingStoryboard(true);
    try {
      const result = await safeFetch('/api/video/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic || promptText.slice(0, 50),
          userPrompt: promptText,
          language,
          durationSeconds,
          audience,
          style,
        }),
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Failed to create storyboard');
      }

      const data = result.data;
      setGeneratedTitle(data.title || title || `${topic} Explained`);
      setGeneratedScript(data.script || '');
      setScenes(data.scenes || []);
      setCurrentStep(2);
    } catch (err: any) {
      alert(err.message || 'Error creating storyboard');
    } finally {
      setLoadingStoryboard(false);
    }
  };

  // Step 2 -> Step 3: Render Full Video
  const handleStartRender = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    try {
      const result = await safeFetch<{ project: VideoProject }>('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: generatedTitle || title || topic,
          topic: topic || promptText.slice(0, 50),
          language,
          durationSeconds,
          aspectRatio,
          style,
          voice,
          narrationSpeed,
          subtitlesEnabled,
          audience,
          storyboard: scenes,
          script: generatedScript,
          isPublic,
        }),
      });

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Failed to initialize video job');
      }

      const data = result.data;
      setActiveProjectId(data.project.id);
      setActiveProject(data.project);
      setCurrentStep(3);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Rendering error');
    }
  };

  // Re-render project
  const handleRerender = async (projId: string) => {
    try {
      const res = await safeFetch(`/api/video/projects/${projId}/rerender`, { method: 'POST' });
      if (res.ok) {
        setActiveProjectId(projId);
        setCurrentStep(3);
      } else {
        alert(res.error || 'Failed to trigger re-render');
      }
    } catch (err) {
      console.warn('Rerender notice:', err);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video project?')) return;
    try {
      const res = await safeFetch(`/api/video/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUserProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProjectId === id) {
          setActiveProjectId(null);
          setActiveProject(null);
          setCurrentStep(1);
        }
      } else {
        alert(res.error || 'Failed to delete project');
      }
    } catch (err) {
      console.warn('Notice deleting project:', err);
    }
  };

  // Copy share link
  const handleCopyLink = () => {
    if (!activeProject) return;
    const url = `${window.location.origin}/videos?id=${activeProject.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Studio Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-950/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
              <Video className="h-4 w-4" />
            </div>
            <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
              AI ANIMATED VIDEO STUDIO
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-sans">
            Synthesize educational cybersecurity videos from prompts with multilingual AI voice narration, terminal graphics, and MP4 downloads.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${
              currentStep === 1
                ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold'
                : 'border-zinc-800 text-zinc-400'
            }`}
          >
            <span>1. Prompt & Config</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <button
            onClick={() => scenes.length > 0 && setCurrentStep(2)}
            disabled={scenes.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${
              currentStep === 2
                ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold'
                : 'border-zinc-800 text-zinc-400 disabled:opacity-40'
            }`}
          >
            <span>2. Storyboard & Script</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <button
            onClick={() => activeProject && setCurrentStep(3)}
            disabled={!activeProject}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors ${
              currentStep === 3
                ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300 font-bold'
                : 'border-zinc-800 text-zinc-400 disabled:opacity-40'
            }`}
          >
            <span>3. Render & Preview</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Side: Active Workflow (Steps 1, 2, or 3) */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: PROMPT AND CONFIGURATION */}
          {currentStep === 1 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h2 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Step 1: Video Prompt & Directorial Configuration
                </h2>
                <span className="text-xs font-mono text-zinc-500">Multilingual Gemini Engine</span>
              </div>

              {/* Prompt Textarea */}
              <div>
                <label className="block text-xs font-mono font-medium text-zinc-300 mb-2">
                  Educational Prompt Directive:
                </label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Describe your desired cybersecurity video in detail. E.g., 'Create a 60-second Telugu animated video explaining Cross-Site Scripting (XSS), showing safe laboratory demonstration, DOM inspection, and Content Security Policy prevention.'"
                  className="w-full rounded border border-zinc-800 bg-black p-3.5 font-mono text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              {/* Topic & Title fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Topic / Concept:
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. SQL Injection, Buffer Overflow, XSS"
                    className="w-full rounded border border-zinc-800 bg-black px-3.5 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Custom Video Title (Optional):
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SQL Injection Masterclass (తెలుగు)"
                    className="w-full rounded border border-zinc-800 bg-black px-3.5 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Language */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Narration Language:
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="en">English (US/UK)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Target Duration:
                  </label>
                  <select
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
                    className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={30}>30 Seconds (Quick Byte)</option>
                    <option value={60}>60 Seconds (Standard Lab)</option>
                    <option value={120}>2 Minutes (Deep Dive)</option>
                    <option value={180}>3 Minutes (Complete Guide)</option>
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Aspect Ratio:
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="16:9">16:9 (Landscape Desktop/YouTube)</option>
                    <option value="9:16">9:16 (Vertical Mobile/Reels)</option>
                    <option value="1:1">1:1 (Square Post)</option>
                  </select>
                </div>

                {/* Animation Style */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Animation Style:
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as any)}
                    className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="cyberpunk">Cyberpunk Terminal Matrix</option>
                    <option value="terminal">Dark Linux Shell Console</option>
                    <option value="motion_graphics">2D Motion Graphics</option>
                    <option value="whiteboard">Defense Blueprint</option>
                  </select>
                </div>

                {/* AI Voice Selector */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    AI Voice Narrator:
                  </label>
                  <select
                    value={voice}
                    onChange={(e) => setVoice(e.target.value as any)}
                    className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Kore">Kore (Clear & Authoritative)</option>
                    <option value="Puck">Puck (Energetic Instructor)</option>
                    <option value="Fenrir">Fenrir (Deep & Resonant)</option>
                    <option value="Zephyr">Zephyr (Balanced Technical)</option>
                    <option value="Charon">Charon (Calm & Deliberate)</option>
                  </select>
                </div>

                {/* Audience Tier */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                    Target Audience:
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full rounded border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="beginner">Beginner (Foundations)</option>
                    <option value="intermediate">Intermediate (Practitioner)</option>
                    <option value="advanced">Advanced (Security Engineer)</option>
                  </select>
                </div>
              </div>

              {/* Subtitles & Visibility Toggle */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-zinc-800/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                  <input
                    type="checkbox"
                    checked={subtitlesEnabled}
                    onChange={(e) => setSubtitlesEnabled(e.target.checked)}
                    className="rounded border-zinc-700 bg-black text-emerald-500 focus:ring-0"
                  />
                  <span>Generate Subtitles (.SRT included)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-zinc-700 bg-black text-emerald-500 focus:ring-0"
                  />
                  <span>Publish to Community Video Gallery</span>
                </label>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={loadingStoryboard}
                  className="flex w-full items-center justify-center gap-2 rounded bg-emerald-500 py-3 font-mono text-xs font-bold text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:bg-emerald-400 disabled:opacity-50 transition-all active:scale-[0.99]"
                >
                  {loadingStoryboard ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Synthesizing Storyboard & Script...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Storyboard & Script (Review Before Render)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STORYBOARD & SCRIPT REVIEW / EDITOR */}
          {currentStep === 2 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h2 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Step 2: Storyboard & Narration Review
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Review and edit individual scenes, terminal commands, and voice script before final FFmpeg rendering.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-mono text-zinc-400 hover:text-white"
                >
                  ← Edit Settings
                </button>
              </div>

              {/* Editable Video Title */}
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  Confirmed Video Title:
                </label>
                <input
                  type="text"
                  value={generatedTitle}
                  onChange={(e) => setGeneratedTitle(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-black px-3.5 py-2 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Scene Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span>Scene Breakdown ({scenes.length} scenes)</span>
                  <span>Estimated Duration: {scenes.reduce((acc, s) => acc + (s.durationSeconds || 10), 0)}s</span>
                </div>

                {scenes.map((scene, idx) => (
                  <div
                    key={scene.id || idx}
                    className="rounded-lg border border-zinc-800 bg-black/80 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-950 font-mono text-xs text-emerald-400 border border-emerald-500/40">
                          {scene.sceneNumber}
                        </span>
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => {
                            const newScenes = [...scenes];
                            newScenes[idx].title = e.target.value;
                            setScenes(newScenes);
                          }}
                          className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs font-bold text-white focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-mono text-zinc-500">Duration (s):</label>
                        <input
                          type="number"
                          value={scene.durationSeconds}
                          onChange={(e) => {
                            const newScenes = [...scenes];
                            newScenes[idx].durationSeconds = parseInt(e.target.value, 10) || 10;
                            setScenes(newScenes);
                          }}
                          className="w-16 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-200"
                        />
                      </div>
                    </div>

                    {/* Narration Script */}
                    <div>
                      <label className="block text-xs font-mono text-zinc-400 mb-1">
                        Voice Narration Script ({language.toUpperCase()}):
                      </label>
                      <textarea
                        rows={2}
                        value={scene.narration}
                        onChange={(e) => {
                          const newScenes = [...scenes];
                          newScenes[idx].narration = e.target.value;
                          setScenes(newScenes);
                        }}
                        className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 font-sans text-xs text-zinc-200 focus:border-emerald-500"
                      />
                    </div>

                    {/* Visual & Terminal command */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <label className="block text-zinc-500 mb-1">Visual Directives:</label>
                        <input
                          type="text"
                          value={scene.visualDescription}
                          onChange={(e) => {
                            const newScenes = [...scenes];
                            newScenes[idx].visualDescription = e.target.value;
                            setScenes(newScenes);
                          }}
                          className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-zinc-300"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-500 mb-1">Terminal Command / Code:</label>
                        <input
                          type="text"
                          value={scene.codeOrCommand || ''}
                          onChange={(e) => {
                            const newScenes = [...scenes];
                            newScenes[idx].codeOrCommand = e.target.value;
                            setScenes(newScenes);
                          }}
                          className="w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Start Rendering Action */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="rounded border border-zinc-800 px-4 py-2.5 font-mono text-xs text-zinc-400 hover:text-white"
                >
                  Back to Config
                </button>

                <button
                  onClick={handleStartRender}
                  className="flex items-center gap-2 rounded bg-emerald-500 px-6 py-2.5 font-mono text-xs font-bold text-black shadow-[0_0_20px_rgba(0,255,102,0.3)] hover:bg-emerald-400 transition-all"
                >
                  <Video className="h-4 w-4" />
                  <span>Render Full Video via FFmpeg</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE RENDERING STATUS & CYBER VIDEO PLAYER */}
          {currentStep === 3 && activeProject && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h2 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    {activeProject.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                    <span>Language: {activeProject.language.toUpperCase()}</span>
                    <span>·</span>
                    <span>Duration: {activeProject.durationSeconds}s</span>
                    <span>·</span>
                    <span>Aspect: {activeProject.aspectRatio}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded ${
                      activeProject.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : activeProject.status === 'failed'
                        ? 'bg-red-950 text-red-400 border border-red-500/40'
                        : 'bg-zinc-900 text-yellow-400 border border-yellow-500/40 animate-pulse'
                    }`}
                  >
                    {activeProject.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Progress Bar (when rendering) */}
              {activeProject.status !== 'completed' && activeProject.status !== 'failed' && (
                <div className="rounded-lg border border-emerald-950 bg-black/60 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {activeProject.statusMessage || 'Rendering educational video assets...'}
                    </span>
                    <span className="text-zinc-400 font-bold">{activeProject.progress}%</span>
                  </div>

                  {/* Real progress track */}
                  <div className="h-2 w-full rounded bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#00ff66]"
                      style={{ width: `${Math.max(5, activeProject.progress)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 text-[10px] font-mono text-zinc-500 text-center">
                    <div className={activeProject.progress >= 20 ? 'text-emerald-400' : ''}>1. Script</div>
                    <div className={activeProject.progress >= 45 ? 'text-emerald-400' : ''}>2. Graphics</div>
                    <div className={activeProject.progress >= 65 ? 'text-emerald-400' : ''}>3. AI Voice</div>
                    <div className={activeProject.progress >= 85 ? 'text-emerald-400' : ''}>4. FFmpeg</div>
                  </div>
                </div>
              )}

              {/* Render Error */}
              {activeProject.status === 'failed' && (
                <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4 text-xs font-mono text-red-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Video Synthesis Failed</span>
                  </div>
                  <p>{activeProject.errorMessage || 'An error occurred during FFmpeg encoding.'}</p>
                  <button
                    onClick={() => handleRerender(activeProject.id)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded border border-red-500/50 bg-red-950 px-3 py-1 text-xs text-red-300 hover:bg-red-900"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Retry Generation</span>
                  </button>
                </div>
              )}

              {/* Video Player Display (when completed) */}
              {activeProject.status === 'completed' && activeProject.videoUrl && (
                <div className="space-y-4">
                  <div className="relative rounded-lg border border-emerald-500/40 bg-black overflow-hidden shadow-[0_0_30px_rgba(0,255,102,0.15)]">
                    <video
                      ref={videoRef}
                      src={activeProject.videoUrl}
                      controls
                      poster={activeProject.thumbnailUrl}
                      className="w-full max-h-[460px] object-contain bg-black"
                    />
                  </div>

                  {/* Video Actions & Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/80 pt-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/api/video/projects/${activeProject.id}/download`}
                        download
                        className="flex items-center gap-2 rounded bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black shadow-[0_0_15px_rgba(0,255,102,0.3)] hover:bg-emerald-400 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download MP4</span>
                      </a>

                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900 px-3.5 py-2 font-mono text-xs text-zinc-300 hover:border-emerald-500/50 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{copiedLink ? 'Link Copied!' : 'Share Video'}</span>
                      </button>

                      <button
                        onClick={() => handleRerender(activeProject.id)}
                        className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-400 hover:text-zinc-200"
                        title="Re-render video"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Re-render</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-mono text-emerald-400 hover:underline"
                    >
                      + Create New Video
                    </button>
                  </div>

                  {/* Subtitles Preview Drawer */}
                  {activeProject.subtitleSrt && (
                    <div className="rounded border border-zinc-800/80 bg-zinc-950 p-3 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-400 mb-2">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Subtitles className="h-3.5 w-3.5" />
                          <span>Generated Subtitle Telemetry (.SRT)</span>
                        </span>
                        <span>{activeProject.storyboard.length} Scenes Indexed</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto whitespace-pre-wrap text-[11px] text-zinc-400 bg-black/60 p-2 rounded">
                        {activeProject.subtitleSrt}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: User's Private Video Library */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span>My Private Video Library</span>
              </h3>
              <span className="text-[11px] font-mono text-zinc-500">
                {userProjects.length} {userProjects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>

            {loadingProjects ? (
              <div className="flex items-center justify-center py-8 text-xs font-mono text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400 mr-2" />
                <span>Loading studio repository...</span>
              </div>
            ) : userProjects.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-zinc-500 space-y-2">
                <Video className="h-6 w-6 mx-auto text-zinc-700" />
                <p>No video projects created yet.</p>
                <p className="text-[11px] text-zinc-600">Enter a prompt on the left to synthesize your first animated cybersecurity video.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {userProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className={`rounded border p-3 transition-colors ${
                      activeProjectId === proj.id
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : 'border-zinc-800/80 bg-black/60 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white truncate font-sans">
                          {proj.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                          <span>{proj.language.toUpperCase()}</span>
                          <span>·</span>
                          <span>{proj.durationSeconds}s</span>
                          <span>·</span>
                          <span
                            className={
                              proj.status === 'completed'
                                ? 'text-emerald-400'
                                : proj.status === 'failed'
                                ? 'text-red-400'
                                : 'text-yellow-400'
                            }
                          >
                            {proj.status}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                        title="Delete project"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs font-mono">
                      <button
                        onClick={() => {
                          setActiveProjectId(proj.id);
                          setActiveProject(proj);
                          setCurrentStep(3);
                        }}
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Open Studio</span>
                      </button>

                      {proj.status === 'completed' && (
                        <a
                          href={`/api/video/projects/${proj.id}/download`}
                          download
                          className="text-zinc-400 hover:text-white flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>MP4</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
