import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipPortalProps {
  text: string;
  children: React.ReactNode;
  ellipsis?: boolean;
}

export const TooltipPortal: React.FC<TooltipPortalProps> = ({
  text,
  children,
  ellipsis = true,
}) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!show) return;
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [show]);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={
          ellipsis
            ? {
                cursor: 'pointer',
                display: 'inline-block',
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
              }
            : {
                cursor: 'pointer',
                display: 'inline-block',
                verticalAlign: 'middle',
              }
        }
      >
        {children}
      </span>
      {show &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: coords.x - 30,
              top: coords.y + 10,
              background: 'var(--background-disabled, #DBDCE9)',
              color: 'var(--ink-weak-on, #5d607e)',
              padding: '8px 24px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 400,
              whiteSpace: ellipsis ? 'pre' : 'normal',
              zIndex: 9999,
              boxShadow: '0px 1px 2px 0px rgba(227, 227, 233, 0.25)',
              pointerEvents: 'none',
              maxWidth: 400,
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
};
