# Política de Privacidade — OmniLens Pro

**Última atualização:** 27 de Janeiro de 2026

O **OmniLens Pro** valoriza a sua privacidade. Esta política descreve como tratamos os seus dados ao utilizar nossa aplicação e a integração com o Google Drive.

## 1. Coleta de Dados
O OmniLens Pro é uma aplicação **Client-Side First**. Isso significa que:
- **Não coletamos** informações pessoais em nossos servidores.
- **Não armazenamos** suas chaves de API (Gemini ou Google). Elas são salvas apenas no `localStorage` do seu próprio navegador.

## 2. Uso da Integração com Google Drive
Ao utilizar o seletor do Google Drive:
- Solicitamos acesso apenas para **leitura de arquivos** (`drive.readonly`) que você selecionar explicitamente.
- O token de acesso é utilizado apenas para baixar o arquivo para a memória temporária do seu navegador.
- **Não compartilhamos** seus dados do Google Drive com terceiros, exceto com a API do Google Gemini para a finalidade de análise solicitada por você.

## 3. Processamento de IA (Google Gemini)
Os dados dos arquivos selecionados (vídeos, áudios, imagens ou documentos) são enviados diretamente para as APIs do **Google Gemini** para processamento. Recomendamos a leitura da [Política de Privacidade do Google](https://policies.google.com/privacy) para entender como eles tratam os dados enviados via API.

## 4. Cookies e Armazenamento Local
Utilizamos o `localStorage` do navegador para persistir suas configurações de preferência e chaves de API, visando uma melhor experiência de uso. Você pode limpar esses dados a qualquer momento limpando o cache do seu navegador.

## 5. Contato
Para questões sobre esta política, entre em contato via repositório oficial no GitHub.
