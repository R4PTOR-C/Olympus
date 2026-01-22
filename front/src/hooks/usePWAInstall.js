import { useEffect, useState } from "react";

function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        console.log("[PWA] Hook montado");

        const handler = (e) => {
            console.log("[PWA] beforeinstallprompt disparou", e);

            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);

            console.log("[PWA] App marcado como instalável");
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            console.log("[PWA] Hook desmontado");
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const installApp = async () => {
        console.log("[PWA] Clique no botão instalar");

        if (!deferredPrompt) {
            console.warn("[PWA] deferredPrompt é null");
            return;
        }

        deferredPrompt.prompt();
        console.log("[PWA] prompt() chamado");

        const { outcome } = await deferredPrompt.userChoice;
        console.log("[PWA] Resultado da escolha do usuário:", outcome);

        setDeferredPrompt(null);
        setIsInstallable(false);
        console.log("[PWA] Estado limpo após tentativa de instalação");
    };

    return { isInstallable, installApp };
}

export default usePWAInstall;
