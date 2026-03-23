import { useEffect, useState } from 'react';

export function useSplashScreen(): {
  isReady: boolean;
} {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      
      const splashScreen = document.getElementById('splash-screen');
      if (splashScreen) {
        splashScreen.classList.add('splash-fade-out');
        setTimeout(() => {
          splashScreen.style.display = 'none';
        }, 500);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return { isReady };
}

export function SplashScreen({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export default SplashScreen;