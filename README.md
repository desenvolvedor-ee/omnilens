
# 💠 OmniLens Pro — Universal AI Intelligence
> **A fronteira final da análise multimodal. Engine de IA forense para vídeos, áudios e arquivos ZIP.**

O OmniLens Pro é um ecossistema de inteligência alimentado pelo **Gemini 2.5 Pro**. Ele permite processar volumes massivos de dados, realizar análises frame-a-frame de vídeos e extrair inteligência de documentos complexos com uma interface de elite.

---

## 🚀 NOVIDADES DA VERSÃO 2.5
- **Auto-Config Popup**: Se as chaves faltarem, o app abre as configurações automaticamente.
- **Cloudflare Turnstile**: Proteção nativa contra bots no frontend.
- **Terminal Logging**: Logs detalhados coloridos diretamente no console do desenvolvedor.
- **ZIP Deep Scan**: Descompressão e análise automática de arquivos .zip.

---

## 🛠️ CONFIGURAÇÃO DE AMBIENTE (ENV)
O OmniLens Pro agora suporta metadados de ambiente avançados. Configure no seu provedor de deploy:

| Variável | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `API_KEY` | `AIza...` | Chave Gemini (Obrigatória se não for Público). |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | ID OAuth para Google Drive. |
| `TURNSTILE_ENABLED` | `true` | Ativa o desafio de segurança da Cloudflare. |
| `CF_SITE_KEY` | `0x4AAAAAAA...` | Site Key do Cloudflare Turnstile. |
| `CF_SECRET_KEY` | `0x4AAAAAAA...` | Secret Key (usada em backend/proxy). |
| `API_PUBLIC_ACCESS` | `false` | Se `true`, não bloqueia análise por falta de key local. |
| `ENV_FILE` | `.env.production` | Nome do arquivo de config (Informativo). |
| `LOGS_FILE` | `terminal` | Destino dos logs (Default: `terminal`). |

---

## 🔐 SEGURANÇA & OAUTH
Para que o **Google Drive** funcione corretamente:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Adicione a URL do seu site em **Origens JavaScript Autorizadas**.
3. Certifique-se de que a **Google Drive API** e **Google Picker API** estão ativadas no projeto.

---

## 📋 COMO USAR OS LOGS
O OmniLens Pro imprime um fluxo de dados em tempo real. Para visualizar:
1. Abra o navegador.
2. Aperte `F12` ou `Ctrl+Shift+I`.
3. Vá na aba **Console**.
4. Procure pelos rótulos coloridos `[OmniLens SYSTEM]`, `[OmniLens INFO]`, etc.

---
## 📄 Licença
Distribuído sob a **Licença MIT**. Desenvolvido para máxima performance e estética.

*OmniLens Pro: See through the noise.*
