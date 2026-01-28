
export const getFileCategory = (mimeType: string, filename: string): any => {
  if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(filename)) return 'video';
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(filename)) return 'audio';
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return 'image';
  if (mimeType === 'application/pdf' || /\.(pdf|txt|md|docx)$/i.test(filename)) return 'document';
  return 'unknown';
};

export const extractAllFromZip = (zipFile: File, onProgress?: (p: number) => void): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    // Usando URL de worker compatível com Vite
    const worker = new Worker(new URL('./zipWorker.ts', import.meta.url), { type: 'module' });
    
    worker.onmessage = (e) => {
      const { type, progress, files, error } = e.data;
      
      if (type === 'PROGRESS' && onProgress) {
        onProgress(progress);
      } else if (type === 'SUCCESS') {
        const resultFiles = files.map((f: any) => new File([f.blob], f.name, { type: f.type }));
        worker.terminate();
        resolve(resultFiles);
      } else if (type === 'ERROR') {
        worker.terminate();
        reject(new Error(error));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({ zipFile });
  });
};
