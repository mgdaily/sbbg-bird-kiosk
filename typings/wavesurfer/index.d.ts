declare module "wavesurfer" {
  interface WaveSurferOptions {
    container: string | HTMLElement;
    waveColor?: string;
    progressColor?: string;
    url?: string;
    media?: MediaStream;
  }

  export interface WaveSurferInstance {
    load(url: string | Blob): void;
    play(): Promise<void>;
    stop(): void;
    pause(): void;
    on(event: "finish" | "ready", callback: () => void): void;
    off(event: "finish" | "ready", callback: () => void): void;
    destroy(): void;
    getDuration(): number;
  }

  export interface MicrophonePlugin {
    start(): Promise<void>;
    stop(): void;
    on(
      event: "deviceReady" | "deviceError",
      callback: (arg?: any) => void
    ): void;
  }

  class WaveSurfer {
    static create(options: WaveSurferOptions): WaveSurferInstance;
    static registerPlugin(plugin: any): any;
    static Microphone?: {
      create(): MicrophonePlugin;
    };
  }

  export default WaveSurfer;
}
