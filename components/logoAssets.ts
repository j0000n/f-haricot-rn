export type LogoAsset = {
  id: string;
  label: string;
  path: string;
  source: ReturnType<typeof require>;
};

// Available logo assets from the assets folder
export const AVAILABLE_LOGOS: LogoAsset[] = [
  {
    id: "sunrise",
    label: "Sunrise",
    path: "@/assets/images/sunrise-logo.svg",
    source: require("@/assets/images/sunrise-logo.svg"),
  },
  {
    id: "midnight",
    label: "Midnight",
    path: "@/assets/images/midnight-logo.svg",
    source: require("@/assets/images/midnight-logo.svg"),
  },
  {
    id: "haricot",
    label: "Haricot",
    path: "@/assets/images/haricot-logo.svg",
    source: require("@/assets/images/haricot-logo.svg"),
  },
  {
    id: "logo",
    label: "Logo",
    path: "@/assets/images/logo.svg",
    source: require("@/assets/images/logo.svg"),
  },
  {
    id: "blackMetal",
    label: "Black Metal",
    path: "@/assets/images/black-metal-logo.png",
    source: require("@/assets/images/black-metal-logo.png"),
  },
  {
    id: "blackMetalSvg",
    label: "Black Metal (SVG)",
    path: "@/assets/images/black-metal.svg",
    source: require("@/assets/images/black-metal.svg"),
  },
  {
    id: "1950s",
    label: "1950s",
    path: "@/assets/images/1950s.svg",
    source: require("@/assets/images/1950s.svg"),
  },
  {
    id: "1960s",
    label: "1960s",
    path: "@/assets/images/1960s.svg",
    source: require("@/assets/images/1960s.svg"),
  },
  {
    id: "1990s",
    label: "1990s",
    path: "@/assets/images/1990s.svg",
    source: require("@/assets/images/1990s.svg"),
  },
];
