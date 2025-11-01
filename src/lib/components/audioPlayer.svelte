<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { WaveSurferInstance } from 'wavesurfer';

    let { audioPath }: { audioPath: string } = $props();
    
    let originalWaveform: WaveSurferInstance | null = null;
    let recordingWaveform: WaveSurferInstance | null = null;
    let microphonePlugin: any = null;
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let stream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number | null = null;
    
    let phase = $state<'idle' | 'playing' | 'countdown' | 'recording' | 'recorded'>('idle');
    let countdown = $state<number>(0);
    let countdownInterval: ReturnType<typeof setInterval> | null = null;
    let errorMessage = $state<string | null>(null);
    let originalDuration = $state<number>(0);
    let recordingTimeout: ReturnType<typeof setTimeout> | null = null;

    onMount(async () => {
        const WaveSurfer = (await import('wavesurfer')).default;
        
        // Create waveform for original call
        originalWaveform = WaveSurfer.create({
            container: '#original-canvas',
            waveColor: '#f0f0f0',
            progressColor: '#ffffff',
        url: audioPath
        });
        
        originalWaveform.load(audioPath);
        
        // Get the duration once the audio is ready
        originalWaveform.on('ready', () => {
            // Create a temporary audio element to get duration
            const tempAudio = new Audio(audioPath);
            tempAudio.addEventListener('loadedmetadata', () => {
                originalDuration = tempAudio.duration;
            });
            tempAudio.load();
        });
        
        // Listen for playback finish
        originalWaveform.on('finish', () => {
            phase = 'countdown';
            startCountdown();
        });
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
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
        if (audioContext) {
            audioContext.close();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        if (recordingTimeout) {
            clearTimeout(recordingTimeout);
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
        
        try {
            // Check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support audio recording. Please use a modern browser like Firefox, Chrome, or Edge.');
            }

            // Firefox-compatible audio constraints
            const audioConstraints: MediaStreamConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
            
            // Check if we got an audio track
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No audio input device found. Please connect a microphone.');
            }
            
            // Create recording waveform first (empty, we'll use microphone plugin or Web Audio API)
            const WaveSurfer = (await import('wavesurfer')).default;
            recordingWaveform = WaveSurfer.create({
                container: '#recording-canvas',
                waveColor: '#4ade80',
                progressColor: '#22c55e'
            });
            
            // Try using Microphone plugin for live visualization
            let useMicrophonePlugin = false;
            if (WaveSurfer.Microphone && WaveSurfer.registerPlugin) {
                try {
                    microphonePlugin = WaveSurfer.registerPlugin(WaveSurfer.Microphone.create());
                    useMicrophonePlugin = true;
                    
                    // Start microphone plugin for live visualization
                    await microphonePlugin.start();
                    
                    // The plugin should automatically visualize on the waveform
                    console.log('Using WaveSurfer Microphone plugin for live visualization');
                } catch (pluginError) {
                    console.warn('Microphone plugin failed, using Web Audio API fallback:', pluginError);
                    useMicrophonePlugin = false;
                }
            }
            
            // If microphone plugin isn't available, use Web Audio API for visualization
            if (!useMicrophonePlugin) {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                
                // Start visualization loop
                visualizeRecording();
            }
            
            // Create MediaRecorder for actual recording
            const mimeTypes = ['audio/webm', 'audio/webm;codecs=opus', 'audio/ogg;codecs=opus'];
            let mimeType = '';
            
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }
            
            mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                errorMessage = 'An error occurred during recording.';
                stopRecording();
            };
            
            mediaRecorder.onstop = async () => {
                // Stop visualization
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                // Remove overlay canvas
                const container = document.querySelector('#recording-canvas') as HTMLElement;
                if (container) {
                    const overlay = container.querySelector('canvas.recording-overlay');
                    if (overlay) {
                        overlay.remove();
                    }
                }
                
                if (microphonePlugin) {
                    try {
                        microphonePlugin.stop();
                    } catch (e) {
                        // Ignore
                    }
                }
                
                if (audioChunks.length === 0) {
                    errorMessage = 'No audio was recorded. Please try again.';
                    phase = 'idle';
                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                    }
                    if (recordingWaveform) {
                        recordingWaveform.destroy();
                        recordingWaveform = null;
                    }
                    return;
                }
                
                const audioBlob = new Blob(audioChunks, { type: mimeType || 'audio/webm' });
                const blobUrl = URL.createObjectURL(audioBlob);
                
                // Replace the live visualization with the recorded audio for playback
                if (recordingWaveform) {
                    recordingWaveform.load(blobUrl);
                    
                    recordingWaveform.on('ready', () => {
                        URL.revokeObjectURL(blobUrl);
                    });
                }
                
                phase = 'recorded';
                
                // Stop all tracks
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                }
                
                if (audioContext) {
                    await audioContext.close();
                    audioContext = null;
                }
            };
            
            mediaRecorder.start(100); // Collect data every 100ms
            phase = 'recording';
            
            // Auto-stop recording when it reaches the original duration
            if (originalDuration > 0) {
                recordingTimeout = setTimeout(() => {
                    stopRecording();
                }, originalDuration * 1000);
            }
        } catch (error) {
            console.error('Error accessing microphone:', error);
            
            let message = 'Could not access microphone. ';
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    message += 'Please grant microphone permissions and try again.';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    message += 'No microphone found. Please connect a microphone.';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    message += 'Microphone is being used by another application.';
                } else {
                    message += error.message;
                }
            }
            
            errorMessage = message;
            phase = 'idle';
            
            // Clean up if stream was partially created
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            if (recordingWaveform) {
                recordingWaveform.destroy();
                recordingWaveform = null;
            }
            if (audioContext) {
                await audioContext.close();
                audioContext = null;
            }
        }
    }

    function visualizeRecording() {
        if (!analyser || !recordingWaveform) return;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function draw() {
            if (phase !== 'recording' || !analyser) {
                return;
            }
            
            analyser.getByteTimeDomainData(dataArray);
            
            // Draw on the recording canvas container
            const container = document.querySelector('#recording-canvas') as HTMLElement;
            if (!container) {
                animationFrameId = requestAnimationFrame(draw);
                return;
            }
            
            // Create or get canvas for visualization overlay
            let canvas = container.querySelector('canvas.recording-overlay') as HTMLCanvasElement;
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.className = 'recording-overlay';
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.pointerEvents = 'none';
                container.style.position = 'relative';
                container.appendChild(canvas);
            }
            
            // Set canvas size
            const rect = container.getBoundingClientRect();
            if (canvas.width !== rect.width) {
                canvas.width = rect.width;
            }
            if (canvas.height !== rect.height) {
                canvas.height = rect.height;
            }
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Clear previous frame with slight fade for trailing effect
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw waveform
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#4ade80';
                ctx.beginPath();
                
                const sliceWidth = canvas.width / bufferLength;
                let x = 0;
                const centerY = canvas.height / 2;
                
                for (let i = 0; i < bufferLength; i++) {
                    const v = (dataArray[i] / 128.0) - 1.0; // Normalize to -1 to 1
                    const y = centerY + (v * centerY * 0.8); // Scale to 80% of height
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    
                    x += sliceWidth;
                }
                
                ctx.stroke();
            }
            
            animationFrameId = requestAnimationFrame(draw);
        }
        
        draw();
    }

    function playOriginal() {
        if (originalWaveform) {
            phase = 'playing';
            originalWaveform.play();
        }
    }

    function stopRecording() {
        if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            recordingTimeout = null;
        }
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (microphonePlugin) {
            try {
                microphonePlugin.stop();
            } catch (e) {
                // Ignore errors
            }
        }
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    function reset() {
        phase = 'idle';
        countdown = 0;
        errorMessage = null;
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            recordingTimeout = null;
        }
        if (originalWaveform) {
            originalWaveform.stop();
        }
        if (recordingWaveform) {
            recordingWaveform.destroy();
            recordingWaveform = null;
        }
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        audioChunks = [];
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
            <h2 class="headline text-2xl">Original Call</h2>
            <div id="original-canvas" class="w-full h-32 bg-black/20 rounded"></div>
            <button 
                onclick={playOriginal}
                class="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Play Call
            </button>
        </div>

        <!-- Error Message -->
        {#if errorMessage}
            <div class="bg-red-600/20 border border-red-600 text-red-200 px-4 py-3 rounded">
                <p class="body-text">{errorMessage}</p>
                <button 
                    onclick={() => { errorMessage = null; }}
                    class="mt-2 text-sm underline hover:text-red-100"
                >
                    Dismiss
                </button>
            </div>
        {/if}

        <!-- Countdown Display -->
        {#if phase === 'countdown'}
            <div class="text-center">
                <div class="text-8xl font-bold text-white mb-4">{countdown}</div>
                <p class="text-light-gray">Get ready to mimic...</p>
            </div>
        {/if}

        <!-- Recording Section -->
        {#if phase === 'countdown' || phase === 'recording' || phase === 'recorded'}
            <div class="space-y-4">
                <h2 class="headline text-2xl">Your Mimic</h2>
                <div id="recording-canvas" class="w-full h-32 bg-black/20 rounded"></div>
                {#if phase === 'countdown'}
                    <p class="text-light-gray text-center">Get ready...</p>
                {:else if phase === 'recording'}
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
                {:else if phase === 'recorded'}
                    <div class="flex gap-4">
                        <button 
                            onclick={playRecording}
                            class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                            Play Your Recording
                        </button>
                        <button 
                            onclick={reset}
                            class="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                        >
                            Try Again
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
