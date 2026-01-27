
import JSZip from 'jszip';

export const getFileCategory = (mimeType: string, filename: string): any => {
  if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(filename)) return 'video';
  if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(filename)) return 'audio';
  if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) return 'image';
  if (mimeType === 'application/pdf' || /\.(pdf|txt|md|docx)$/i.test(filename)) return 'document';
  return 'unknown';
};

export const extractAllFromZip = async (zipFile: File): Promise<File[]> => {
  const zip = new JSZip();
  const content = await zip.loadAsync(zipFile);
  const extractedFiles: File[] = [];

  const promises = Object.keys(content.files).map(async (filename) => {
    const file = content.files[filename];
    if (!file.dir) {
      const blob = await file.async('blob');
      const category = getFileCategory(blob.type, filename);
      if (category !== 'unknown') {
        extractedFiles.push(new File([blob], filename, { type: blob.type }));
      }
    }
  });

  await Promise.all(promises);
  return extractedFiles;
};
