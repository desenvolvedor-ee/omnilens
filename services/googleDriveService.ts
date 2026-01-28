
/**
 * Serviço para integração com Google Drive
 */

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private currentClientId: string | null = null;

  constructor() {}

  /**
   * Inicializa o cliente com o ID fornecido pelo usuário
   */
  private async initGis(clientId: string): Promise<boolean> {
    if (this.tokenClient && this.currentClientId === clientId) return true;

    if (!(window as any).google?.accounts?.oauth2) {
      console.error('Google Identity Services não carregado.');
      return false;
    }

    try {
      this.currentClientId = clientId;
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            console.error('Erro OAuth:', resp);
            return;
          }
          this.accessToken = resp.access_token;
        },
      });
      return true;
    } catch (err) {
      console.error('Falha ao inicializar GIS:', err);
      return false;
    }
  }

  public async connect(clientId: string, onFileSelected: (file: File) => void): Promise<void> {
    const isReady = await this.initGis(clientId);
    
    if (!isReady) throw new Error("INIT_FAILED");

    if (this.accessToken) {
      this.createPicker(onFileSelected);
    } else {
      return new Promise((resolve, reject) => {
        this.tokenClient.callback = async (resp: any) => {
          if (resp.error) {
            reject(resp);
            return;
          }
          this.accessToken = resp.access_token;
          this.createPicker(onFileSelected);
          resolve();
        };
        // Tenta solicitar o token. Se falhar por origem não autorizada, o callback receberá o erro.
        try {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
          reject(e);
        }
      });
    }
  }

  private createPicker(onFileSelected: (file: File) => void) {
    const gapi = (window as any).gapi;
    if (!gapi) {
      console.error('GAPI not found');
      return;
    }

    // Certifica-se de que a biblioteca 'picker' está carregada
    gapi.load('picker', () => {
      try {
        const picker = new (window as any).google.picker.PickerBuilder()
          .addView((window as any).google.picker.ViewId.DOCS)
          .setOAuthToken(this.accessToken)
          .setDeveloperKey(process.env.API_KEY || '') // Usa a API KEY injetada
          .setCallback(async (data: any) => {
            if (data.action === (window as any).google.picker.Action.PICKED) {
              const fileData = data.docs[0];
              try {
                const file = await this.downloadFile(fileData.id, fileData.name, fileData.mimeType);
                onFileSelected(file);
              } catch (err) {
                console.error('Falha ao baixar do Drive:', err);
              }
            }
          })
          .build();
        picker.setVisible(true);
      } catch (err) {
        console.error('Erro ao construir Picker:', err);
      }
    });
  }

  private async downloadFile(fileId: string, fileName: string, mimeType: string, onProgress?: (p: number) => void): Promise<File> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }
    );

    if (!response.ok) {
      if (response.status === 401) this.accessToken = null;
      throw new Error('Download falhou');
    }

    // Tenta usar streaming para monitorar progresso e evitar picos de memória se o navegador suportar
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    if (!response.body || total === 0) {
      const blob = await response.blob();
      return new File([blob], fileName, { type: mimeType });
    }

    const reader = response.body.getReader();
    let loaded = 0;
    const chunks = [];

    while(true) {
      const {done, value} = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (onProgress) onProgress(Math.round((loaded / total) * 100));
    }

    const blob = new Blob(chunks, { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }
}

export const driveService = new GoogleDriveService();
