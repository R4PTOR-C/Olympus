import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.raptorc.olympus',
  appName: 'Olympus',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
};

export default config;
