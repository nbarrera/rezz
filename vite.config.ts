import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { solidStart } from "@solidjs/start/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    solidStart(),
    nitro(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Rezz",
        short_name: "Rezz",
        description: "Recipe & Meal Planner",
        theme_color: "#16a34a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
