import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ecole.futur",
  appName: "Ecole Futur Gestion",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "capacitor",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1E3A8A",
      showSpinner: true,
      spinnerColor: "#FFFFFF",
    },
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    BarcodeScanner: {
      permissions: {
        android: ["CAMERA"],
        ios: ["camera"],
      },
    },
    Geolocation: {
      permissions: {
        android: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
        ios: ["location"],
      },
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "always",
    scheme: "EcoleFutur",
  },
};

export default config;