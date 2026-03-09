import { useRef, useEffect } from 'react';
import { BiaText } from '@entropy/index';
import style from './MapField.module.css';

interface IMapProps {
  position:
    | null
    | string
    | {
        lat: number;
        long: number;
      }
    | {
        button_copy: string;
        button_link: string[];
      };
}

export const MapField = ({ position }: IMapProps) => {
  const mapRef = useRef<HTMLElement>(null);

  useEffect(() => {
    async function createMap() {
      if (!mapRef.current) return;
    }

    createMap();
  }, [position]);

  const googleMapsUrl =
    position && typeof position === 'object'
      ? 'lat' in position && 'long' in position
        ? `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.long}`
        : '#'
      : '#';

  return (
    <div className={style.mapWrapper}>
      <a
        href={googleMapsUrl}
        target='_blank'
        rel='noopener noreferrer'
        className={style.button}
      >
        <BiaText
          token='heading-3'
          color='inverse'
        >
          Ver en google
        </BiaText>
      </a>
    </div>
  );
};
