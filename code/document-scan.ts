export type ScanResult = { text: string; engine: string; confidence: number | null };
type Progress = (message: string) => void;

// Only called by the client. Files never leave the browser in this pipeline.
export async function scanDocument(file: File, progress: Progress, signal: AbortSignal): Promise<ScanResult> {
  const check = () => { if (signal.aborted) throw new DOMException('Scan cancelled', 'AbortError'); };
  let worker: import('tesseract.js').Worker | undefined;
  const stop = () => { void worker?.terminate(); };
  signal.addEventListener('abort', stop, { once: true });
  async function recognize(image: File | HTMLCanvasElement) {
    check();
    if (!worker) {
      const { createWorker } = await import('tesseract.js');
      check();
      worker = await createWorker('eng', 1, {
        workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr',
        gzip: false, workerBlobURL: false,
        logger: m => { if (!signal.aborted) progress(m.status === 'recognizing text' ? `Reading text · ${Math.round(m.progress * 100)}%` : 'Loading local OCR model…'); },
      });
      check();
    }
    return (await worker.recognize(image)).data;
  }
  try {
    check();
    if (file.type.startsWith('image/')) {
      const bitmap = await createImageBitmap(file);
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();
      if (pixels > 12000000) throw new Error('This image is too large to scan. Resize it below 12 megapixels or paste its text.');
      const result = await recognize(file);
      return { text: result.text, confidence: result.confidence, engine: 'Local AI OCR · Tesseract LSTM' };
    }
    if (file.type === 'application/pdf') {
      progress('Opening PDF locally…');
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = '/ocr/pdf.worker.min.mjs';
      const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
      const cancelPdf = () => { void task.destroy(); };
      signal.addEventListener('abort', cancelPdf, { once: true });
      try {
        const pdf = await task.promise;
        if (pdf.numPages > 5) throw new Error('Please choose a PDF with 5 pages or fewer.');
        const pages: string[] = []; const scores: number[] = []; let usedOcr = false;
        for (let i = 1; i <= pdf.numPages; i++) {
          check(); progress(`Reading page ${i} of ${pdf.numPages}…`);
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          let text = content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join('');
          if (text.trim().length < 30) {
            usedOcr = true;
            const original = page.getViewport({ scale: 1 });
            const scale = Math.min(2, Math.sqrt(4000000 / (original.width * original.height)));
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
            await page.render({ canvas, viewport }).promise;
            const result = await recognize(canvas); text = result.text; scores.push(result.confidence);
            canvas.width = canvas.height = 0;
          }
          pages.push(text); page.cleanup();
        }
        return { text: pages.join('\n\n'), confidence: scores.length ? scores.reduce((a,b) => a+b,0)/scores.length : null, engine: usedOcr ? 'Local AI OCR · scanned PDF' : 'Local PDF text · no AI used' };
      } finally { signal.removeEventListener('abort', cancelPdf); await task.destroy(); }
    }
    return { text: await file.text(), engine: 'Local text file · no AI used', confidence: null };
  } finally { signal.removeEventListener('abort', stop); await worker?.terminate(); }
}
