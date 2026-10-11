import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI, Type } from '@google/genai';
import { db, VideoProject, VideoScene } from './db.js';

const execAsync = promisify(exec);
const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');

// Ensure directories exist
for (const dir of [UPLOADS_DIR, VIDEOS_DIR, AUDIO_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generates an educational cybersecurity storyboard & script using Gemini
 */
export async function generateStoryboardAndScript(
  topic: string,
  userPrompt: string,
  language: 'en' | 'te' | 'hi',
  targetDurationSeconds: number,
  audience: 'beginner' | 'intermediate' | 'advanced',
  style: string
): Promise<{ title: string; script: string; scenes: VideoScene[] }> {
  const languageInstructions = {
    en: 'English. Keep narration clear, punchy, and educational.',
    te: 'Telugu (తెలుగు). The narration must be written in natural, fluent Telugu prose while retaining standard cybersecurity keywords in brackets or technical context (e.g., "SQL Injection", "Database Firewall", "Parameterized Queries").',
    hi: 'Hindi. Narration in Hindi with standard cybersecurity terminology.',
  };

  const promptText = `You are a professional educational video director and cybersecurity specialist.
Create a structured storyboard and narration script for an animated cybersecurity educational video.

Topic: ${topic}
User Request: ${userPrompt}
Target Duration: approximately ${targetDurationSeconds} seconds total.
Target Audience: ${audience}
Style: ${style} (e.g. cyberpunk hacker terminal, motion graphics, defense diagrams)
Language Requirement: ${languageInstructions[language]}

Generate 3 to 5 coherent scenes that break down this cybersecurity topic:
1. Scene 1: Hook and Problem definition (e.g., how the vulnerability or concept occurs)
2. Scene 2: Technical Breakdown with code or terminal commands
3. Scene 3: Hands-on Lab or Defense Mechanism (Safe verification)
4. Scene 4: Best Practices & Prevention (e.g. prepared statements, patch management)

Each scene must have:
- sceneNumber: integer
- title: concise scene title
- durationSeconds: integer (e.g. 10 to 30)
- narration: spoken script for the voice narrator in the requested language
- visualDescription: detailed description of what should be visually animated or displayed on screen (e.g. "Green glowing terminal with SQL query parsing error", "Data packets traversing a firewall")
- codeOrCommand: terminal command or code snippet to display on screen (e.g. "SELECT * FROM users WHERE id = 1;", "nmap -sV -p 80,443 target.local")
- terminalOutput: optional mock terminal output to display

Respond strictly with a JSON object adhering to this schema:
{
  "title": "Clean concise video title",
  "fullScript": "Complete combined narration text",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Title",
      "durationSeconds": 15,
      "narration": "Narration text",
      "visualDescription": "Visual directives",
      "codeOrCommand": "command or code",
      "terminalOutput": "output"
    }
  ]
}`;

  if (!apiKey) {
    // Return high-quality deterministic fallback storyboard if offline
    return createDefaultStoryboard(topic, userPrompt, language, targetDurationSeconds);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);

    const scenes: VideoScene[] = (parsed.scenes || []).map((s: any, idx: number) => ({
      id: `scene-${idx + 1}-${Date.now()}`,
      sceneNumber: s.sceneNumber || idx + 1,
      title: s.title || `Scene ${idx + 1}`,
      durationSeconds: Number(s.durationSeconds) || Math.round(targetDurationSeconds / (parsed.scenes?.length || 4)),
      narration: s.narration || '',
      visualDescription: s.visualDescription || '',
      codeOrCommand: s.codeOrCommand || '',
      terminalOutput: s.terminalOutput || '',
    }));

    return {
      title: parsed.title || topic,
      script: parsed.fullScript || scenes.map((s) => s.narration).join('\n\n'),
      scenes,
    };
  } catch (err) {
    console.warn('Gemini script generation fallback:', err);
    return createDefaultStoryboard(topic, userPrompt, language, targetDurationSeconds);
  }
}

function createDefaultStoryboard(topic: string, userPrompt: string, language: 'en' | 'te' | 'hi', duration: number) {
  const isTelugu = language === 'te';
  const scenes: VideoScene[] = [
    {
      id: `scene-1-${Date.now()}`,
      sceneNumber: 1,
      title: isTelugu ? 'పరిచయం & ముప్పు అవగాహన' : 'Introduction & Threat Landscape',
      durationSeconds: Math.round(duration * 0.25),
      narration: isTelugu
        ? `సైబర్ సెక్యూరిటీ ప్రపంచంలో ${topic} గురించి తెలుసుకోవడం అత్యంత ముఖ్యం. అసురక్షిత ఇన్పుట్ ద్వారా హ్యాకర్లు డేటాబేస్ లేదా సిస్టమ్లను ఎలా ప్రభావితం చేస్తారో ఇక్కడ పరిశీలిద్దాం.`
        : `Understanding ${topic} is foundational to modern cybersecurity defense. Today, we break down how vulnerabilities arise and how defenders safeguard digital infrastructure.`,
      visualDescription: 'Futuristic terminal displaying incoming network traffic and encrypted database connections.',
      codeOrCommand: `// Threat Simulation: Analyzing ${topic}\ncurl -i -X POST https://api.local/verify`,
      terminalOutput: '[CONNECTED] 200 OK - TLS 1.3 Established',
    },
    {
      id: `scene-2-${Date.now()}`,
      sceneNumber: 2,
      title: isTelugu ? 'సాంకేతిక వివరాలు & విశ్లేషణ' : 'Technical Anatomy & Attack Vector',
      durationSeconds: Math.round(duration * 0.35),
      narration: isTelugu
        ? `సిస్టమ్ లోపాలను నిశితంగా పరిశీలిస్తే, యూజర్ ఇన్పుట్ నేరుగా ఎగ్జిక్యూట్ అవ్వడం వల్ల ఈ సమస్య వస్తుంది. డిఫెండర్లు ఈ లాగ్లను నిరంతరం విశ్లేషిస్తారు.`
        : `When untrusted input bypasses validation, malicious logic can alter execution flow. In this scene, we observe how security teams detect suspicious syntax anomalies in application telemetry.`,
      visualDescription: 'Syntax parsing visualization with highlighted dangerous escape characters and memory buffers.',
      codeOrCommand: `SELECT * FROM accounts WHERE id = 101 AND active = 1;`,
      terminalOutput: '[AUDIT_LOG] Query parsed in 1.4ms - 1 row matched',
    },
    {
      id: `scene-3-${Date.now()}`,
      sceneNumber: 3,
      title: isTelugu ? 'రక్షణ విధానాలు & ఉత్తమ పద్ధతులు' : 'Defense & Secure Implementation',
      durationSeconds: Math.round(duration * 0.4),
      narration: isTelugu
        ? `దీనిని నివారించడానికి పారామీటరైజ్డ్ క్వెరీలు, లీస్ట్ ప్రివిలేజ్ పాలసీ మరియు ఇన్పుట్ శానిటైజేషన్ తప్పనిసరి. RVCYBER AGENT తో ఎల్లప్పుడూ చట్టబద్ధమైన మరియు రక్షణాత్మక పద్ధతులను పాటించండి.`
        : `To defend against this risk, implement strict parameterized statements, least-privilege database roles, and continuous automated static analysis. Stay secure with RVCYBER AGENT.`,
      visualDescription: 'Cryptographic shields activating over database tables with green verification badges.',
      codeOrCommand: `const stmt = db.prepare('SELECT * FROM users WHERE id = ?');\nstmt.execute([userId]);`,
      terminalOutput: '[SECURE] Parameterized query executed successfully.',
    },
  ];

  return {
    title: `${topic} - Cybersecurity Masterclass`,
    script: scenes.map((s) => s.narration).join('\n\n'),
    scenes,
  };
}

/**
 * Generates audio narration using Gemini TTS or generates clean WAV fallback
 */
export async function generateNarrationAudio(projectId: string, scriptText: string, voiceName: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon' = 'Kore'): Promise<string> {
  const audioFilePath = path.join(AUDIO_DIR, `${projectId}.wav`);

  if (apiKey) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: scriptText.slice(0, 1000), // Keep concise for crisp narration
                speechMetadata: {
                  style: 'Authoritative, clear, professional cybersecurity instructor',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const wavBuffer = Buffer.from(base64Audio, 'base64');
        fs.writeFileSync(audioFilePath, wavBuffer);
        return `/uploads/audio/${projectId}.wav`;
      }
    } catch (err) {
      console.warn('Gemini TTS generation error, falling back to synthesized cyber audio tone:', err);
    }
  }

  // Synthesize clean audio using FFmpeg sine waves and cyber hum to ensure video always renders with synchronized sound!
  try {
    const duration = Math.min(60, Math.max(10, Math.round(scriptText.split(' ').length / 2.5)));
    // Generate subtle cyber ambient drone sound
    await execAsync(`ffmpeg -y -f lavfi -i "sine=frequency=220:duration=${duration}" -af "volume=0.15" -c:a pcm_s16le "${audioFilePath}"`);
    return `/uploads/audio/${projectId}.wav`;
  } catch (err) {
    console.error('Failed to create fallback audio:', err);
    // Write minimal 1-second silence WAV if all else fails
    writeMinimalWav(audioFilePath);
    return `/uploads/audio/${projectId}.wav`;
  }
}

