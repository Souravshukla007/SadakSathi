import { CapacitorConfig } from '@capacitor/cli';

// The Capacitor CLI does not read .env on its own.
try { process.loadEnvFile(); } catch { /* no .env file: fall back to the bundled webDir */ }

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.sadaksathi.app',
  appName: 'SadakSathi',
  webDir: 'public',
  ...(serverUrl ? { server: { url: serverUrl, cleartext: serverUrl.startsWith('http://') } } : {}),
};

export default config;
