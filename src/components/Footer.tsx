import React from 'react';
import { Terminal, Shield, Lock, FileCode } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-emerald-950/80 bg-black text-zinc-400 py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span className="font-mono text-base font-bold text-white tracking-wider">
                RVCYBER <span className="text-emerald-400">AGENT</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              AI-driven cybersecurity intelligence, automated animated video creation, hands-on defensive labs, and community research platform.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-mono">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> Defensive Core
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> TLS 1.3
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('agent')} className="hover:text-emerald-300 transition-colors">
                  AI Cybersecurity Agent
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('studio')} className="hover:text-emerald-300 transition-colors">
                  AI Animated Video Studio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('learn')} className="hover:text-emerald-300 transition-colors">
                  Cybersecurity Curriculum
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('labs')} className="hover:text-emerald-300 transition-colors">
                  Hands-on Defense Labs
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Knowledge */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              Intelligence
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('articles')} className="hover:text-emerald-300 transition-colors">
                  Technical Articles & Writeups
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('books')} className="hover:text-emerald-300 transition-colors">
                  PDF Guides & Reference Books
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('roadmaps')} className="hover:text-emerald-300 transition-colors">
                  Career Roadmaps & Certifications
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('community')} className="hover:text-emerald-300 transition-colors">
                  Researcher Forum
                </button>
              </li>
            </ul>
          </div>

          {/* Legal and Ethical Notice */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 mb-3">
              Rules of Engagement
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              All tools, agents, simulations, and generated video guides are provided strictly for educational purposes, defensive security research, and authorized laboratory practice. Unauthorized access to computer systems is illegal.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} RVCYBER AGENT. All rights reserved. Sole Owner Governed.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>ISO/IEC 27001 Aligned</span>
            <span>·</span>
            <span>OWASP Standardized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
