
# 💠 OmniLens Pro — Universal AI Intelligence
> **A fronteira final da análise multimodal. Sinta o poder da IA forense em suas mãos.**

O OmniLens Pro não é apenas um app; é um motor de inteligência universal alimentado pelo **Gemini 2.5 Pro**. Ele disseca vídeos, áudios, documentos e imagens, entregando relatórios que antes levariam horas de trabalho humano em questão de segundos.

---

## 👨‍💻 O Arquiteto
Desenvolvido com excelência por **Desenvolver EE**.
- **Repositório Master**: [github.com/desenvolvedor-ee/omnilens](https://github.com/desenvolvedor-ee/omnilens)
- **Engine**: React 19 + Tailwind CSS + Google GenAI SDK

---

## 🚀 GUIA DE DEPLOY EXTRAVAGANTE (VERCEL EDITION)

A **Vercel** é o habitat natural do OmniLens Pro. Siga este ritual para alcançar a excelência em produção:

### 💎 Passo 1: O Berço de Ouro (GitHub)
1. Crie um novo repositório **Privado** ou **Público** no seu GitHub.
2. Faça o upload de todos os arquivos do projeto (incluindo a pasta `services`, `components` e o `index.html`).
3. Certifique-se de que a estrutura está limpa e o `index.html` está na raiz.

### ⚡ Passo 2: A Ascensão à Vercel
1. Acesse o [Painel da Vercel](https://vercel.com/new).
2. Importe o repositório que você acabou de criar.
3. No campo **Framework Preset**, selecione `Other` ou `Vite` (se estiver usando build pipeline). Como este projeto usa `index.html` com módulos ES6 nativos, a Vercel detectará automaticamente como um **Static Project**.

### 🔑 Passo 3: O Sopro de Vida (Variáveis de Ambiente)
Antes de clicar em "Deploy", abra a seção **Environment Variables**. Este é o coração do sistema:

| Chave | Valor | Importância |
| :--- | :--- | :--- |
| `API_KEY` | *Sua chave secreta do Gemini* | Ativa o cérebro da IA. |
| `GOOGLE_CLIENT_ID` | *Seu ID OAuth do Google* | Permite a conexão com o Drive. |
| `API_PUBLIC_ACCESS` | `true` | Libera o uso para usuários externos sem login Gemini. |

### 🛡️ Passo 4: O Protocolo de Segurança (Google Cloud)
Este é o passo onde a maioria falha. O Google Drive só falará com a Vercel se você autorizar:
1. Vá ao [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Edite seu **ID do Cliente OAuth 2.0**.
3. Em **Origens JavaScript Autorizadas**, adicione:
   - `http://localhost:3000` (Para testes locais)
   - `https://seu-projeto.vercel.app` (A URL que a Vercel te deu)
4. Em **URIs de Redirecionamento Autorizados**, adicione as mesmas URLs.
5. **Aguarde 5 minutos** (o cache do Google é real).

### 🏁 Passo 5: O Grande Final
Clique em **Deploy** na Vercel. Em menos de 30 segundos, seu OmniLens Pro estará vivo, respirando e pronto para analisar arquivos ZIP e vídeos pesados diretamente da nuvem.

---

## 🌟 Por que OmniLens Pro?
- **Análise Forense de Vídeo**: Captura frames automaticamente e descreve cada segundo.
- **Transcrições Perfeitas**: Ouça o que o áudio diz e entenda o sentimento por trás das palavras.
- **Raio-X de Documentos**: De PDFs a arquivos Markdown, nada escapa ao OCR.
- **Poder ZIP**: Suba um arquivo comprimido e a IA extrai e analisa cada item individualmente.

## 📄 Licença
Distribuído sob a **Licença MIT**. Sinta-se livre para clonar, evoluir e dominar o mercado de IA.

---
*OmniLens Pro: See through the noise.*
