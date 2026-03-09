import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type VisualizerProps = {
  src: string;
};

export const PDFVisualizer: React.FC<VisualizerProps> = ({ src }) => {
  const [numPages, setNumPages] = useState<number>();
  const [scale, setScale] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const resizeHandler = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const pageWidth = 612;
      setScale(containerWidth / pageWidth);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages);
    resizeHandler();
  };

  useEffect(() => {
    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <Document
        file={src}
        onLoadSuccess={onDocumentLoadSuccess}
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
