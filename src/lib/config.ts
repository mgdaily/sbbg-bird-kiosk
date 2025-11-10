export interface BirdMetadata {
  name: string;
  imagePath: string;
  songPath: string;
  callPath: string;
  callText?: string;
  songText?: string;
}

export interface BirdConfig {
  [key: string]: BirdMetadata;
}

export const config = {
  // Mapping of bird state names to song file names
  birds: {
    "white-crowned-sparrow": {
      name: "White-Crowned Sparrow",
      imagePath: "/images/WCSP_CROPPED.jpg",
      songPath: "/audio/WCSP_Song_ELINGS-CTRL_20250316_105000_3.mp3",
      callPath: "/audio/WCSP_Call_ELINGS-CTRL_20250316_105000(shortened).mp3",
    },
    "common-yellowthroat": {
      name: "Common Yellowthroat",
      imagePath: "/images/COYE_CROPPED.jpg",
      songPath: "/audio/COYE_Song_ELINGS-CTRL_20250409_060000.mp3",
      callPath: "/audio/COYE_Call_ELINGS-CTRL_20250409_060000_denoised.mp3",
    },
    "lesser-goldfinch": {
      name: "Lesser Goldfinch",
      imagePath: "/images/LEGO_CROPPED.jpg",
      songPath: "/audio/LEGO_Song_ELINGS_202402_085200.mp3(Shortened).mp3",
      callPath: "/audio/LEGO_Call_ELINGS_202402_085200(Shortened).mp3",
    },
    wrentit: {
      name: "Wrentit",
      imagePath: "/images/WREN_CROPPED.jpg",
      songPath: "/audio/WREN_Song_Male_ELINGS-CTRL_20250325_072000.mp3",
      callPath: "/audio/WREN_Song_Female_ELINGS_20241205_082000.mp3",
      callText: "Female Song",
      songText: "Male Song",
    },
    "california-towhee": {
      name: "California Towhee",
      imagePath: "/images/CALT_CROPPED.jpg",
      songPath: "/audio/CALT_Duet_ELINGS-CTRL_20250507_181000.mp3",
      callPath: "/audio/CALT_Call_ELINGS-CTRL_20250507_181000(Shortened).mp3",
    },
  } as BirdConfig,
};
