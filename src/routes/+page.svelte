<script lang="ts">
  import { goto } from "$app/navigation";
  import { setSelectedBird } from "$lib/stores/appStore.svelte";
  import { config } from "$lib/config";

  function handleBirdClick(key: string) {
    setSelectedBird(key);
    goto("/mimic");
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="pt-6 px-8">
    <div class="flex items-center gap-3 mb-2">
      <div>
        <img
          src="/images/SBBG_LOGO.svg"
          alt="Santa Barbara Botanic Garden"
          class="sbbg-logo"
        />
      </div>
    </div>
    <hr class="border-t border-white opacity-30" />
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col items-center justify-center px-8 py-12">
    <!-- Main Title -->
    <h1 class="serif-title text-white text-6xl md:text-7xl text-center mb-6">
      Can You Sing Like a Bird?
    </h1>

    <!-- Subtitle -->
    <p
      class="text-[var(--light-gray)] sans-serif text-lg md:text-xl text-center mb-16 max-w-2xl"
    >
      How close can your call come to the real thing? Listen. Imitate. Compare.
    </p>

    <!-- Bird Selection -->
    <div class="flex flex-wrap justify-center gap-8 mb-16">
      {#each Object.keys(config.birds) as key}
        <button
          onclick={() => handleBirdClick(key)}
          class="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105"
        >
          <div
            class="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 border-2 border-white/30 mb-4 overflow-hidden group-hover:border-white/60 transition-colors relative"
          >
            <img
              src={config.birds[key].imagePath}
              alt={config.birds[key].name}
              class="w-full h-full object-cover object-center rounded-full"
            />
          </div>
          <span class="text-white sans-serif text-sm md:text-base text-center"
            >{config.birds[key].name}</span
          >
        </button>
      {/each}
    </div>
  </main>

  <!-- Footer Line -->
  <footer class="pb-6 px-8">
    <hr class="border-t border-white opacity-30" />
  </footer>
</div>

<style>
  .sbbg-logo {
    scale: 0.8;
    filter: brightness(0) invert(1);
  }
</style>
