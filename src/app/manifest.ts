import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zynergy Hub",
    short_name: "Zynergy Hub",
    description: "Aplikasi internal tim Zynergy",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFCFE",
    theme_color: "#0B1B3F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
