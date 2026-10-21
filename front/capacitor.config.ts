import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.fenrystech.atlanteon',
  appName: 'Atlanteon',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SystemBars: {
      // Navbar, barra inferior, login e splash são escuros/azuis nos dois temas:
      // ícones da barra de status sempre claros
      style: 'DARK',
    },
  },
};

export default config;
