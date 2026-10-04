import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gabriel.musica",
  appName: "Música",
  webDir: "dist",
  ios: {
    contentInset: "never",
    allowsLinkPreview: false,
    preferredContentMode: "mobile",
  },
};

export default config;
