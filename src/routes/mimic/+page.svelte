<script lang="ts">
  import {
    getSelectedBirdMetadata,
    getSelectedAudioPath,
    getMimicPhase,
    setMimicPhase,
  } from "$lib/stores/appStore.svelte";
  import AudioPlayer from "$lib/components/audioPlayer.svelte";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  const metadata = $derived(getSelectedBirdMetadata());
  const callText = $derived(metadata?.callText || "Call");
  const songText = $derived(metadata?.songText || "Song");

  let showAudioPlayer = $state(false);
  let buttonsDisabled = $state(false);
  let audioType = $state<("call" | "song") | "">("");
  // show the try again button once the user has recorded their audio
  let showTryAgainButton = $derived(getMimicPhase() === "recorded");

  onMount(() => {
    if (!metadata) {
      goto("/");
    }
  });

  function handleAudioTypeSelect(type: "call" | "song") {
    audioType = type;
    showAudioPlayer = true; // Initialize player on button click
    buttonsDisabled = true;
  }

  function resetPageState() {
    audioType = "";
    showAudioPlayer = false;
    buttonsDisabled = false;
    setMimicPhase("idle");
  }
</script>

<div class="min-h-screen flex flex-col p-8">
  <!-- Back Button -->
  <a
    href="/"
    onclick={(e) => {
      e.preventDefault();
      goto("/");
    }}
    class="mb-8 text-white/80 hover:text-white transition-colors"
  >
    ← Back to Birds
  </a>

  <!-- Bird Page Content -->
  <div class="flex-1 flex flex-col items-center justify-center">
    <h1 class="headline text-5xl md:text-6xl text-center mb-4">
      {metadata?.name || "Bird"}
    </h1>
    <p class="body-text text-light-gray text-lg mb-8 max-w-2xl text-center">
      Choose what you'd like to mimic, then listen and try to replicate it!
    </p>

    <!-- Audio Type Selection -->
    <div class="flex gap-4 mb-8">
      <button
        disabled={buttonsDisabled || getMimicPhase() !== "idle"}
        onclick={() => handleAudioTypeSelect("call")}
        class="px-6 py-3 rounded transition-colors {audioType === 'call'
          ? 'bg-white/30 text-white border-2 border-white'
          : 'bg-white/10 text-white/70 border-2 border-white/30 hover:bg-white/20'}"
      >
        {callText}
      </button>
      <button
        disabled={buttonsDisabled || getMimicPhase() !== "idle"}
        onclick={() => handleAudioTypeSelect("song")}
        class="px-6 py-3 rounded transition-colors {audioType === 'song'
          ? 'bg-white/30 text-white border-2 border-white'
          : 'bg-white/10 text-white/70 border-2 border-white/30 hover:bg-white/20'}"
      >
        {songText}
      </button>
    </div>

    {#if showAudioPlayer}
      <AudioPlayer audioPath={getSelectedAudioPath(audioType)} />
    {/if}

    {#if showTryAgainButton}
      <button
        onclick={() => resetPageState()}
        class="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
      >
        Try Again
      </button>
    {/if}
  </div>
</div>
