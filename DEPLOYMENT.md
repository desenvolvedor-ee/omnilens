# 🚀 Guia de Deploy — OmniLens Pro

Este guia detalha como realizar a implantação do OmniLens Pro na **Vercel** utilizando **Cloudflare** como provedor de DNS.

---

## 1. Configuração na Vercel

### Importar o Projeto
1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).
2. Clique em **Add New > Project**.
3. Importe o repositório do GitHub.
4. No campo **Framework Preset**, selecione **Vite**.
5. O comando de build deve ser `npm run build` e o diretório de saída `dist`.

### Configurar Domínio Personalizado
1. No seu projeto na Vercel, vá em **Settings > Domains**.
2. Adicione seu domínio (ex: `omnilens.desenvolvedoree.qzz.io`).
3. Copie o valor do **CNAME** fornecido (ex: `cname.vercel-dns.com`).

---

## 2. Configuração na Cloudflare (DNS & SSL)

Para evitar o erro **525 SSL Handshake Failed**, siga estas instruções:

### DNS
1. Crie um registro **CNAME** para o seu subdomínio.
2. No campo **Target**, cole o endereço fornecido pela Vercel (`cname.vercel-dns.com`).
3. **Proxy Status**: Recomendamos deixar como **DNS Only** (Nuvem Cinza) durante a primeira validação do SSL pela Vercel. Após validado, você pode mudar para **Proxied** (Nuvem Laranja).

### SSL/TLS
Se você usar a nuvem **Laranja** (Proxied):
1. Vá na aba **SSL/TLS > Overview**.
2. Altere o modo de criptografia para **Full**.
3. *Atenção:* O modo "Full (Strict)" pode causar falhas se o certificado da Vercel ainda estiver em processo de renovação ou validação.

---

## 3. Google Drive (OAuth)

Para que a integração com o Drive funcione no domínio de produção:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Selecione seu **OAuth 2.0 Client ID**.
3. Em **Authorized JavaScript origins**, adicione a URL completa do seu deploy (ex: `https://omnilens.desenvolvedoree.qzz.io`).
4. Salve e aguarde alguns minutos para a propagação.

---

## 🛠️ Solução de Problemas Comuns

| Problema | Causa Provável | Solução |
| :--- | :--- | :--- |
| **Tela Branca** | Script de entrada ausente | Verifique se o `index.html` contém a tag `<script type="module" src="/index.tsx"></script>`. |
| **Erro 525** | SSL Handshake Failed | Altere o SSL da Cloudflare para "Full" ou mude o DNS para "Nuvem Cinza". |
| **IA não responde** | API Key ausente | Insira a chave Gemini nas configurações do App (ícone de engrenagem). |
