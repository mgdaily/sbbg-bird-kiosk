<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { analyser }: { analyser: AnalyserNode | null } = $props();
  let { label = '' }: { label?: string } = $props();
  let { lineColor = '#17a2b8' }: { lineColor?: string } = $props();
  let { bgColor = '#0b1720' }: { bgColor?: string } = $props();

  let canvas: HTMLCanvasElement | null = null;
  let animationFrameId: number | null = null;
  let resizeObserver: ResizeObserver | null = null;

  let dataArray: Uint8Array | null = null;

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const logicalWidth = canvas.clientWidth || 600;
    const logicalHeight = canvas.clientHeight || 160;

    // Ensure the canvas backing store matches CSS size for crisp lines
    if (canvas.width !== Math.floor(logicalWidth * devicePixelRatio) || canvas.height !== Math.floor(logicalHeight * devicePixelRatio)) {
      canvas.width = Math.floor(logicalWidth * devicePixelRatio);
      canvas.height = Math.floor(logicalHeight * devicePixelRatio);
    }

    ctx.save();
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Grid baseline
    ctx.strokeStyle = '#183142';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, logicalHeight / 2);
    ctx.lineTo(logicalWidth, logicalHeight / 2);
    ctx.stroke();

    // Label
    if (label) {
      ctx.fillStyle = '#9fb3c8';
      ctx.font = '600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.fillText(label, 12, 18);
    }

    if (analyser) {
      if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteTimeDomainData(dataArray);

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = logicalWidth / dataArray.length;
      let x = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        const v = dataArray[i] / 128.0; // [0,255] -> [0,2]
        const y = (v * logicalHeight) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(logicalWidth, logicalHeight / 2);
      ctx.stroke();
    } else {
      // No analyser: draw idle text
      ctx.fillStyle = '#6b7f93';
      ctx.font = '500 14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.fillText('Waiting for audio...', 12, logicalHeight - 12);
    }

    ctx.restore();

    animationFrameId = window.requestAnimationFrame(draw);
  }

  onMount(() => {
    animationFrameId = window.requestAnimationFrame(draw);

    resizeObserver = new ResizeObserver(() => {
      // Trigger a redraw on resize
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(draw);
    });
    if (canvas) resizeObserver.observe(canvas);
  });

  onDestroy(() => {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    if (resizeObserver && canvas) resizeObserver.unobserve(canvas);
  });
</script>

<style>
  .wrapper {
    width: 100%;
    height: 180px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset, 0 8px 24px rgba(0,0,0,0.25);
    background: #0b1720;
  }
  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>

<div class="wrapper">
  <canvas bind:this={canvas} aria-label={label}></canvas>
</div>
