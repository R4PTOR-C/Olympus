import { useEffect, useState } from "react";

function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {

        const handler = (e) => {

            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);

        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const installApp = async () => {

        if (!deferredPrompt) {
            console.warn("[PWA] deferredPrompt é null");
            return;
        }

        deferredPrompt.prompt();

        await deferredPrompt.userChoice;

        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, installApp };
}

export default usePWAInstall;
