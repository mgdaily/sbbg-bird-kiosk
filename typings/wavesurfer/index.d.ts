declare module 'wavesurfer' {
    interface WaveSurferOptions {
        container: string | HTMLElement;
        waveColor?: string;
        progressColor?: string;
        url?: string;
    }

    export interface WaveSurferInstance {
        load(url: string): void;
        play(): void;
        stop(): void;
        pause(): void;
    }

    class WaveSurfer {
        static create(options: WaveSurferOptions): WaveSurferInstance;
    }

    export default WaveSurfer;
}

