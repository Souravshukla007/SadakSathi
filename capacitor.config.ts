import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sadaksathi.app',
  appName: 'SadakSathi',
  webDir: 'public',
  server: {
    url: 'https://sadak-sathi-chi.vercel.app/',
    cleartext: true
  }
};

export default config;
