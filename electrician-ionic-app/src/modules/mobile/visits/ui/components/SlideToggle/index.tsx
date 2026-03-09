import React, { useRef, useState, useEffect } from 'react';
import { BiaIcon, BiaText } from '@entropy/index';
import styles from './SlideToggle.module.css';

interface IslideToggleProps {
  id?: string;
  activityState: string;
  onCompleted?: () => void;
  slideData: { [key: string]: { iconName: string; label: string } };
  color?: string;
  disabled?: boolean;
}

export const SlideToggle = ({
  id,
  activityState,
  onCompleted,
  slideData,
  color = '--background-accent',
  disabled = false,
}: IslideToggleProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isAtEnd, setIsAtEnd] = useState<boolean>(false);
  const [sliderPercentage, setSliderPercentage] = useState<number>(0);

  const draggableRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const draggable = draggableRef.current;
    if (draggable) {
      setOffsetX(clientX - draggable.offsetLeft);
      draggable.style.transition = 'none';
    }
  };

  const resetDraggable = () => {
    setIsAtEnd(false);
    setOffsetX(0);
    setSliderPercentage(0);

    const draggable = draggableRef.current;
    if (draggable) {
      draggable.style.left = '0px';
      draggable.style.transition = 'left 0.3s ease';
    }
  };

  useEffect(() => {
    const dragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const draggable = draggableRef.current;
      const container = containerRef.current;

      if (draggable && container) {
        const newX = clientX - offsetX;
        const containerRect = container.getBoundingClientRect();
        const draggableWidth = draggable.offsetWidth;

        let limitedX = newX;

        if (newX < 0) limitedX = 0;
        if (newX + draggableWidth > containerRect.width) {
          limitedX = containerRect.width - draggableWidth;
        }

        draggable.style.left = `${limitedX}px`;

        const percentage =
          ((limitedX + draggableWidth / 2) / containerRect.width) * 100 -
          (20 / containerRect.width) * 100;
        setSliderPercentage(percentage);
      }
    };

    const endDrag = () => {
      if (!isDragging) return;

      const draggable = draggableRef.current;
      const container = containerRef.current;

      if (draggable && container) {
        const containerRect = container.getBoundingClientRect();
        const draggableRect = draggable.getBoundingClientRect();

        if (draggableRect.left >= containerRect.width - draggableRect.width) {
          setIsAtEnd(true);
          if (onCompleted) onCompleted();
        }

        resetDraggable();
      }
      setIsDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => dragMove(e);
    const handleTouchMove = (e: TouchEvent) => dragMove(e);
    const handleMouseUp = () => endDrag();
    const handleTouchEnd = () => endDrag();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, offsetX, onCompleted]);

  useEffect(() => {
    resetDraggable();
  }, [activityState]);

  return (
    <div
      id={id}
      data-testid={`${id}-wrapper`}
      className={styles.wrapper}
      style={{
        border: `1px solid var(${color})`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      // style={{ border: '1px solid var(--background-accent)' }}
    >
      <div
        className={styles.container}
        ref={containerRef}
      >
        <div className={styles.rightComponent}>
          <BiaText
            token='heading-3'
            color='strong'
          >
            {slideData[activityState]?.label}
          </BiaText>
        </div>

        <div
          className={styles.leftComponent}
          style={{
            clipPath: `polygon(0 0, calc(${sliderPercentage}% + 20px) 0, calc(${sliderPercentage}% + 20px) 100%, 0 100%)`,
            transition: isDragging ? 'none' : 'clip-path 0.3s ease',
            backgroundColor: `var(${color})`,
          }}
        >
          <BiaText
            token='heading-3'
            color='inverse'
          >
            {slideData[activityState]?.label}
          </BiaText>
        </div>

        <div
          data-testid={`${id}-draggable`}
          className={styles.draggable}
          ref={draggableRef}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          style={{
            left: isAtEnd ? 'calc(100% - 40px)' : '0px',
            transition: isDragging ? 'none' : 'left 0.3s ease',
            backgroundColor: `var(${color})`,
          }}
        >
          <BiaIcon
            id={`${id}-icon`}
            iconName={slideData[activityState]?.iconName}
            iconType='regular'
            color='inverse'
            size='1em'
          />
        </div>
      </div>
    </div>
  );
};
