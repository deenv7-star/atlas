import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'il.co.atlas.app',
  appName: 'ATLAS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
