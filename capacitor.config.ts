import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bloom.devotional",
  appName: "Bloom",
  // webDir is only used for local builds — we load from the live server
  webDir: "out",
  server: {
    // Point to your Vercel deployment URL.
    // Change this to your real URL before building for App Store.
    url: "https://bloom-app.vercel.app",
    cleartext: false,
    // Allow Capacitor native plugins to work over the server URL
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    // Allows the web view to appear behind the status bar
    backgroundColor: "#FFE8EE",
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FFE8EE",
      iosSpinnerStyle: "small",
      spinnerColor: "#F472A0",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "Default",
      backgroundColor: "#FFE8EE",
    },
  },
};

export default config;
