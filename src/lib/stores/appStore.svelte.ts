import { config } from "$lib/config";

// Define the AppState interface
export interface AppState {
  selectedBird: {
    // Key of the bird in the config
    key: string;
  };
  mimicPhase: "idle" | "playing" | "countdown" | "recording" | "recorded";
}

export const appState: AppState = $state<AppState>({
  selectedBird: {
    key: "",
  },
  mimicPhase: "idle",
});

export function getMimicPhase() {
  return appState.mimicPhase;
}

export function setMimicPhase(
  phase: "idle" | "playing" | "countdown" | "recording" | "recorded"
) {
  appState.mimicPhase = phase;
}

export function setSelectedBird(key: string) {
  appState.selectedBird.key = key;
}

export function getSelectedBirdMetadata() {
  if (appState.selectedBird.key === "") {
    return null;
  }
  return config.birds[appState.selectedBird.key];
}

export function getSelectedAudioPath(audioType: "call" | "song" | "") {
  if (audioType === "") {
    return "";
  }
  const metadata = getSelectedBirdMetadata();
  if (metadata === null) {
    return "";
  }
  return audioType === "call" ? metadata.callPath : metadata.songPath;
}
