# InfraNet

Sistema de gestao da infraestrutura de rede estruturada — site e PWA no mesmo
projeto (Next.js), com autenticacao completa (login, cadastro, confirmacao de
e-mail, recuperacao de senha, sessao persistente "lembrar de mim").

## Status atual (Prioridade 1 concluida)

- Login, cadastro, confirmacao de e-mail por codigo, recuperacao de senha por
  codigo, sessao com "lembrar de mim", primeira conta = Administrador
  (decidido no backend), mostrar/ocultar senha, PWA instalavel (manifest +
  service worker).
- Ainda **nao** implementado (proximos turnos, seguindo a Prioridade 2-5 da
  especificacao): inventario de rede (pontos, patch panels, switches,
  cabos), geracao de etiquetas, registro de testes PASS/FAIL, dashboard de
  metricas, BOM/custos, central de ajuda. O schema do banco (`prisma/schema.prisma`)
  ja modela essas tabelas para nao exigir retrabalho depois.
- Icones do PWA (`public/icons/icon-192.png`, `icon-512.png`) sao referencias
  no manifest mas os arquivos de imagem ainda precisam ser gerados/adicionados.

## Stack

- **Next.js 14** (App Router) + **TypeScript** — frontend e backend no mesmo
  projeto (API Routes), o que atende ao requisito de site e PWA serem a
  mesma aplicacao.
- **Prisma** + **PostgreSQL** — banco de dados e modelos.
- **bcryptjs** — hash de senhas e de codigos de verificacao.
- **jose** — assinatura dos tokens de sessao (JWT).
- **Resend** — envio de e-mails (confirmacao de cadastro e recuperacao de senha).
- **Tailwind CSS** — estilos.
- **zod** — validacao de formularios no frontend e no backend.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencher DATABASE_URL, AUTH_SECRET, etc.
npm run db:push        # cria as tabelas no banco
npm run dev
```

Acesse `http://localhost:3000`. A primeira conta criada em `/register` recebe
automaticamente o papel de Administrador.

Se `RESEND_API_KEY` nao estiver configurada, os e-mails de confirmacao e
recuperacao sao apenas registrados no console do servidor (util para testar
localmente sem uma conta de e-mail configurada) — o codigo aparece no
terminal onde `npm run dev` esta rodando.

## Hospedagem / Deploy (Secao 27 da especificacao)

### Plataforma escolhida: Vercel (frontend + API) + Neon (banco de dados) + Resend (e-mail)

**Por que esta combinacao:**

- **Vercel** e a plataforma criada pelos mantenedores do Next.js. O plano
  gratuito ("Hobby") hospeda tanto as paginas quanto as API Routes (elas
  rodam como funcoes serverless) sob o mesmo dominio — exatamente o modelo
  "um unico sistema" exigido na especificacao. Diferente de servicos como
  Render free tier, as funcoes da Vercel nao "dormem": cada requisicao apenas
  invoca a funcao sob demanda, entao nao ha o problema classico de "servidor
  gratuito que dorme apos inatividade".
- **Neon** oferece PostgreSQL serverless com plano gratuito permanente,
  compativel com Prisma, e nao exige um servidor sempre ligado.
- **Resend** tem um plano gratuito com volume suficiente para confirmacao de
  cadastro e recuperacao de senha em um projeto deste porte.

Essa combinacao foi escolhida sem exigir mudancas na arquitetura: por ser
Next.js full-stack, o mesmo codigo roda em dev e em producao.

### Passo a passo do deploy

1. Suba o codigo para um repositorio no GitHub.
2. Crie um banco em [neon.tech](https://neon.tech) (plano gratuito) e copie a
   `DATABASE_URL` fornecida.
3. Crie uma conta em [resend.com](https://resend.com), gere uma API key e
   verifique um dominio (ou use o dominio de testes deles para comecar).
4. Em [vercel.com](https://vercel.com), importe o repositorio do GitHub.
5. Em "Environment Variables", configure:
   - `DATABASE_URL` (do Neon)
   - `AUTH_SECRET` (gere uma string aleatoria longa, ex: `openssl rand -base64 32`)
   - `APP_URL` (o dominio que a Vercel vai gerar, ex: `https://infranet.vercel.app`)
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
6. Antes do primeiro deploy funcionar de ponta a ponta, rode
   `npx prisma db push` apontando para a `DATABASE_URL` de producao (pode ser
   feito localmente, uma unica vez, para criar as tabelas).
7. Clique em "Deploy". A Vercel cuida do HTTPS automaticamente.

### Atualizando o sistema

Cada `git push` para a branch principal do repositorio gera um novo deploy
automatico na Vercel. Alteracoes no `schema.prisma` exigem rodar
`npx prisma db push` (ou `migrate deploy`) apontando para o banco de producao
antes ou logo apos o deploy.

### Verificando se esta no ar

Acesse a URL publica e confirme que `/login` carrega. Um erro 500 geralmente
indica uma variavel de ambiente ausente — checar os logs da funcao na aba
"Logs" do projeto na Vercel.

### Limites do plano gratuito

- **Vercel Hobby**: limite de execucoes/banda mensal generoso para um
  projeto escolar, mas nao indicado para uso comercial com muito trafego.
- **Neon free tier**: um projeto, com limite de armazenamento e de horas de
  computo por mes — suficiente para este sistema, mas o banco pode ficar
  temporariamente inativo apos longos periodos sem uso (volta a responder
  automaticamente na proxima consulta, com uma pequena latencia inicial).
- **Resend free tier**: limite mensal de e-mails enviados.

### Se o sistema crescer

Migrar para os planos pagos de Vercel, Neon e Resend (ou para outra
infraestrutura) nao exige mudar a arquitetura do codigo — apenas trocar as
variaveis de ambiente e, se necessario, o provedor de banco/e-mail no arquivo
`src/lib/email.ts`.
