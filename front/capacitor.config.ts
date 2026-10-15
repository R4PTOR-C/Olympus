import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.fenrystech.atlanteon',
  appName: 'Atlanteon',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
};

export default config;
