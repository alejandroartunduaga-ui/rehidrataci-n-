declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement | null;
      constraints: {
        width: { ideal: number };
        height: { ideal: number };
        facingMode: { ideal: string };
        aspectRatio?: { ideal: number };
      };
    };
    locator: {
      patchSize: string;
      halfSample: boolean;
    };
    numOfWorkers: number;
    frequency?: number;
    decoder: {
      readers: string[];
    };
    locate: boolean;
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    line?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    box?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boxes?: any[];
  }

  interface QuaggaCanvas {
    ctx: {
      overlay: CanvasRenderingContext2D;
    };
    dom: {
      overlay: HTMLCanvasElement;
    };
  }

  interface QuaggaImageDebug {
    drawPath: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      path: any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pos: any,
      ctx: CanvasRenderingContext2D,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style: any
    ) => void;
  }

  interface QuaggaStatic {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init: (config: QuaggaConfig, callback: (err: any) => void) => void;
    start: () => void;
    stop: () => void;
    onDetected: (callback: (result: QuaggaResult) => void) => void;
    offDetected: () => void;
    onProcessed: (callback: (result: QuaggaResult | null) => void) => void;
    offProcessed: () => void;
    canvas: QuaggaCanvas;
    ImageDebug: QuaggaImageDebug;
  }

  const Quagga: QuaggaStatic;
  export default Quagga;
}
