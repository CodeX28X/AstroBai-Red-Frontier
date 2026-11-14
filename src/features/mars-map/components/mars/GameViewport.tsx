import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

/** Uniform 1280x720 desktop canvas; mobile reflows readable controls beneath the map. */
export function GameViewport({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1280));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="game-surround"><div ref={frame} className="game-frame" style={{ '--game-scale': scale } as CSSProperties}>{children}</div></div>;
}
