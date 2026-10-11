import React from 'react';
import {
  Terminal,
  Video,
  ShieldCheck,
  Cpu,
  BookOpen,
  ArrowRight,
  Code2,
  Lock,
  Zap,
  Globe2,
  FileCode,
  Radio,
} from 'lucide-react';
import { MatrixRain } from '../components/MatrixRain';
import { Article, DocumentItem } from '../types';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  articles: Article[];
  documents: DocumentItem[];
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, articles, documents }) => {
  return (
    <div className="relative min-h-screen bg-black text-zinc-100 overflow-hidden">
      {/* Matrix Canvas Hero Background */}
      <div className="relative h-[580px] sm:h-[620px] w-full border-b border-emerald-950/80 overflow-hidden bg-black flex items-center">
        <MatrixRain opacity={0.4} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-950/40 px-3 py-1 font-mono text-xs text-emerald-300 shadow-[0_0_15px_rgba(0,255,102,0.15)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>CYBER DEFENSE INTELLIGENCE & VIDEO SYNTHESIS</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                Master Cybersecurity. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-teal-200">
                  Generate Animated Cyber Videos
                </span>{' '}
                with AI Narration.
              </h1>

              <p className="max-w-2xl text-base text-zinc-300 leading-relaxed font-sans">
                RVCYBER AGENT is a full-stack cybersecurity learning hub. Consult our bilingual AI security agent in English and Telugu (తెలుగు), transform text prompts into narrated educational MP4 videos, practice in safe defensive sandboxes, and publish research.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('studio')}
                  className="flex items-center gap-2 rounded bg-emerald-500 px-5 py-3 font-mono text-sm font-bold text-black shadow-[0_0_20px_rgba(0,255,102,0.35)] hover:bg-emerald-400 transition-all active:scale-95"
                >
                  <Video className="h-4 w-4" />
                  <span>Launch AI Video Studio</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onNavigate('agent')}
                  className="flex items-center gap-2 rounded border border-emerald-500/60 bg-emerald-950/40 px-5 py-3 font-mono text-sm font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all active:scale-95"
                >
                  <Terminal className="h-4 w-4" />
                  <span>Ask Cyber Agent</span>
                </button>
              </div>

              {/* Unboxed Metadata Strip */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-3">
                <span className="text-emerald-400">English & Telugu Support</span>
                <span aria-hidden="true">·</span>
                <span>FFmpeg Server-side Rendering</span>
                <span aria-hidden="true">·</span>
                <span>OWASP Aligned</span>
              </div>
            </div>

            {/* Right Column: Hero Graphic Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-lg border border-emerald-500/40 bg-zinc-950 p-2 shadow-[0_0_30px_rgba(0,255,102,0.15)] group overflow-hidden">
                <div className="overflow-hidden rounded">
                  <img
                    src="/src/assets/images/hero_cyber_agent_1791700429325.jpg"
                    alt="Cybersecurity workstation holographic interface"
                    referrerPolicy="no-referrer"
                    className="w-full h-[280px] sm:h-[320px] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded border border-emerald-500/50 bg-black/85 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                      TERMINAL TELEMETRY
                    </span>
                    <span>ONLINE</span>
                  </div>
                  <div className="font-mono text-xs text-zinc-300 truncate">
                    &gt; AI Model: gemini-3.8-flash · Audio: gemini-3.8-flash-lite-tts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Capabilities Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 font-mono">
            OPERATIONAL CAPABILITIES
          </h2>
          <p className="text-sm text-zinc-400">
            Engineered for security researchers, students, and defense engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Cyber Agent */}
          <div
            onClick={() => onNavigate('agent')}
            className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-emerald-500/60 hover:bg-zinc-900/60 hover:shadow-[0_0_20px_rgba(0,255,102,0.1)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-400">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Bilingual AI Security Agent
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Real-time conversational cybersecurity guidance in English and Telugu (తెలుగు). Get study checklists, quiz generations, safe lab procedures, and concept breakdowns.
            </p>
            <div className="flex items-center text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Open Agent Console</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>

          {/* Card 2: AI Video Studio */}
          <div
            onClick={() => onNavigate('studio')}
            className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-emerald-500/60 hover:bg-zinc-900/60 hover:shadow-[0_0_20px_rgba(0,255,102,0.1)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-400">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              AI Animated Video Studio
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Transform any prompt into a narrated educational cybersecurity video. Automatic storyboard generation, editable scenes, AI voice narration, and real FFmpeg MP4 rendering.
            </p>
            <div className="flex items-center text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Generate Video Now</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>

          {/* Card 3: Hands-on Labs & Practice */}
          <div
            onClick={() => onNavigate('labs')}
            className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 transition-all hover:border-emerald-500/60 hover:bg-zinc-900/60 hover:shadow-[0_0_20px_rgba(0,255,102,0.1)]"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-emerald-500/40 bg-emerald-950/30 text-emerald-400">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Safe Defense Sandboxes
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Interactive terminal simulators for SQL injection prevention, XSS filter sanitization, JWT token inspection, and Linux authorization log forensics.
            </p>
            <div className="flex items-center text-xs font-mono text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Access Practice Labs</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Showcase Strip with Visual Assets */}
      <div className="border-y border-emerald-950/60 bg-zinc-950/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block font-mono text-xs uppercase tracking-wider text-emerald-400 mb-2">
                Server-Side Video Pipeline
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Real Rendering, Script Review, and MP4 Downloads
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                Unlike mock generators, RVCYBER AGENT implements a server-authoritative rendering queue. Review your storyboard scenes before rendering, customize voices (Kore, Puck, Fenrir, Zephyr), review bilingual Telugu/English scripts, and receive real MP4 video downloads with synchronized audio and subtitles.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-300 mb-6">
                <div className="rounded border border-zinc-800 bg-black/60 p-3">
                  <div className="text-emerald-400 font-bold mb-1">STORYBOARD REVIEW</div>
                  <p className="text-zinc-400">Edit narration, duration, and terminal code per scene before final render.</p>
                </div>
                <div className="rounded border border-zinc-800 bg-black/60 p-3">
                  <div className="text-emerald-400 font-bold mb-1">BILINGUAL TTS</div>
                  <p className="text-zinc-400">Gemini TTS audio generation with crisp Telugu & English narration.</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('studio')}
                className="inline-flex items-center gap-2 rounded border border-emerald-500 bg-emerald-950/60 px-4 py-2 font-mono text-xs font-semibold text-emerald-300 hover:bg-emerald-900 transition-colors"
              >
                <span>Try Video Generator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <div className="overflow-hidden rounded-lg border border-emerald-500/40 shadow-[0_0_25px_rgba(0,255,102,0.15)]">
                <img
                  src="/src/assets/images/video_studio_cyber_1791700441161.jpg"
                  alt="AI video studio synthesis timeline"
                  referrerPolicy="no-referrer"
                  className="w-full h-[320px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Intelligence & Community Articles */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold font-mono text-white">LATEST SECURITY INTELLIGENCE</h2>
            <p className="text-xs text-zinc-400">Research articles authored by the community and defense analysts.</p>
          </div>
          <button
            onClick={() => onNavigate('articles')}
            className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All Articles</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.slice(0, 2).map((article) => (
            <div
              key={article.id}
              onClick={() => onNavigate('articles')}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 hover:border-emerald-500/60 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-2">
                <span className="text-emerald-400">{article.category}</span>
                <span aria-hidden="true">·</span>
                <span>{article.authorName}</span>
                <span aria-hidden="true">·</span>
                <span>{article.viewsCount} views</span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 hover:text-emerald-300 transition-colors">
                {article.title}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                {article.summary}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                {article.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
