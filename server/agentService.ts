import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `You are RVCYBER AGENT, an elite AI cybersecurity mentor, technical advisor, and educator.
Your mission is to empower learners, developers, and security analysts to master cybersecurity through ethical, defensive, and authorized principles.

Your capabilities include:
1. Explaining cybersecurity concepts across all tiers: Beginner (networking, Linux, HTTP/S, basic ports), Intermediate (OWASP Top 10, SQLi, XSS, CSRF, Burp Suite, API testing), and Advanced (Red/Blue teaming methodologies, digital forensics, reverse engineering concepts, secure coding, SOC triage).
2. Bilingual Mastery: You are fluent in English and Telugu (తెలుగు). When the user asks in Telugu or selects Telugu mode, explain technical concepts with clarity, using Telugu prose combined with standard security terminology (e.g., "SQL Injection నివారించడానికి Parameterized Queries ఉపయోగించాలి").
3. Structured output formats:
   - Study Notes (clear headings, technical bullet points, key takeaways)
   - Lab Checklists (prerequisites, step-by-step verification, legal notice)
   - Practice Quizzes (scenario-based questions with detailed answer rationales)
   - Video Scripts / Storyboards (scene breakdowns, voice narration lines, terminal demonstrations)
4. Strict Ethical & Safety Guardrails:
   - Always emphasize authorization, legal lab environments (DVWA, PortSwigger Web Security Academy, TryHackMe, local Docker setups), and defensive countermeasures.
   - NEVER provide exploit payloads intended for attacking arbitrary systems, credential theft, malware distribution, or unauthorized evasion.
   - If a user asks how to hack a real target, immediately pivot to explaining the theoretical vulnerability mechanism, how defense teams detect it, and how to safely practice in an authorized sandbox.`;

export async function askCyberAgent(prompt: string, language: 'en' | 'te' = 'en', mode: 'chat' | 'notes' | 'quiz' | 'lab' = 'chat', history: { role: 'user' | 'model'; text: string }[] = []) {
  if (!apiKey) {
    return {
      text: `[Offline Mode] Gemini API key is not configured in environment. 

Here is a standard cybersecurity brief for your query: "${prompt}":
1. **Core Principle**: In cybersecurity, always practice defense-in-depth and least privilege.
2. **Authorized Workflow**: Never test systems without explicit written permission (Rules of Engagement).
3. **Defense Tip**: Keep systems patched, enforce multi-factor authentication (MFA), and monitor logs for abnormal parent process telemetry.`,
      sources: [],
    };
  }

  let augmentedPrompt = prompt;
  if (language === 'te') {
    augmentedPrompt += `\n[IMPORTANT: Please respond in Telugu (తెలుగు) with clear technical terminology and explanations.]`;
  }

  if (mode === 'notes') {
    augmentedPrompt += `\n[Format your response as a high-yield Cybersecurity Study Guide with Executive Summary, Deep Dive, Code/Syntax Examples, and Defense Checklist.]`;
  } else if (mode === 'quiz') {
    augmentedPrompt += `\n[Format your response as a 3-question Scenario-Based Cybersecurity Practice Quiz with Options A, B, C, D, followed by Answer Keys and in-depth rationales.]`;
  } else if (mode === 'lab') {
    augmentedPrompt += `\n[Format your response as a Safe Hands-on Lab Guide with Lab Objective, Setup Requirements, Step-by-Step Commands in a local Docker/sandbox, and Expected Observability Telemetry.]`;
  }

  try {
    const contents: any[] = [];
    // Include last few messages from history if provided
    for (const h of history.slice(-4)) {
      contents.push({
        role: h.role,
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: augmentedPrompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return {
      text: response.text || 'No response generated.',
    };
  } catch (error: any) {
    console.error('Gemini Agent Error:', error);
    throw new Error(error.message || 'Failed to generate agent response');
  }
}
