import { useEffect, useState } from 'react';

/** Presentation lifecycle only: stop decorative work when the browser hides the tab. */
export function useAmbientMotion(enabled: boolean) {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    update();
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return enabled && visible;
}
