declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
  export const WorkerMessageHandler: {
    setup: (port: unknown, port2?: unknown) => void;
  };
}
