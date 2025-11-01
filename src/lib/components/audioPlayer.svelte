<script lang="ts">
    import { onMount } from 'svelte';
    import type { WaveSurferInstance } from 'wavesurfer';

    let { audioPath }: { audioPath: string } = $props();
    let wavesurfer: WaveSurferInstance | null = null;

    onMount(async () => {
        const WaveSurfer = (await import('wavesurfer')).default;
        wavesurfer = WaveSurfer.create({
            container: '#canvas',
            waveColor: 'violet',
            progressColor: 'purple',
            url: audioPath
        });
        wavesurfer.load(audioPath);
    });

    function playSound() {
        wavesurfer?.play();
    }
    function stopSound() {
        wavesurfer?.stop();
    }
</script>

<button class="btn btn-primary" onclick={playSound}>Play</button>
<button class="btn btn-primary" onclick={stopSound}>Stop</button>
<div id="canvas" class="w-full h-full"></div>
