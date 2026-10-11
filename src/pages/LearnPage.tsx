import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  HelpCircle,
  Code2,
  ChevronRight,
  Shield,
  Lock,
  Terminal,
  Layers,
  Award,
  ArrowRight,
} from 'lucide-react';

interface ModuleLesson {
  id: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  summary: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
}

export const LearnPage: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [activeLesson, setActiveLesson] = useState<ModuleLesson | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const lessons: ModuleLesson[] = [
    {
      id: 'mod-1',
      title: 'Networking & TCP/IP Handshake Fundamentals',
      level: 'Beginner',
      duration: '15 min read',
      summary: 'SYN, SYN-ACK, ACK handshake sequence, port numbers (80, 443, 22, 53), and packet header analysis.',
      content: `## The 3-Way Handshake
Every standard TCP connection begins with a three-step sequence between the client and server:
1. **SYN (Synchronize):** The client sends a packet with an initial sequence number (ISN).
2. **SYN-ACK (Synchronize-Acknowledge):** The server replies with ACK = client_ISN + 1, plus its own server ISN.
3. **ACK (Acknowledge):** The client confirms with ACK = server_ISN + 1.

### Why Security Analysts Care
In a **SYN Flood Attack** (DoS), an attacker sends thousands of SYN packets from spoofed IPs without completing the final ACK. This consumes server connection state tables. Defenders implement **SYN Cookies** to mitigate this.`,
      quiz: {
        question: 'What is the server response in the second step of a standard TCP three-way handshake?',
        options: ['FIN-ACK', 'SYN-ACK', 'RST-ACK', 'SYN only'],
        correctAnswer: 1,
        explanation: 'The server responds to the initial SYN with a SYN-ACK packet, acknowledging the client and proposing its own sequence number.',
      },
    },
    {
      id: 'mod-2',
      title: 'Linux Permissions & Least Privilege Security',
      level: 'Beginner',
      duration: '20 min read',
      summary: 'UIDs, GIDs, chmod octal notation, sticky bits, and preventing SUID binary privilege escalation.',
      content: `## Linux File Permissions Mechanics
Every Linux inode stores permissions for User, Group, and Others (rwx):
- **Read (r = 4)**
- **Write (w = 2)**
- **Execute (x = 1)**

### SUID / SGID Security Risks
When a file has the SUID bit set (\`chmod u+s /path/binary\`), it executes with the privileges of the file owner (often root) rather than the executing user. Attackers look for misconfigured SUID binaries like \`find\`, \`vim\`, or custom scripts to escalate privileges.`,
      quiz: {
        question: 'Which octal permission represents read and write for owner, and read-only for group and others?',
        options: ['755', '644', '600', '777'],
        correctAnswer: 1,
        explanation: 'Owner: 4+2=6 (rw). Group: 4 (r). Others: 4 (r). Hence 644.',
      },
    },
    {
      id: 'mod-3',
      title: 'OWASP Top 10: Broken Access Control & IDOR',
      level: 'Intermediate',
      duration: '25 min read',
      summary: 'Insecure Direct Object References (IDOR), horizontal privilege escalation, and session permission gating.',
      content: `## What is Broken Access Control?
Broken Access Control moved to the #1 spot in the OWASP Top 10. It occurs when applications fail to verify whether an authenticated user is actually authorized to view or mutate a requested resource ID.

\`\`\`http
GET /api/documents/1042 HTTP/1.1
Host: secure-app.local
Authorization: Bearer <User_A_Token>
\`\`\`

If User A can view User B's private tax document by simply changing \`1042\` to \`1043\`, that is an IDOR vulnerability.

### Remediation
Always enforce tenant/ownership checks in the database query:
\`\`\`typescript
const doc = await db.documents.findFirst({
  where: { id: requestedId, userId: currentUser.id }
});
if (!doc) throw new ForbiddenError();
\`\`\``,
      quiz: {
        question: 'How do backend engineers systematically prevent IDOR vulnerabilities?',
        options: [
          'By obfuscating URLs with Base64 encoding',
          'By validating that the requesting session user ID owns or has explicit permission for the requested entity on every request',
          'By turning off HTTP Keep-Alive',
          'By using GET instead of POST requests',
        ],
        correctAnswer: 1,
        explanation: 'Obfuscation is not security. The database query or service layer must strictly enforce that the authenticated user owns or is authorized for the entity ID.',
      },
    },
    {
      id: 'mod-4',
      title: 'SQL Injection Prevention & Prepared Statements',
      level: 'Intermediate',
      duration: '30 min read',
      summary: 'Classic union-based, blind time-based SQLi, and parameterized database bindings.',
      content: `## Defense-in-Depth for Database Interfaces
Parameterized queries ensure that user input is transmitted to the database engine separately from the SQL statement structure. The database compiles the statement first, ensuring no input characters can ever be parsed as query operators or delimiters.`,
      quiz: {
        question: 'Why are parameterized statements immune to classic SQL injection?',
        options: [
          'They automatically escape quotes in memory',
          'The SQL query plan is precompiled, and parameters are handled strictly as literal data rather than executable syntax',
          'They encrypt the database tables',
          'They only work with PostgreSQL',
        ],
        correctAnswer: 1,
        explanation: 'Parameters are treated strictly as data constants and never passed through the SQL parser.',
      },
    },
    {
      id: 'mod-5',
      title: 'SOC Incident Response & Memory Forensics',
      level: 'Advanced',
      duration: '40 min read',
      summary: 'Volatile memory acquisition, Volatility 3 framework, malfind plugin, and process injection triage.',
      content: `## Investigating In-Memory Code Injection
Sophisticated threats execute reflective DLL injection or Process Hollowing to run malicious shellcode inside legitimate processes like \`svchost.exe\` or \`explorer.exe\`.

### Volatility 3 Investigation Checklist:
1. \`windows.pslist\`: Compare with \`windows.psscan\` to detect unlinked hidden processes.
2. \`windows.malfind\`: Locate memory regions with PAGE_EXECUTE_READWRITE protection and MZ headers.
3. \`windows.netscan\`: Correlate open sockets with the anomalous PID.`,
      quiz: {
        question: 'Which memory protection flag is a primary red flag for injected shellcode in process memory?',
        options: ['PAGE_READONLY', 'PAGE_NOACCESS', 'PAGE_EXECUTE_READWRITE', 'PAGE_GUARD'],
        correctAnswer: 2,
        explanation: 'PAGE_EXECUTE_READWRITE allows code to be both written and executed simultaneously in memory, a classic indicator of staged shellcode.',
      },
    },
  ];

  const filteredLessons = lessons.filter(
    (l) => selectedTier === 'All' || l.level === selectedTier
  );

  const handleOpenLesson = (lesson: ModuleLesson) => {
    setActiveLesson(lesson);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !activeLesson) return;
    setQuizSubmitted(true);
    if (selectedAnswer === activeLesson.quiz.correctAnswer) {
      if (!completedLessons.includes(activeLesson.id)) {
        setCompletedLessons([...completedLessons, activeLesson.id]);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-emerald-950/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
            CYBERSECURITY CURRICULUM
          </h1>
        </div>
        <p className="text-xs text-zinc-400 font-sans">
          Structured defense modules from networking foundations to advanced SOC forensics with interactive knowledge checks.
        </p>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mt-6">
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                selectedTier === tier
                  ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                  : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Lesson Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredLessons.map((lesson) => {
          const isDone = completedLessons.includes(lesson.id);
          return (
            <div
              key={lesson.id}
              onClick={() => handleOpenLesson(lesson)}
              className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/70 p-5 hover:border-emerald-500/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span
                    className={
                      lesson.level === 'Beginner'
                        ? 'text-teal-400'
                        : lesson.level === 'Intermediate'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }
                  >
                    {lesson.level}
                  </span>
                  <span className="text-zinc-500">{lesson.duration}</span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 hover:text-emerald-300 transition-colors">
                  {lesson.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {lesson.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-xs font-mono">
                {isDone ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <span className="text-zinc-500">Not completed</span>
                )}

                <span className="text-emerald-400 hover:underline flex items-center gap-1">
                  <span>Start Module</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Lesson Modal Drawer */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(0,255,102,0.15)]">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4 mb-4">
              <div>
                <span className="font-mono text-xs text-emerald-400">
                  [{activeLesson.level.toUpperCase()} MODULE]
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{activeLesson.title}</h2>
              </div>
              <button
                onClick={() => setActiveLesson(null)}
                className="rounded border border-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            {/* Lesson Body */}
            <div className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed space-y-4 mb-8">
              <div className="whitespace-pre-wrap">{activeLesson.content}</div>
            </div>

            {/* Module Knowledge Check Quiz */}
            <div className="rounded-lg border border-zinc-800 bg-black/70 p-5 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-400">
                <HelpCircle className="h-4 w-4" />
                <span>Knowledge Verification Challenge</span>
              </div>

              <p className="text-sm font-semibold text-white">
                {activeLesson.quiz.question}
              </p>

              <div className="space-y-2">
                {activeLesson.quiz.options.map((opt, idx) => (
                  <button
                    key={idx}
                    disabled={quizSubmitted}
                    onClick={() => setSelectedAnswer(idx)}
                    className={`flex w-full items-center gap-3 rounded border p-3 text-left font-mono text-xs transition-colors ${
                      selectedAnswer === idx
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-400">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={selectedAnswer === null}
                  className="rounded bg-emerald-500 px-4 py-2 font-mono text-xs font-bold text-black disabled:opacity-50 hover:bg-emerald-400 transition-colors"
                >
                  Verify Answer
                </button>
              ) : (
                <div
                  className={`rounded border p-4 text-xs font-mono space-y-2 ${
                    selectedAnswer === activeLesson.quiz.correctAnswer
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                      : 'border-red-500/50 bg-red-950/20 text-red-300'
                  }`}
                >
                  <div className="font-bold">
                    {selectedAnswer === activeLesson.quiz.correctAnswer
                      ? '✓ CORRECT! Verification Passed.'
                      : '✗ INCORRECT.'}
                  </div>
                  <p className="text-zinc-300">{activeLesson.quiz.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
