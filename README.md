# Alpha Imóveis — Catálogo

Guia completo para colocar o catálogo no ar: Firestore (banco de dados),
Cloudinary (fotos) e Netlify (hospedagem). Nenhuma dessas contas pede cartão.

---

## 1. Criar o projeto no Firebase (banco de dados)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e clique em **Criar projeto**.
2. Dê um nome (ex: `alpha-imoveis`) e siga o assistente (pode desativar o Google Analytics, não é necessário).
3. Dentro do projeto, no menu lateral, vá em **Compilação → Firestore Database**.
4. Clique em **Criar banco de dados** → escolha **Modo de produção** → selecione uma localização (ex: `southamerica-east1` para ficar mais perto do Brasil).
5. Ainda no console, vá em **Firestore Database → Regras** e cole o conteúdo do arquivo `firestore.rules` deste projeto, substituindo o que já está lá. Clique em **Publicar**.
6. Agora vá em **⚙️ Configurações do projeto** (ícone de engrenagem, topo do menu) → aba **Geral** → role até "Seus apps" → clique no ícone **`</>`** (Web).
7. Dê um apelido ao app (ex: "catalogo-web") e clique em **Registrar app**. **Não** marque a opção de Firebase Hosting.
8. Ele vai mostrar um bloco `firebaseConfig` — você vai usar os valores de `apiKey`, `authDomain`, `projectId`, `messagingSenderId` e `appId` no passo 4.

## 2. Criar a conta no Cloudinary (fotos)

1. Acesse [cloudinary.com](https://cloudinary.com) e crie uma conta gratuita (não pede cartão).
2. No **Dashboard**, copie o **Cloud name** (aparece bem no topo).
3. Vá em **Settings** (ícone de engrenagem) → aba **Upload** → role até **Upload presets** → clique em **Add upload preset**.
4. Em **Signing Mode**, mude de "Signed" para **Unsigned** (isso é essencial — sem isso o upload direto do navegador não funciona).
5. Opcional, mas recomendado: em **Upload Manipulations → Incoming Transformation**, defina um limite de tamanho (ex: `Limit` 1600x1600) para evitar que fotos gigantes ocupem espaço à toa.
6. Salve e copie o **nome do preset** (aparece na lista, algo como `ml_default` ou o nome que você escolheu).

## 3. Google Maps (opcional — pro mapa de imóveis)

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) (mesma conta Google que você já usa).
2. Crie um projeto (ou use um existente) e vá em **APIs e serviços → Biblioteca**.
3. Busque por **"Maps JavaScript API"** e clique em **Ativar**.
4. Vá em **APIs e serviços → Credenciais → Criar credenciais → Chave de API**.
5. **Importante — restrinja a chave** pra não ficar aberta: clique na chave criada, em "Restrições do aplicativo" escolha **Sites (referenciadores HTTP)** e adicione o domínio do seu site Netlify (ex: `alpha-imoveis.netlify.app/*`).
6. Copie a chave — ela vai na variável `VITE_GOOGLE_MAPS_API_KEY`.

O Google dá uma cota mensal gratuita generosa (milhares de carregamentos de mapa). Se você não configurar essa chave, o app funciona normalmente — só a aba de mapa mostra um aviso no lugar do mapa.

## 4. Preparar o projeto

Dentro da pasta do projeto:

```bash
npm install
cp .env.example .env
```

Abra o `.env` e preencha com os valores que você copiou:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

Teste localmente:

```bash
npm run dev
```

Abre em `http://localhost:5173`. Cadastre um imóvel de teste com foto pra confirmar que Firestore e Cloudinary estão respondendo.

## 4. Deploy no Netlify

1. Suba o projeto para um repositório no GitHub (se ainda não tiver):
   ```bash
   git init
   git add .
   git commit -m "primeira versão do catálogo"
   git branch -M main
   git remote add origin <URL_DO_SEU_REPOSITORIO>
   git push -u origin main
   ```
2. Acesse [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
3. Conecte sua conta do GitHub e selecione o repositório.
4. O Netlify já deve detectar `npm run build` como comando e `dist` como pasta de publicação (por causa do `netlify.toml`). Confirme.
5. Antes de clicar em "Deploy", vá em **Site settings → Environment variables** e adicione as mesmas 7 variáveis do seu `.env`.
6. Clique em **Deploy site**. Em 1-2 minutos você tem um link tipo `alpha-imoveis.netlify.app`.
7. Opcional: em **Domain settings**, você pode trocar por um domínio próprio se tiver um.

Pronto — esse link é fixo. É ele que você compartilha com corretores e clientes de verdade.

---

## Nota sobre segurança

O código de acesso da equipe (`equipe2026` por padrão) é só uma trava na
interface — não é um login de verdade como o Firebase Auth. Isso significa
duas coisas na prática:

- Qualquer pessoa com as chaves do projeto (que ficam visíveis no código do
  site, isso é normal) consegue, tecnicamente, ler e escrever no banco
  diretamente, sem passar pelo app.
- Os campos "uso interno" (comissão, contato do proprietário, observações)
  ficam no mesmo documento do imóvel — o app esconde eles na tela do
  cliente, mas não há uma barreira no banco de dados impedindo o acesso.

Para uma fase de testes com a equipe, isso é uma limitação aceitável. Se em
algum momento isso importar mais (dados sensíveis de clientes reais, equipe
maior), o próximo passo é adicionar **Firebase Authentication** (login por
e-mail/senha, um por corretor) e então sim reforçar as regras do Firestore
para exigir login. Posso te ajudar com isso quando fizer sentido.

## Nota sobre fotos excluídas

Ao excluir um imóvel, a foto continua guardada no Cloudinary (o plano
gratuito não cadastra cartão, mas também não permite apagar imagens direto
do navegador sem uma chamada assinada pelo servidor). Com 25GB grátis, isso
não deve ser um problema tão cedo — mas se quiser, dá pra entrar no painel
do Cloudinary de vez em quando e limpar manualmente a pasta `alpha-imoveis`.

## Estrutura do projeto

```
alpha-imoveis/
├── src/
│   ├── App.jsx          → toda a interface e lógica do app
│   ├── firebase.js      → conexão com o Firestore
│   ├── cloudinary.js    → upload e redimensionamento de fotos
│   ├── data.js          → funções de leitura/escrita no banco
│   ├── styles.css       → visual (tema dark, marca Alpha)
│   └── main.jsx         → ponto de entrada
├── public/
│   └── logo.jpg         → logo da Alpha Imóveis
├── firestore.rules      → regras para colar no console do Firebase
└── .env.example         → modelo das variáveis de ambiente
```
