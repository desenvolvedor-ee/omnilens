import JSZip from 'jszip';

// Helper para categorização dentro do worker
const getFileCategory = (mimeType: string, filename: string): string => {
  if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(filename)) return 'video';
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(filename)) return 'audio';
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return 'image';
  if (mimeType === 'application/pdf' || /\.(pdf|txt|md|docx)$/i.test(filename)) return 'document';
  return 'unknown';
};

self.onmessage = async (e) => {
  const { zipFile } = e.data;
  const zip = new JSZip();
  
  try {
    const content = await zip.loadAsync(zipFile);
    const totalFiles = Object.keys(content.files).filter(k => !content.files[k].dir).length;
    let processed = 0;

    const extractedFiles = [];

    for (const filename of Object.keys(content.files)) {
      const file = content.files[filename];
      if (!file.dir) {
        const blob = await file.async('blob');
        const category = getFileCategory(blob.type, filename);
        
        if (category !== 'unknown') {
          extractedFiles.push({
            name: filename,
            type: blob.type,
            blob: blob
          });
        }
        
        processed++;
        self.postMessage({ type: 'PROGRESS', progress: Math.round((processed / totalFiles) * 100) });
      }
    }

    self.postMessage({ type: 'SUCCESS', files: extractedFiles });
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};
