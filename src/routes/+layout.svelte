<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { get } from "svelte/store";

  let { children } = $props();

  const IDLE_TIMEOUT_MS = 120000; // 120 seconds
  let lastActivityTime = $state<number>(Date.now());
  let idleCheckInterval: ReturnType<typeof setInterval> | null = null;

  function updateActivity() {
    lastActivityTime = Date.now();
  }

  function checkIdleTimeout() {
    const timeSinceLastActivity = Date.now() - lastActivityTime;
    if (timeSinceLastActivity >= IDLE_TIMEOUT_MS) {
      // Only navigate if not already on homepage
      const currentPage = get(page);
      if (currentPage.url.pathname !== "/") {
        goto("/");
      }
    }
  }

  onMount(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Initialize last activity time
    lastActivityTime = Date.now();

    // Set up event listeners for user activity
    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("touchstart", updateActivity);

    // Check for idle timeout every second
    idleCheckInterval = setInterval(checkIdleTimeout, 1000);
  });

  onDestroy(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Remove event listeners
    window.removeEventListener("mousemove", updateActivity);
    window.removeEventListener("click", updateActivity);
    window.removeEventListener("keydown", updateActivity);
    window.removeEventListener("touchstart", updateActivity);

    // Clear interval
    if (idleCheckInterval) {
      clearInterval(idleCheckInterval);
      idleCheckInterval = null;
    }
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
