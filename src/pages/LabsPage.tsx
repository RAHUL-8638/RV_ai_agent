import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const LabsPage: React.FC = () => {
  const [activeLab, setActiveLab] = useState<'sqli' | 'xss' | 'jwt' | 'logs'>('sqli');

  // SQLi Lab State
  const [sqliInput, setSqliInput] = useState("' OR '1'='1");
  const [isSecureMode, setIsSecureMode] = useState(false);
  const [sqliResult, setSqliResult] = useState<{
    query: string;
    status: 'vulnerable' | 'secure';
    rowsReturned: number;
    explanation: string;
  } | null>(null);

  // XSS Lab State
  const [xssInput, setXssInput] = useState('<script>alert("XSS")</script>');
  const [xssSanitized, setXssSanitized] = useState(false);

  // JWT Lab State
  const [jwtSecret, setJwtSecret] = useState('weaksecret123');
  const [jwtTamperedRole, setJwtTamperedRole] = useState<'USER' | 'ADMIN'>('USER');

  // Linux Log Lab State
  const [logFilter, setLogFilter] = useState('Failed password');

  // Handle SQLi Execution Simulation
  const handleRunSqli = () => {
    if (isSecureMode) {
      setSqliResult({
        query: `SELECT * FROM users WHERE username = $1; -- [PARAM: "${sqliInput}"]`,
        status: 'secure',
        rowsReturned: 0,
        explanation: 'PREPARED STATEMENT ACTIVE: The database engine compiled the query plan beforehand. The input is treated strictly as literal string data matching no user, preventing injection.',
      });
    } else {
      const isBreached = sqliInput.includes("' OR '1'='1") || sqliInput.includes("admin'--");
      setSqliResult({
        query: `SELECT * FROM users WHERE username = '${sqliInput}';`,
        status: isBreached ? 'vulnerable' : 'secure',
        rowsReturned: isBreached ? 42 : 0,
        explanation: isBreached
          ? 'EXPLOIT SUCCESSFUL: The single quote escaped the string literal boundary, injecting boolean logic OR 1=1 which always evaluates to TRUE. Entire table leaked!'
          : 'Query executed dynamically without match.',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 border-b border-emerald-950/80 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-400">
            <Code2 className="h-4 w-4" />
          </div>
          <h1 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white">
            HANDS-ON DEFENSIVE SANDBOXES
          </h1>
        </div>
        <p className="text-xs text-zinc-400 font-sans">
          Authorized, simulated interactive laboratories demonstrating attack mechanics alongside defensive mitigations.
        </p>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            onClick={() => setActiveLab('sqli')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeLab === 'sqli'
                ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. SQLi & Parameterization
          </button>
          <button
            onClick={() => setActiveLab('xss')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeLab === 'xss'
                ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. XSS & HTML Entity Encoding
          </button>
          <button
            onClick={() => setActiveLab('jwt')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeLab === 'jwt'
                ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. JWT Cryptographic Verification
          </button>
          <button
            onClick={() => setActiveLab('logs')}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              activeLab === 'logs'
                ? 'border border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            4. Linux Incident Log Triage
          </button>
        </div>
      </div>

      {/* LAB 1: SQL INJECTION & PARAMETERIZATION */}
      {activeLab === 'sqli' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="font-mono text-xs font-bold text-emerald-400">INPUT INJECTION VECTOR</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">Mode:</span>
                  <button
                    onClick={() => setIsSecureMode(!isSecureMode)}
                    className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                      isSecureMode
                        ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                        : 'border-red-900 bg-red-950/40 text-red-300'
                    }`}
                  >
                    {isSecureMode ? '✓ Parameterized Query' : '⚠ Dynamic String Concat'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  Test Username Payload:
                </label>
                <input
                  type="text"
                  value={sqliInput}
                  onChange={(e) => setSqliInput(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-black px-3.5 py-2 font-mono text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <span>Presets:</span>
                <button
                  onClick={() => setSqliInput("' OR '1'='1")}
                  className="rounded border border-zinc-800 px-2 py-1 text-zinc-300 hover:border-emerald-500"
                >
                  ' OR '1'='1
                </button>
                <button
                  onClick={() => setSqliInput("admin'--")}
                  className="rounded border border-zinc-800 px-2 py-1 text-zinc-300 hover:border-emerald-500"
                >
                  admin'--
                </button>
                <button
                  onClick={() => setSqliInput("alice")}
                  className="rounded border border-zinc-800 px-2 py-1 text-zinc-300 hover:border-emerald-500"
                >
                  alice (Benign)
                </button>
              </div>

              <button
                onClick={handleRunSqli}
                className="flex items-center justify-center gap-2 w-full rounded bg-emerald-500 py-2.5 font-mono text-xs font-bold text-black hover:bg-emerald-400 transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>Execute Simulation Against Mock DB</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-black p-6 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 text-zinc-400">
                <span>DATABASE ENGINE CONSOLE</span>
                <span>STATE: {sqliResult ? sqliResult.status.toUpperCase() : 'IDLE'}</span>
              </div>

              {sqliResult ? (
                <div className="space-y-4">
                  <div>
                    <span className="text-zinc-500">Executed SQL:</span>
                    <pre className="mt-1 rounded bg-zinc-950 p-3 text-emerald-300 whitespace-pre-wrap border border-zinc-900">
                      {sqliResult.query}
                    </pre>
                  </div>

                  <div
                    className={`rounded border p-3 ${
                      sqliResult.status === 'vulnerable'
                        ? 'border-red-500/50 bg-red-950/20 text-red-300'
                        : 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                    }`}
                  >
                    <div className="font-bold mb-1">
                      {sqliResult.status === 'vulnerable' ? 'VULNERABILITY CONFIRMED' : 'SECURE EXECUTION'}
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300">{sqliResult.explanation}</p>
                    <div className="mt-2 text-zinc-400">Rows Exposed: {sqliResult.rowsReturned}</div>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-600 py-8 text-center">
                  Press Execute above to inspect dynamic vs parameterized query handling.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LAB 2: XSS & SANITIZATION */}
      {activeLab === 'xss' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="font-mono text-sm font-bold text-white">CROSS-SITE SCRIPTING (XSS) DEFENSE</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Observe how unencoded characters allow browser JavaScript injection, while contextual entity encoding quashes malicious payloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5">Untrusted User Input:</label>
              <textarea
                rows={3}
                value={xssInput}
                onChange={(e) => setXssInput(e.target.value)}
                className="w-full rounded border border-zinc-800 bg-black p-3 font-mono text-xs text-white focus:border-emerald-500"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => setXssSanitized(!xssSanitized)}
                  className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                    xssSanitized
                      ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                      : 'border-red-900 bg-red-950/40 text-red-300'
                  }`}
                >
                  {xssSanitized ? '✓ Sanitization Enabled' : '⚠ Raw HTML (Dangerous)'}
                </button>
              </div>
            </div>

            <div className="rounded border border-zinc-800 bg-black p-4 font-mono text-xs">
              <div className="text-zinc-500 mb-2">Simulated DOM Render Output:</div>
              {xssSanitized ? (
                <div className="rounded bg-emerald-950/20 border border-emerald-900/60 p-3 text-emerald-300 space-y-2">
                  <div className="font-bold">Encoded Entities:</div>
                  <pre className="text-zinc-300 whitespace-pre-wrap">
                    {xssInput.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m))}
                  </pre>
                  <div className="text-[11px] text-emerald-400">
                    Browser interprets &lt;script&gt; strictly as text, executing 0 scripts.
                  </div>
                </div>
              ) : (
                <div className="rounded bg-red-950/20 border border-red-900/60 p-3 text-red-300 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Raw Injection Detected</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    If this were rendered in an actual DOM with innerHTML, arbitrary script execution would trigger session token exfiltration.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LAB 3: JWT VERIFICATION */}
      {activeLab === 'jwt' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="font-mono text-sm font-bold text-white">JWT CRYPTOGRAPHIC SIGNATURE INSPECTOR</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Understanding why tampering with a token payload fails without the private server HMAC secret key.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="rounded border border-red-900/50 bg-black/60 p-4">
              <div className="text-red-400 font-bold mb-2">Header (Base64Url):</div>
              <pre className="text-zinc-300 text-[11px]">
{JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)}
              </pre>
            </div>

            <div className="rounded border border-purple-900/50 bg-black/60 p-4">
              <div className="text-purple-400 font-bold mb-2">Payload (Claims):</div>
              <pre className="text-zinc-300 text-[11px]">
{JSON.stringify({ sub: "user-921", role: jwtTamperedRole, iat: 1774000000 }, null, 2)}
              </pre>
              <div className="mt-3">
                <label className="text-zinc-500 text-[10px]">Tamper Role Claim:</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setJwtTamperedRole('USER')}
                    className={`px-2 py-1 rounded text-[10px] ${jwtTamperedRole === 'USER' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                  >
                    USER
                  </button>
                  <button
                    onClick={() => setJwtTamperedRole('ADMIN')}
                    className={`px-2 py-1 rounded text-[10px] ${jwtTamperedRole === 'ADMIN' ? 'bg-purple-900 text-white' : 'text-zinc-500'}`}
                  >
                    ADMIN (Tampered)
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded border border-emerald-900/50 bg-black/60 p-4">
              <div className="text-emerald-400 font-bold mb-2">HMAC-SHA256 Signature:</div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
              </p>
              <div className={jwtTamperedRole === 'ADMIN' ? 'text-red-400 text-[11px]' : 'text-emerald-400 text-[11px]'}>
                {jwtTamperedRole === 'ADMIN' ? '❌ SIGNATURE INVALID: Token rejected by server' : '✓ SIGNATURE VALID'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAB 4: LINUX LOG TRIAGE */}
      {activeLab === 'logs' && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm font-bold text-white">/var/log/auth.log INCIDENT TRIAGE</h3>
              <p className="text-xs text-zinc-400 mt-1">Filter authentication telemetry to identify SSH brute force IP sources.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Filter:</span>
              <input
                type="text"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="grep term..."
                className="rounded border border-zinc-800 bg-black px-2 py-1 font-mono text-xs text-emerald-400"
              />
            </div>
          </div>

          <div className="rounded border border-zinc-800 bg-black p-4 font-mono text-[11px] h-64 overflow-y-auto space-y-1">
            {[
              "Oct 10 23:10:01 server sshd[4201]: Failed password for invalid user root from 198.51.100.42 port 54102 ssh2",
              "Oct 10 23:10:03 server sshd[4202]: Failed password for invalid user admin from 198.51.100.42 port 54104 ssh2",
              "Oct 10 23:10:05 server sshd[4203]: Failed password for invalid user test from 198.51.100.42 port 54108 ssh2",
              "Oct 10 23:10:12 server sshd[4210]: Accepted publickey for analyst from 10.0.4.12 port 49210 ssh2: RSA SHA256:abcd...",
              "Oct 10 23:10:15 server sudo: analyst : TTY=pts/0 ; PWD=/home/analyst ; USER=root ; COMMAND=/usr/bin/cat /var/log/auth.log",
              "Oct 10 23:11:00 server sshd[4250]: Failed password for invalid user oracle from 198.51.100.42 port 54120 ssh2",
            ]
              .filter((line) => line.toLowerCase().includes(logFilter.toLowerCase()))
              .map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes("Failed")
                      ? "text-red-400"
                      : line.includes("Accepted")
                      ? "text-emerald-400"
                      : "text-zinc-400"
                  }
                >
                  {line}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
