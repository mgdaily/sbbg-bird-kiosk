<script lang="ts">
  let { label }: { label: string } = $props();
  let { onPress }: { onPress: () => void } = $props();
  let { emoji = '🐦' }: { emoji?: string } = $props();
  let { color = '#22c55e' }: { color?: string } = $props();
</script>

<style>
  .big {
    -webkit-tap-highlight-color: transparent;
    background: var(--btn-color);
    color: #041014;
    border: none;
    border-radius: 28px;
    padding: clamp(18px, 4vw, 28px) clamp(22px, 5vw, 42px);
    font-size: clamp(20px, 4.5vw, 34px);
    font-weight: 900;
    box-shadow: 0 18px 40px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.25) inset;
    display: inline-flex;
    align-items: center;
    gap: clamp(10px, 2vw, 16px);
    user-select: none;
    touch-action: manipulation;
  }
  .big:active { transform: translateY(1px); }
  .emoji { font-size: 1.2em; }
</style>

<button class="big" style={`--btn-color:${color}`} on:click={() => onPress()}>
  <span class="emoji">{emoji}</span>
  <span>{label}</span>
</button>
