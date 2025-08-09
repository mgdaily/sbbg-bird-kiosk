<script lang="ts">
  import WaveformCanvas from '$lib/components/WaveformCanvas.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import { onMount, onDestroy } from 'svelte';

  let audioContext: AudioContext | null = null;

  // Bird call playback graph
  let birdBuffer: AudioBuffer | null = null;
  let birdSource: AudioBufferSourceNode | null = null;
  let birdAnalyser: AnalyserNode | null = null;
  let birdGain: GainNode | null = null;

  // Microphone capture graph
  let micStream: MediaStream | null = null;
  let micSource: MediaStreamAudioSourceNode | null = null;
  let micAnalyser: AnalyserNode | null = null;

  let isMicEnabled = false;
  let isPlaying = false;

  const BIRD_AUDIO_URL = '/audio/bird.mp3'; // place your file at static/audio/bird.mp3

  function ensureAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  }

  async function loadBirdBuffer() {
    const ctx = ensureAudioContext();
    if (birdBuffer) return birdBuffer;
    const res = await fetch(BIRD_AUDIO_URL);
    if (!res.ok) throw new Error('Failed to load bird audio');
    const arrayBuf = await res.arrayBuffer();
    birdBuffer = await ctx.decodeAudioData(arrayBuf);
    return birdBuffer;
  }

  async function playBird() {
    try {
      const ctx = ensureAudioContext();
      const buffer = await loadBirdBuffer();

      // Clean up previous source if any
      if (birdSource) {
        try { birdSource.stop(); } catch {}
        birdSource.disconnect();
      }

      birdSource = ctx.createBufferSource();
      birdSource.buffer = buffer;

      birdGain = ctx.createGain();
      birdGain.gain.value = 1.0;

      birdAnalyser = ctx.createAnalyser();
      birdAnalyser.fftSize = 2048;

      birdSource.connect(birdGain);
      birdGain.connect(birdAnalyser);
      birdAnalyser.connect(ctx.destination);

      isPlaying = true;
      birdSource.start();
      birdSource.onended = () => {
        isPlaying = false;
      };
    } catch (err) {
      console.error(err);
      alert('Could not play bird audio. Ensure /static/audio/bird.mp3 exists.');
    }
  }

  async function enableMic() {
    try {
      const ctx = ensureAudioContext();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micSource = ctx.createMediaStreamSource(micStream);

      micAnalyser = ctx.createAnalyser();
      micAnalyser.fftSize = 2048;

      // Optional: route to destination at low gain so users hear themselves
      const micGain = ctx.createGain();
      micGain.gain.value = 0.0; // silent by default to avoid feedback on kiosk speakers

      micSource.connect(micAnalyser);
      micAnalyser.connect(micGain);
      micGain.connect(ctx.destination);

      isMicEnabled = true;
    } catch (err) {
      console.error(err);
      alert('Microphone permission denied or unavailable.');
    }
  }

  function disableMic() {
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }
    if (micSource) {
      micSource.disconnect();
      micSource = null;
    }
    if (micAnalyser) {
      micAnalyser.disconnect();
      micAnalyser = null;
    }
    isMicEnabled = false;
  }

  onDestroy(() => {
    disableMic();
    if (birdSource) {
      try { birdSource.stop(); } catch {}
      birdSource.disconnect();
      birdSource = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
  });
</script>

<style>
  .page {
    --bg: #061019;
    --panel: #0e1b27;
    --text: #e8f0f7;
    --muted: #93a6b7;
    min-height: 100dvh;
    background: var(--bg);
    color: var(--text);
    display: grid;
    grid-template-rows: auto 1fr;
  }
  header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0));
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  h1 {
    font-size: clamp(18px, 3vw, 24px);
    margin: 0;
  }
  main {
    padding: 20px;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
  }
  .hero {
    display: grid;
    place-items: center;
    padding: 24px 0;
  }
  .controls {
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr 1fr;
  }
  .button {
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    touch-action: manipulation;
    background: #22c55e;
    color: #041014;
    font-weight: 800;
    border: none;
    border-radius: 16px;
    padding: 20px;
    font-size: clamp(18px, 4vw, 24px);
    box-shadow: 0 10px 24px rgba(34,197,94,0.35), 0 1px 0 rgba(255,255,255,0.2) inset;
  }
  .button:active {
    transform: translateY(1px);
  }
  .secondary {
    background: #0ea5e9;
    color: #041014;
    box-shadow: 0 10px 24px rgba(14,165,233,0.35), 0 1px 0 rgba(255,255,255,0.2) inset;
  }
  .panel {
    background: var(--panel);
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 16px 40px rgba(0,0,0,0.35);
  }
  .wave-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }
  @media (min-width: 860px) {
    .wave-grid { grid-template-columns: 1fr 1fr; }
  }
  .hint { color: var(--muted); font-size: 14px; }
</style>

<div class="page">
  <header>
    <h1>Bird Call Mimic</h1>
    <div class="hint">Tap Play, then mimic into the mic</div>
  </header>
  <main>
    <div class="hero">
      <BigButton label={isPlaying ? 'Playing…' : 'Play Bird Call'} emoji="🐦🔊" color="#22c55e" onPress={playBird} />
    </div>
    <div class="controls">
      {#if !isMicEnabled}
        <button class="button secondary" on:click={enableMic} aria-label="Enable microphone">🎤 Enable Mic</button>
      {:else}
        <button class="button secondary" on:click={disableMic} aria-label="Disable microphone">⏹️ Disable Mic</button>
      {/if}
    </div>

    <div class="panel wave-grid">
      <WaveformCanvas analyser={birdAnalyser} label="Bird" lineColor="#22c55e" />
      <WaveformCanvas analyser={micAnalyser} label="You" lineColor="#0ea5e9" />
    </div>

    <div class="hint">Place your audio file at <code>static/audio/bird.mp3</code>. This UI is designed for kiosk touchscreens.</div>
  </main>
</div>
