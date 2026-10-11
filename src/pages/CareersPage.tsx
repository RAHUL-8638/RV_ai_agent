import React, { useState } from 'react';
import {
  Award,
  Briefcase,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface CertInfo {
  name: string;
  vendor: string;
  level: string;
  domains: string[];
  tips: string;
}

interface InterviewQ {
  question: string;
  category: string;
  answer: string;
}

export const CareersPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const certs: CertInfo[] = [
    {
      name: 'CompTIA Security+ (SY0-701)',
      vendor: 'CompTIA',
      level: 'Entry-Level / Baseline',
      domains: ['General Security Concepts', 'Threats, Vulnerabilities & Mitigations', 'Security Architecture', 'Security Operations', 'Security Program Management & Oversight'],
      tips: 'Master port numbers, protocol abbreviations, cryptographic cipher suites, and scenario-based log interpretation questions.',
    },
    {
      name: 'OSCP (OffSec Certified Professional)',
      vendor: 'OffSec',
      level: 'Advanced Offensive Security',
      domains: ['Active Directory Attacks', 'Buffer Overflows (Fundamentals)', 'Linux & Windows Privilege Escalation', 'Client-side Attacks', 'Exploit Modification'],
      tips: 'Practice relentlessly on Proving Grounds and Hack The Box. Develop standardized note-taking templates for nmap enumeration and privilege escalation discovery scripts.',
    },
    {
      name: 'BTL1 (Blue Team Level 1)',
      vendor: 'Security Blue Team',
      level: 'Intermediate SOC / Defense',
      domains: ['Security Operations', 'Network Analysis (Wireshark)', 'Threat Intelligence', 'Digital Forensics (Autopsy)', 'Incident Response'],
      tips: 'Hands-on practical exam analyzing live PCAPs and incident logs. Focus on extracting suspicious hashes and IOCs.',
    },
    {
      name: 'CISSP',
      vendor: '(ISC)²',
      level: 'Senior / Management',
      domains: ['Security & Risk Management', 'Asset Security', 'Security Architecture & Engineering', 'Communication & Network Security', 'Identity & Access Management (IAM)'],
      tips: 'Adopt a managerial mindset: prioritize human life first, cost-benefit analysis, governance, and business continuity rather than tactical CLI commands.',
    },
  ];

  const interviewQuestions: InterviewQ[] = [
    {
      question: 'What is the exact technical difference between Vulnerability Scanning and Penetration Testing?',
      category: 'Methodology',
      answer: 'A vulnerability scan is an automated inspection that identifies potential weaknesses and missing patches against a known database (broad scope, high false-positive possibility). A penetration test is an authorized active human simulation that validates whether discovered vulnerabilities can be chained and exploited to achieve specific business impact goals.',
    },
    {
      question: 'How do you defend against Cross-Site Request Forgery (CSRF) in modern single-page applications?',
      category: 'Web AppSec',
      answer: 'By configuring cookies with SameSite=Strict or SameSite=Lax attributes, implementing cryptographic anti-CSRF challenge tokens (Synchronizer Token Pattern), and requiring custom HTTP headers (such as X-Requested-With or Authorization: Bearer tokens) which cross-origin simple forms cannot generate without CORS preflight clearance.',
    },
    {
      question: 'Explain what happens during a DNS tunneling attack and how security analysts detect it.',
      category: 'Network Security',
      answer: 'Attackers encode arbitrary payloads or stolen data within DNS query subdomains (e.g., base64data.attacker-domain.com). The recursive resolver forwards the query to the attacker authoritative nameserver. SOC analysts detect this by monitoring for high-entropy subdomains, unusually long query lengths (>65 bytes), high request frequency to new external domains, and anomalous TXT/NULL record response ratios.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-emerald-950/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
            <Award className="h-4 w-4" />
          </div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
            CAREERS & CERTIFICATIONS GUIDE
          </h1>
        </div>
        <p className="text-xs text-zinc-400 font-sans">
          Industry credential blueprints, practical exam study tactics, and high-yield technical interview preparation.
        </p>
      </div>

      {/* Certifications Grid */}
      <div className="mb-12">
        <h2 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
          Core Industry Certifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certs.map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 space-y-4 hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-zinc-500">{c.vendor} · {c.level}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{c.name}</h3>
                </div>
                <Award className="h-5 w-5 text-emerald-400 shrink-0" />
              </div>

              <div>
                <span className="text-xs font-mono text-zinc-400 font-bold">Key Domains Tested:</span>
                <ul className="mt-1 space-y-1 text-xs font-mono text-zinc-300">
                  {c.domains.map((d, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded border border-zinc-800/80 bg-black/60 p-3 text-xs font-mono text-zinc-300">
                <span className="text-emerald-400 font-bold">Preparation Strategy: </span>
                {c.tips}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Interview Prep */}
      <div>
        <h2 className="font-mono text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">
          Technical Interview Question Bank
        </h2>

        <div className="space-y-3">
          {interviewQuestions.map((q, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 uppercase">
                    [{q.category}]
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{q.question}</h3>
                </div>
                {openFaq === idx ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0 ml-2" />
                )}
              </button>

              {openFaq === idx && (
                <div className="mt-3 pt-3 border-t border-zinc-800/80 text-xs font-sans text-zinc-300 leading-relaxed bg-black/40 p-3 rounded">
                  <span className="font-mono font-bold text-emerald-400">Answer Model: </span>
                  {q.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
