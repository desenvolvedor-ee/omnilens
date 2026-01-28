# 💠 OmniLens Pro — Universal AI Intelligence

> **A fronteira final da análise multimodal. Engine de IA forense para vídeos, áudios e documentos complexos.**

O OmniLens Pro é um ecossistema de inteligência de última geração alimentado pelo **Gemini 2.0 Flash**. Projetado para profissionais que precisam extrair inteligência de volumes massivos de dados, ele realiza análises frame-a-frame de vídeos e processa arquivos complexos com uma interface de elite e segurança reforçada.

---

## 🚀 NOVIDADES DA VERSÃO 2.5 (PRO)

- **Gemini 2.0 Flash Engine**: Respostas ultra-rápidas e análise multimodal aprimorada.
- **Arquitetura Zero-Leak**: Remoção de injeção de chaves no cliente para máxima segurança.
- **Vite-Powered**: Build otimizado com esbuild para carregamento instantâneo.
- **ZIP Deep Scan**: Descompressão e análise automática de fluxos de trabalho em lote.
- **Interface Glassmorphism**: Design moderno, responsivo e focado em produtividade.

---

## 🛠️ CONFIGURAÇÃO DE AMBIENTE

O OmniLens Pro prioriza a segurança. As chaves de API devem ser inseridas diretamente na interface do usuário (armazenadas localmente no navegador) ou configuradas via segredos no provedor de deploy.

| Variável | Descrição |
| :--- | :--- |
| `API_KEY` | Chave do Google Gemini (necessária para análise de IA). |
| `GOOGLE_CLIENT_ID` | ID OAuth para integração com Google Drive. |

---

## 🔐 SEGURANÇA E PRIVACIDADE

- **Local-First Keys**: Suas chaves de API são armazenadas no `localStorage` do seu navegador e nunca são enviadas para servidores de terceiros, exceto para as APIs oficiais do Google.
- **Production Stripping**: Todos os logs de depuração e ferramentas de desenvolvedor são removidos automaticamente no build de produção.
- **Sandboxed Execution**: O processamento de arquivos ZIP ocorre inteiramente no lado do cliente.

---

## 📋 DOCUMENTAÇÃO ADICIONAL

Para guias detalhados sobre como colocar o projeto no ar, consulte:
- [Guia de Deploy (DEPLOYMENT.md)](./DEPLOYMENT.md)

---

## 📄 Licença

Distribuído sob a **Licença MIT**. Desenvolvido para máxima performance e estética.

*OmniLens Pro: See through the noise.*
