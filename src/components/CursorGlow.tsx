'use client';

import { useEffect, useState, useRef } from 'react';

export default function CursorGlow() {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      setIsMoving(true);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // Cursor is considered stationary after 400ms without movement
      idleTimerRef.current = setTimeout(() => {
        setIsMoving(false);
      }, 400);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsMoving(false);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute w-[260px] h-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          background: 'radial-gradient(circle, rgba(6,182,212,0.65) 0%, rgba(59,130,246,0.25) 50%, transparent 70%)',
          opacity: isMoving ? 0.18 : 0,
          transition: isMoving
            ? 'opacity 1400ms ease-out, transform 75ms ease-out'
            : 'opacity 4200ms ease-out, transform 75ms ease-out',
        }}
      />
    </div>
  );
}