function writeMinimalWav(filepath: string) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = sampleRate * 5 * 2; // 5 seconds
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const silence = Buffer.alloc(dataSize, 0);
  fs.writeFileSync(filepath, Buffer.concat([header, silence]));
}

/**
 * Creates SRT format subtitle file from scenes
 */
export function generateSrtSubtitles(scenes: VideoScene[], projectId: string): string {
  let srtContent = '';
  let currentTime = 0;

  scenes.forEach((scene, index) => {
    const startTimeStr = formatSrtTime(currentTime);
    const endTime = currentTime + scene.durationSeconds;
    const endTimeStr = formatSrtTime(endTime);

    srtContent += `${index + 1}\n`;
    srtContent += `${startTimeStr} --> ${endTimeStr}\n`;
    srtContent += `[${scene.title}]\n${scene.narration.replace(/\n+/g, ' ')}\n\n`;

    currentTime = endTime;
  });

  const srtPath = path.join(VIDEOS_DIR, `${projectId}.srt`);
  fs.writeFileSync(srtPath, srtContent, 'utf-8');
  return srtContent;
}

function formatSrtTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Renders complete animated MP4 video using FFmpeg
 */
export async function renderFullVideo(project: VideoProject): Promise<{ videoUrl: string; thumbnailUrl: string; duration: number }> {
  const videoFileName = `${project.id}.mp4`;
  const thumbFileName = `${project.id}.jpg`;
  const outputVideoPath = path.join(VIDEOS_DIR, videoFileName);
  const outputThumbPath = path.join(VIDEOS_DIR, thumbFileName);
  const audioFilePath = path.join(AUDIO_DIR, `${project.id}.wav`);

  // Resolution according to aspect ratio
  let width = 1280;
  let height = 720;
  if (project.aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (project.aspectRatio === '1:1') {
    width = 720;
    height = 720;
  }

  const totalDuration = project.storyboard.reduce((acc, s) => acc + (s.durationSeconds || 10), 0) || 30;

  // Render individual scene images/frames to stitch
  const tempSceneDir = path.join(VIDEOS_DIR, `temp_${project.id}`);
  if (!fs.existsSync(tempSceneDir)) {
    fs.mkdirSync(tempSceneDir, { recursive: true });
  }

  try {
    // Generate clean SVG visual slides with futuristic cyber terminal styling for each scene
    const sceneVideoFiles: string[] = [];

    for (let i = 0; i < project.storyboard.length; i++) {
      const scene = project.storyboard[i];
      const svgPath = path.join(tempSceneDir, `scene_${i}.svg`);
      const sceneVideoPath = path.join(tempSceneDir, `scene_${i}.mp4`);

      const svgContent = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#040806"/>
      <stop offset="50%" stop-color="#08140c"/>
      <stop offset="100%" stop-color="#020402"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ff66" stroke-width="0.3" stroke-opacity="0.2"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Top Terminal Header -->
  <rect x="40" y="40" width="${width - 80}" height="44" rx="6" fill="#000000" stroke="#00ff66" stroke-width="1.5" stroke-opacity="0.4"/>
  <circle cx="65" cy="62" r="5" fill="#ff4d4d"/>
  <circle cx="85" cy="62" r="5" fill="#ffcc00"/>
  <circle cx="105" cy="62" r="5" fill="#00ff66"/>
  <text x="130" y="67" font-family="monospace" font-size="14" fill="#00ff66" font-weight="bold">RVCYBER AGENT // ${escapeXml(project.title)}</text>
  <text x="${width - 160}" y="67" font-family="monospace" font-size="12" fill="#88ffaa">[SCENE ${scene.sceneNumber}/${project.storyboard.length}]</text>

  <!-- Center Card -->
  <rect x="60" y="110" width="${width - 120}" height="${height - 240}" rx="12" fill="#061209" fill-opacity="0.8" stroke="#00ff66" stroke-width="1.5"/>

  <!-- Scene Title -->
  <text x="90" y="160" font-family="sans-serif" font-size="28" font-weight="bold" fill="#ffffff">${escapeXml(scene.title)}</text>

  <!-- Visual Concept Description -->
  <text x="90" y="200" font-family="sans-serif" font-size="16" fill="#a0ffc4">${escapeXml(scene.visualDescription.slice(0, 100))}</text>

  <!-- Code/Command Box -->
  <rect x="90" y="230" width="${width - 180}" height="${height - 400}" rx="8" fill="#000000" stroke="#00ff66" stroke-width="1" stroke-opacity="0.6"/>
  <text x="110" y="265" font-family="monospace" font-size="13" fill="#66ff99" font-weight="bold">TERMINAL LAB CONSOLE &gt;</text>
  <text x="110" y="295" font-family="monospace" font-size="15" fill="#00ff66">${escapeXml(scene.codeOrCommand || '// Analyzing cybersecurity protocol telemetry...')}</text>
  ${scene.terminalOutput ? `<text x="110" y="335" font-family="monospace" font-size="13" fill="#888888">${escapeXml(scene.terminalOutput)}</text>` : ''}

  <!-- Lower Subtitle / Narration Box -->
  <rect x="60" y="${height - 110}" width="${width - 120}" height="70" rx="8" fill="#000000" fill-opacity="0.9" stroke="#00ff66" stroke-width="1" stroke-opacity="0.5"/>
  <text x="${width / 2}" y="${height - 70}" font-family="sans-serif" font-size="16" font-weight="600" fill="#ffffff" text-anchor="middle">${escapeXml(scene.narration.slice(0, 95))}</text>
  ${scene.narration.length > 95 ? `<text x="${width / 2}" y="${height - 50}" font-family="sans-serif" font-size="14" fill="#a0ffc4" text-anchor="middle">${escapeXml(scene.narration.slice(95, 190))}</text>` : ''}
</svg>`;

      fs.writeFileSync(svgPath, svgContent, 'utf-8');

      // Convert SVG slide to animated clip with subtle zoom/pan pulse using FFmpeg
      const sceneDuration = scene.durationSeconds || 8;
      const ffmpegCmd = `ffmpeg -y -loop 1 -t ${sceneDuration} -i "${svgPath}" -vf "scale=${width}:${height},format=yuv420p" -c:v libx264 -preset ultrafast -r 24 "${sceneVideoPath}"`;
      await execAsync(ffmpegCmd);
      sceneVideoFiles.push(sceneVideoPath);
    }

    // Create concat file for FFmpeg
    const concatListPath = path.join(tempSceneDir, 'concat_list.txt');
    const concatContent = sceneVideoFiles.map((file) => `file '${file}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent, 'utf-8');

    // Stitch scenes and merge audio track
    const stitchedVideoPath = path.join(tempSceneDir, 'stitched.mp4');
    await execAsync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${stitchedVideoPath}"`);

    // Combine video with audio narration
    const hasAudio = fs.existsSync(audioFilePath);
    let finalRenderCmd = '';

    if (hasAudio) {
      finalRenderCmd = `ffmpeg -y -i "${stitchedVideoPath}" -i "${audioFilePath}" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${outputVideoPath}"`;
    } else {
      finalRenderCmd = `ffmpeg -y -i "${stitchedVideoPath}" -c:v copy -movflags +faststart "${outputVideoPath}"`;
    }

    await execAsync(finalRenderCmd);

    // Extract first frame as high-quality thumbnail
    await execAsync(`ffmpeg -y -ss 00:00:01 -i "${outputVideoPath}" -vframes 1 -q:v 2 "${outputThumbPath}"`);

    // Cleanup temp directory
    fs.rmSync(tempSceneDir, { recursive: true, force: true });

    return {
      videoUrl: `/uploads/videos/${videoFileName}`,
      thumbnailUrl: `/uploads/videos/${thumbFileName}`,
      duration: totalDuration,
    };
  } catch (error) {
    console.error('FFmpeg render error:', error);
    // Cleanup temp directory on error
    try {
      if (fs.existsSync(tempSceneDir)) {
        fs.rmSync(tempSceneDir, { recursive: true, force: true });
      }
    } catch {}
    throw error;
  }
}

function escapeXml(unsafe: string) {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * Background job queue executor for video project pipeline
 */
export async function executeVideoJobPipeline(projectId: string) {
  const project = db.getVideoProject(projectId);
  if (!project) return;

  try {
    // Step 1: Generating Script & Storyboard (if not already completed)
    if (!project.storyboard || project.storyboard.length === 0) {
      db.updateVideoProject(projectId, {
        status: 'generating_script',
        progress: 15,
        statusMessage: 'Synthesizing educational cybersecurity storyboard & narration...',
      });

      const { title, script, scenes } = await generateStoryboardAndScript(
        project.topic,
        project.title,
        project.language,
        project.durationSeconds,
        project.audience,
        project.style
      );

      db.updateVideoProject(projectId, {
        title: project.title || title,
        script,
        storyboard: scenes,
        progress: 35,
        statusMessage: 'Storyboard generated. Preparing animation assets...',
      });
    }

    // Step 2: Generating Assets
    db.updateVideoProject(projectId, {
      status: 'generating_assets',
      progress: 45,
      statusMessage: 'Generating visual graphics, terminal cards, and subtitles...',
    });

    const updatedProject = db.getVideoProject(projectId)!;
    const srt = generateSrtSubtitles(updatedProject.storyboard, projectId);

    // Step 3: Generating Voice
    db.updateVideoProject(projectId, {
      status: 'generating_voice',
      progress: 65,
      subtitleSrt: srt,
      statusMessage: `Generating AI voice narration (${updatedProject.voice}) in ${updatedProject.language.toUpperCase()}...`,
    });

    const audioUrl = await generateNarrationAudio(projectId, updatedProject.script, updatedProject.voice);

    // Step 4: Server-Side Rendering
    db.updateVideoProject(projectId, {
      status: 'rendering',
      progress: 80,
      audioUrl,
      statusMessage: 'Rendering MP4 video with FFmpeg, compositing audio & animated graphics...',
    });

    const latestProj = db.getVideoProject(projectId)!;
    const { videoUrl, thumbnailUrl, duration } = await renderFullVideo(latestProj);

    // Step 5: Completed!
    db.updateVideoProject(projectId, {
      status: 'completed',
      progress: 100,
      videoUrl,
      thumbnailUrl,
      durationSeconds: duration,
      statusMessage: 'Video rendering finished. Ready to preview and download.',
    });
  } catch (error: any) {
    console.error(`Video Job ${projectId} Failed:`, error);
    db.updateVideoProject(projectId, {
      status: 'failed',
      progress: 0,
      statusMessage: 'Video generation failed.',
      errorMessage: error.message || 'Rendering error occurred.',
    });
  }
}
