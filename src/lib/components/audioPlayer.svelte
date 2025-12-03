<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import type { WaveSurferInstance } from "wavesurfer";
  import { getMimicPhase, setMimicPhase } from "$lib/stores/appStore.svelte";

  let { audioPath }: { audioPath: string } = $props();

  let originalWaveform: WaveSurferInstance | null = null;
  let recordingWaveform: WaveSurferInstance | null = null;
  let microphonePlugin: any = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;

  // this is a derived state that is updated by the appStore`
  let phase = $derived(getMimicPhase());

  let countdown = $state<number>(0);
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let errorMessage = $state<string | null>(null);
  let originalDuration = $state<number>(0);
  let recordingTimeout: ReturnType<typeof setTimeout> | null = null;
  let recordingStartTime = $state<number>(0);
  let recordingProgress = $state<number>(0);
  let progressInterval: ReturnType<typeof setInterval> | null = null;

  async function initializeWaveform(path: string) {
    if (!path) return;

    // Destroy existing waveform if it exists
    if (originalWaveform) {
      originalWaveform.destroy();
      originalWaveform = null;
    }

    // Clear the container element
    const container = document.getElementById("original-canvas");
    if (container) {
      container.innerHTML = "";
    }

    const WaveSurfer = (await import("wavesurfer")).default;
    // Create waveform for original call
    originalWaveform = WaveSurfer.create({
      container: "#original-canvas",
      waveColor: "#f0f0f0",
      progressColor: "#ffffff",
      url: path,
    });

    originalWaveform.load(path);

    // Get the duration once the audio is ready
    originalWaveform.on("ready", () => {
      // Create a temporary audio element to get duration
      const tempAudio = new Audio(path);
      tempAudio.addEventListener("loadedmetadata", () => {
        originalDuration = tempAudio.duration;
      });
      tempAudio.load();
    });

    // Listen for playback finish
    originalWaveform.on("finish", () => {
      if (phase === "recorded") {
        // allow the user to replay the original audio, even after recording.
        return;
      } else {
        setMimicPhase("countdown");
        startCountdown();
      }
    });
  }

  // React to audioPath changes (runs on mount and when audioPath changes)
  $effect(() => {
    if (audioPath) {
      initializeWaveform(audioPath);
    }
  });

  onDestroy(() => {
    if (originalWaveform) {
      originalWaveform.destroy();
    }
    if (recordingWaveform) {
      recordingWaveform.destroy();
    }
    if (microphonePlugin) {
      try {
        microphonePlugin.stop();
      } catch (e) {
        // Ignore errors
      }
    }
    if (audioContext) {
      (audioContext as AudioContext).close();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  });

  function startCountdown() {
    countdown = 3;
    countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        startRecording();
      }
    }, 1000);
  }

  async function startRecording() {
    errorMessage = null;
    setMimicPhase("recording");

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Your browser does not support audio recording. Please use a modern browser like Firefox, Chrome, or Edge."
        );
      }

      // Firefox-compatible audio constraints
      const audioConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      // Check if we got an audio track
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error(
          "No audio input device found. Please connect a microphone."
        );
      }

      // Create recording waveform with live stream BEFORE starting MediaRecorder
      const WaveSurfer = (await import("wavesurfer")).default;
      recordingWaveform = WaveSurfer.create({
        container: "#recording-canvas",
        waveColor: "#4ade80",
        progressColor: "#22c55e",
        media: stream, // This enables live visualization
      });

      // Create MediaRecorder
      // Firefox prefers certain MIME types - try webm first, fallback to default
      const mimeTypes = [
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
      ];
      let mimeType = "";

      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        errorMessage = "An error occurred during recording.";
        stopRecording();
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
          errorMessage = "No audio was recorded. Please try again.";
          setMimicPhase("idle");
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          if (recordingWaveform) {
            recordingWaveform.destroy();
            recordingWaveform = null;
          }
          return;
        }

        const audioBlob = new Blob(audioChunks, {
          type: mimeType || "audio/webm",
        });
        const blobUrl = URL.createObjectURL(audioBlob);

        // Replace the live stream with the recorded blob for playback
        if (recordingWaveform) {
          recordingWaveform.load(blobUrl);

          // Clean up blob URL after loading
          recordingWaveform.on("ready", () => {
            URL.revokeObjectURL(blobUrl);
          });
        }

        setMimicPhase("recorded");

        // Stop all tracks
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          stream = null;
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setMimicPhase("recording");

      // Start progress tracking
      recordingStartTime = Date.now();
      recordingProgress = 0;

      // Update progress every 100ms
      progressInterval = setInterval(() => {
        if (originalDuration > 0) {
          const elapsed = (Date.now() - recordingStartTime) / 1000;
          recordingProgress = Math.min(elapsed / originalDuration, 1);

          // Stop if we've reached the end
          if (recordingProgress >= 1) {
            stopRecording();
          }
        }
      }, 10);

      // Auto-stop recording when it reaches the original duration
      if (originalDuration > 0) {
        recordingTimeout = setTimeout(() => {
          stopRecording();
        }, originalDuration * 1000);
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);

      let message = "Could not access microphone. ";
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          message += "Please grant microphone permissions and try again.";
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          message += "No microphone found. Please connect a microphone.";
        } else if (
          error.name === "NotReadableError" ||
          error.name === "TrackStartError"
        ) {
          message += "Microphone is being used by another application.";
        } else {
          message += error.message;
        }
      }

      errorMessage = message;
      setMimicPhase("idle");

      // Clean up progress tracking
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      recordingStartTime = 0;
      recordingProgress = 0;

      // Reset waveform progress
      if (originalWaveform) {
        (originalWaveform as any).seekTo(0);
      }

      // Clean up if stream was partially created
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (recordingWaveform) {
        recordingWaveform.destroy();
        recordingWaveform = null;
      }
    }
  }

  function playOriginal() {
    if (originalWaveform) {
      if (phase === "recorded") {
        // allow the user to replay the original audio, even after recording.
        originalWaveform.play();
      } else {
        setMimicPhase("playing");
        originalWaveform.play();
      }
    }
  }

  function stopRecording() {
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      recordingTimeout = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  function playRecording() {
    if (recordingWaveform) {
      recordingWaveform.play();
    }
  }
</script>

<div class="w-full max-w-4xl mx-auto">
  <div class="space-y-8">
    <!-- Original Call Section -->
    <div class="space-y-4">
      <h2 class="headline text-2xl">Original</h2>
      <div class="relative w-full">
        <div id="original-canvas" class="w-full h-32 bg-black/20 rounded"></div>
        {#if phase === "recording" && recordingProgress > 0}
          <div
            class="absolute top-0 bottom-0 w-0.5 bg-yellow-400/80 pointer-events-none z-10 transition-all duration-100"
            style="left: {recordingProgress * 100}%"
          ></div>
        {/if}
      </div>
      <button
        onclick={playOriginal}
        disabled={phase === "recording" || phase === "countdown"}
        class="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Play
      </button>
    </div>

    <!-- Error Message -->
    {#if errorMessage}
      <div
        class="bg-red-600/20 border border-red-600 text-red-200 px-4 py-3 rounded"
      >
        <p class="body-text">{errorMessage}</p>
        <button
          onclick={() => {
            errorMessage = null;
          }}
          class="mt-2 text-sm underline hover:text-red-100"
        >
          Dismiss
        </button>
      </div>
    {/if}

    <!-- Countdown Display -->
    {#if phase === "countdown"}
      <div class="text-center">
        <div class="text-8xl font-bold text-white mb-4">{countdown}</div>
        <p class="text-light-gray">Get ready to mimic...</p>
      </div>
    {/if}

    <!-- Progress Bar -->
    {#if (phase === "recording" || phase === "recorded") && originalDuration > 0}
      <div class="space-y-2">
        <div class="w-full bg-white/10 rounded-full h-3 overflow-hidden">
          <div
            class="bg-green-500 h-full transition-all duration-100 rounded-full"
            style="width: {recordingProgress * 100}%"
          ></div>
        </div>
        <div class="flex justify-between text-sm text-white/70">
          <span
            >{Math.round(recordingProgress * originalDuration)}s / {Math.round(
              originalDuration
            )}s</span
          >
          <span>{Math.round(recordingProgress * 100)}%</span>
        </div>
      </div>
    {/if}

    <!-- Recording Section -->
    {#if phase === "recording" || phase === "recorded"}
      <div class="space-y-4">
        <h2 class="headline text-2xl">Your Mimic</h2>
        <div
          id="recording-canvas"
          class="w-full h-32 bg-black/20 rounded"
        ></div>
        {#if phase === "recording"}
          <div class="flex items-center justify-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span class="body-text">Recording...</span>
            </div>
            <button
              onclick={stopRecording}
              class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Stop Recording
            </button>
          </div>
        {:else if phase === "recorded"}
          <div class="flex gap-4">
            <button
              onclick={playRecording}
              class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            >
              Play Your Recording
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  #original-canvas,
  #recording-canvas {
    min-height: 128px;
  }
</style>
