import React, { useState } from 'react';
import {
  Map,
  Shield,
  Terminal,
  Crosshair,
  Cloud,
  FileSearch,
  CheckCircle2,
  ChevronRight,
  Award,
} from 'lucide-react';

interface CareerRoadmap {
  id: string;
  role: string;
  shortDesc: string;
  salaryRange: string;
  phases: {
    phaseTitle: string;
    skills: string[];
    tools: string[];
    certs: string[];
  }[];
}

export const RoadmapsPage: React.FC = () => {
  const roadmaps: CareerRoadmap[] = [
    {
      id: 'pentester',
      role: 'Penetration Tester / Ethical Hacker',
      shortDesc: 'Authorized offensive security testing, vulnerability discovery, and exploit validation.',
      salaryRange: '$95k – $160k',
      phases: [
        {
          phaseTitle: 'Phase 1: Foundations',
          skills: ['TCP/IP & Subnetting', 'Linux Command Line', 'Python/Bash Scripting', 'HTTP Methods & Headers'],
          tools: ['Wireshark', 'nmap', 'Netcat', 'Linux CLI'],
          certs: ['CompTIA Network+', 'CompTIA Security+'],
        },
        {
          phaseTitle: 'Phase 2: Web & Network Assessment',
          skills: ['OWASP Top 10 Exploitation', 'Active Directory Basics', 'Vulnerability Scanning', 'Burp Suite Repeater/Intruder'],
          tools: ['Burp Suite Community', 'Nikto', 'Nessus', 'sqlmap (in labs)'],
          certs: ['eJPT (Junior Penetration Tester)', 'PNPT'],
        },
        {
          phaseTitle: 'Phase 3: Advanced Offensive Methodologies',
          skills: ['Privilege Escalation', 'Kerberoasting & AD Attacks', 'Buffer Overflows (Basic)', 'Report Writing & Executive Debriefs'],
          tools: ['Metasploit Framework', 'BloodHound', 'Impacket', 'Mimikatz'],
          certs: ['OSCP (OffSec Certified Professional)'],
        },
      ],
    },
    {
      id: 'soc',
      role: 'SOC Analyst / Threat Detection Engineer',
      shortDesc: 'Defending enterprise networks, monitoring SIEM telemetry, and triaging security alerts.',
      salaryRange: '$75k – $135k',
      phases: [
        {
          phaseTitle: 'Phase 1: Security Operations Basics',
          skills: ['Windows Event Logs', 'Sysmon Configuration', 'Network Packet Analysis', 'Cyber Kill Chain & MITRE ATT&CK'],
          tools: ['Wireshark', 'Event Viewer', 'Sysinternals', 'Snort'],
          certs: ['CompTIA Security+', 'CompTIA CySA+'],
        },
        {
          phaseTitle: 'Phase 2: SIEM & Log Aggregation',
          skills: ['KQL & SPL Query Writing', 'Alert Correlation', 'Phishing Header Analysis', 'EDR Agent Deployment'],
          tools: ['Splunk', 'Microsoft Sentinel', 'CrowdStrike Falcon', 'Elastic SIEM'],
          certs: ['Splunk Certified Core User', 'SC-200 (Microsoft Security Ops)'],
        },
        {
          phaseTitle: 'Phase 3: Threat Hunting & Containment',
          skills: ['Automated Playbook Creation (SOAR)', 'Memory Dump Analysis', 'YARA Rule Engineering', 'Root Cause Investigation'],
          tools: ['Volatility 3', 'Velociraptor', 'Cortex XSOAR', 'TheHive'],
          certs: ['BTL1 (Blue Team Level 1)', 'GCIH'],
        },
      ],
    },
    {
      id: 'appsec',
      role: 'Application Security (AppSec) Engineer',
      shortDesc: 'Embedding security into the SDLC, code review, SAST/DAST automation, and threat modeling.',
      salaryRange: '$110k – $180k',
      phases: [
        {
          phaseTitle: 'Phase 1: Software Engineering Core',
          skills: ['Web Architecture (React, Node, Go, Java)', 'Git & CI/CD Pipelines', 'SQL & NoSQL DB Security', 'REST & GraphQL APIs'],
          tools: ['GitHub Actions', 'Docker', 'Postman', 'SonarQube'],
          certs: ['CSSLP', 'AWS Certified Developer'],
        },
        {
          phaseTitle: 'Phase 2: Vulnerability Triage & Secure Design',
          skills: ['Threat Modeling (STRIDE)', 'Automated SAST/DAST Scans', 'Secrets Management', 'OWASP ASVS Compliance'],
          tools: ['Semgrep', 'Snyk', 'OWASP ZAP', 'HashiCorp Vault'],
          certs: ['Certified Secure Software Lifecycle Professional'],
        },
        {
          phaseTitle: 'Phase 3: Cloud & Container AppSec',
          skills: ['Kubernetes RBAC Hardening', 'Zero Trust Architecture', 'Bug Bounty Triaging', 'Cryptographic Key Lifecycle'],
          tools: ['Trivy', 'Falco', 'Cosign', 'Open Policy Agent'],
          certs: ['CKS (Certified Kubernetes Security Specialist)'],
        },
      ],
    },
  ];

  const [selectedRoadmap, setSelectedRoadmap] = useState<CareerRoadmap>(roadmaps[0]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 border-b border-emerald-950/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
            <Map className="h-4 w-4" />
          </div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
            CYBERSECURITY CAREER ROADMAPS
          </h1>
        </div>
        <p className="text-xs text-zinc-400 font-sans">
          Step-by-step technical progression paths, essential toolchains, and industry-standard certifications.
        </p>

        {/* Role Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {roadmaps.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRoadmap(r)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded transition-colors ${
                selectedRoadmap.id === r.id
                  ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                  : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r.role}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Roadmap Timeline */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 sm:p-8 space-y-8">
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1">
            <span>CAREER TRACK BLUEPRINT</span>
            <span>Est. Market Range: {selectedRoadmap.salaryRange}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{selectedRoadmap.role}</h2>
          <p className="text-sm text-zinc-400 mt-1">{selectedRoadmap.shortDesc}</p>
        </div>

        {/* Phases Timeline */}
        <div className="space-y-6">
          {selectedRoadmap.phases.map((phase, idx) => (
            <div
              key={idx}
              className="relative pl-8 border-l-2 border-emerald-500/40 pb-6 last:pb-0"
            >
              {/* Circle Marker */}
              <div className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-black" />

              <h3 className="font-mono text-base font-bold text-emerald-300 mb-3">
                {phase.phaseTitle}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                {/* Skills */}
                <div className="rounded border border-zinc-800 bg-black/60 p-4">
                  <div className="text-white font-bold mb-2">Core Skills:</div>
                  <ul className="space-y-1.5 text-zinc-400">
                    {phase.skills.map((s, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tools */}
                <div className="rounded border border-zinc-800 bg-black/60 p-4">
                  <div className="text-white font-bold mb-2">Key Tools:</div>
                  <ul className="space-y-1.5 text-zinc-400">
                    {phase.tools.map((t, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-teal-400" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Certifications */}
                <div className="rounded border border-zinc-800 bg-black/60 p-4">
                  <div className="text-white font-bold mb-2">Target Certifications:</div>
                  <ul className="space-y-1.5 text-zinc-400">
                    {phase.certs.map((c, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
