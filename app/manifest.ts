import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Date With Cục Vàng",
    short_name: "Cục Vàng",
    description: "Lên kế hoạch hẹn hò cùng người thương 💕",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf2f8",
    theme_color: "#ec4899",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
