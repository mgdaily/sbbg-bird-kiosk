export interface BirdMetadata {
  name: string;
  imagePath: string;
  songPath: string;
  callPath: string;
}

export interface BirdConfig {
  [key: string]: BirdMetadata;
}

export const config = {
  // Mapping of bird state names to song file names
  birds: {
    "common-yellowthroat": {
      name: "Common Yellowthroat",
      imagePath: "/images/common-yellowthroat.jpg",
      songPath: "/audio/songs/common-yellowthroat-song.mp3",
      callPath: "/audio/calls/common-yellowthroat-call.mp3",
    },
    "loggerhead-shrike": {
      name: "Loggerhead Shrike",
      imagePath: "/images/loggerhead-shrike.jpg",
      songPath: "/audio/songs/loggerhead-shrike-song.mp3",
      callPath: "/audio/calls/loggerhead-shrike-call.mp3",
    },
    "lesser-goldfinch": {
      name: "Lesser Goldfinch",
      imagePath: "/images/lesser-goldfinch.jpg",
      songPath: "/audio/songs/lesser-goldfinch-song.mp3",
      callPath: "/audio/calls/lesser-goldfinch-call.mp3",
    },
    "allens-hummingbird": {
      name: "Allen's Hummingbird",
      imagePath: "/images/allens-hummingbird.jpg",
      songPath: "/audio/songs/allens-hummingbird-song.mp3",
      callPath: "/audio/calls/allens-hummingbird-call.mp3",
    },
    "california-towhee": {
      name: "California Towhee",
      imagePath: "/images/california-towhee.jpg",
      songPath: "/audio/songs/california-towhee-song.mp3",
      callPath: "/audio/calls/california-towhee-call.mp3",
    },
  } as BirdConfig,
};
