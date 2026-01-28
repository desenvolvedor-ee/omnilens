
/**
 * Serviço para processamento em servidor (Cenário 2)
 * Permite lidar com arquivos gigantes (2GB+) sem travar o navegador do telefone.
 */

export const processOnServer = async (file: File, apiKey: string): Promise<any> => {
  // Nota: Este é um endpoint placeholder. Para funcionar 100%, 
  // você precisaria de um backend (ex: Vercel Serverless Function ou Node.js)
  const SERVER_ENDPOINT = '/api/process-large-file';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('apiKey', apiKey);

  try {
    const response = await fetch(SERVER_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("SERVER_ENDPOINT_NOT_CONFIGURED");
      }
      throw new Error('Falha no processamento remoto');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro no processamento via servidor:', error);
    throw error;
  }
};
