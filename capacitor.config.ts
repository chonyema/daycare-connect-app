import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daycareconnect.app',
  appName: 'Daycare Connect',
  webDir: '.next',
  server: {
    url: 'https://daycare-connect-md3gey76p-chimere-onyemas-projects.vercel.app',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3B82F6",
      showSpinner: false
    },
    StatusBar: {
      style: 'DARK'
    }
  }
};

export default config;
