<script lang="ts">
    import AudioPlayer from '$lib/components/audioPlayer.svelte';
    import { goto } from '$app/navigation';
</script>

<div class="min-h-screen flex flex-col p-8">
    <!-- Back Button -->
    <a 
        href="/" 
        onclick={(e) => { e.preventDefault(); goto('/'); }}
        class="mb-8 text-white/80 hover:text-white transition-colors"
    >
        ← Back to Birds
    </a>

    <!-- Bird Page Content -->
    <div class="flex-1 flex flex-col items-center justify-center">
        <h1 class="headline text-5xl md:text-6xl text-center mb-4">California Towhee</h1>
        <p class="body-text text-light-gray text-lg mb-12 max-w-2xl text-center">
            Listen to the call, then try to mimic it!
        </p>
        
        <AudioPlayer audioPath="/songs/california_towhee_song.mp3" />
    </div>
</div>
