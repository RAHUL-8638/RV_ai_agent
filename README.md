# RVCYBER AGENT
## Full-Stack AI Cybersecurity Agent, Animated Video Generator & Hacker Community Platform

RVCYBER AGENT is a production-grade full-stack cybersecurity intelligence, animated video synthesis, and education platform.

Built with a high-contrast black and Matrix-green cyberpunk aesthetic, it features:
- **Bilingual AI Cybersecurity Agent**: Real-time advice, study notes, quiz generation, and lab guidance in English and Telugu (తెలుగు).
- **AI Animated Video Studio**: Prompt-to-video pipeline with storyboard editing, Gemini TTS voice narration, and real server-side FFmpeg MP4 rendering with subtitle (.SRT) generation.
- **Sole-Owner Administrative Control**: Strict single-owner architecture. Public registrations strictly receive `USER` status. No user may promote themselves.
- **Hands-on Defensive Labs**: Interactive simulators for SQL Injection & Parameterized Queries, XSS Entity Sanitization, JWT Cryptographic Verification, and Linux Log Forensics.
- **Content Hub**: Articles publishing with Markdown, PDF/Document repository with secure downloads, and Community discussions.
- **Matrix Rain Canvas**: High-performance, accessible HTML5 Canvas digital code rain effect respecting `prefers-reduced-motion`.

---

## Architecture Overview

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion, Lucide Icons, Canvas Matrix Engine.
- **Backend**: Node.js & Express, Vite Middlewares in dev mode, server-side `@google/genai` SDK.
- **AI Models**:
  - LLM: `gemini-3.8-flash` (Agent chats, storyboards, quizzes, study notes).
  - Speech Synthesis (TTS): `gemini-3.8-flash-lite-tts` (Unary WAV audio).
- **Video Renderer**: Server-side FFmpeg pipeline compositing animated graphics, audio tracks, and generating MP4 video files.
- **Database & Storage**: Atomic JSON persistence with audit logs, user management, and local file storage in `/uploads`.

---

## Quick Start (Local Development)

### 1. Requirements
- Node.js 18+ or 20+
- FFmpeg installed (`ffmpeg -version`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and set your variables:
```bash
cp .env.example .env
```
Ensure `GEMINI_API_KEY` is set.

### 4. Run Automated Security Suite
Verify all 9 security invariants (single-owner enforcement, privilege isolation, IDOR prevention):
```bash
npm run test:security
```

### 5. Launch Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

---

## First-Owner Setup Procedure

1. Launch the platform in your browser.
2. If no owner account exists yet, click **Access Terminal** in the top navigation.
3. Switch to the **First Owner** tab.
4. Supply your private owner username, email, and strong password (minimum 10 characters).
5. Upon submission, the platform permanently initializes the sole OWNER account and seals the bootstrap route (`/api/admin/bootstrap`). All future registration requests automatically receive the standard `USER` role.

---

## Docker Deployment

To launch the full-stack containerized service with FFmpeg:
```bash
docker compose up -d --build
```
The application will be accessible at port `3000`.
