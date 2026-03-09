import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { isPlatform } from '@ionic/react';
import { BiaLoader } from '@entropy/index';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type BiaVisualizerProps = {
  src: string | ArrayBuffer;
  scaleViewer?: number;
};

export const BiaVisualizer: React.FC<BiaVisualizerProps> = ({
  src,
  scaleViewer,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  const isIOSDevice = isPlatform('ios');

  const resizeHandler = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const pageWidth = 612;
      if (scaleViewer) {
        setScale(1 * scaleViewer);
        setScale((containerWidth / pageWidth) * scaleViewer);
      } else {
        setScale(containerWidth / pageWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('resize', resizeHandler);
    resizeHandler();
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setTimeout(() => {
      setLoading(false);
    }, 5000);
    resizeHandler();
  };

  if (isIOSDevice && typeof src === 'string') {
    return (
      <iframe
        src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(src)}`}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          backgroundColor: '#fff',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      {loading && <BiaLoader />}
      <Document
        file={src}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadStart={() => setLoading(true)}
        onLoadError={() => {
          setLoading(false);
        }}
        loading={<BiaLoader />}
        scale={scale}
      >
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            scale={scale}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        ))}
      </Document>
    </div>
  );
};
