import { useEffect, useState } from 'react';
import logoImg from '../assets/ApnaQazi_Logo_v1.png';

const PRELOADER_HEARTBEAT_MS = 2000;
const PRELOADER_FADE_OUT_MS = 450;
const PRELOADER_FADE_START_MS = 4500;

export default function Preloader() {
  const [phase, setPhase] = useState('loading'); // loading | fading | done
  const [isSpinActive, setIsSpinActive] = useState(false);

  useEffect(() => {
    // Disable scrolling and prevent layout shift while preloader is visible.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const tHeartbeatStop = window.setTimeout(() => {
      setIsSpinActive(true);
    }, PRELOADER_HEARTBEAT_MS);

    const tFadeOutStart = window.setTimeout(() => {
      setPhase('fading');
    }, PRELOADER_FADE_START_MS);

    const tDone = window.setTimeout(() => {
      setPhase('done');
    }, PRELOADER_FADE_START_MS + PRELOADER_FADE_OUT_MS);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(tHeartbeatStop);
      window.clearTimeout(tFadeOutStart);
      window.clearTimeout(tDone);
    };
  }, []);

  if (phase === 'done') return null;

  const isFading = phase === 'fading';

  return (
    <div
      aria-hidden="true"
      className={
        'fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity duration-500 ' +
        (isFading ? 'opacity-0 pointer-events-none' : 'opacity-100')
      }
    >
      <img
        src={logoImg}
        alt="Apna Qazi"
        className={
          'h-[110px] w-[110px] sm:h-[140px] sm:w-[140px] md:h-[180px] md:w-[180px] object-contain ' +
          (isSpinActive ? 'animate-preloader-spin' : 'animate-preloader-heartbeat')
        }
        draggable={false}
      />
    </div>
  );
}
