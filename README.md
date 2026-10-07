# Fraldômetro

A página do bebê onde amigos e família doam fraldas via Pix, direto para a conta dos pais.

Stack: Next.js (App Router) + TypeScript, Tailwind, Postgres no Supabase com Drizzle ORM, hospedagem na Vercel.

## Rodando

Precisa de Node 20 (`nvm use`).

```bash
npm install
cp .env.example .env.development.local   # preencha com os dados do Supabase
npm run dev
```

- `/` e `/como-funciona`: site institucional
- `/exemplo/placar`, `/exemplo/diario`, `/exemplo/recortes`: página do bebê de exemplo em cada tema

- `/entrar`: login e cadastro (código de 6 dígitos no e-mail, sem senha)
- `/painel`, `/painel/conta`: área logada

## Login

Supabase Auth com código por e-mail (`signInWithOtp` + `verifyOtp`). Na primeira vez, a pessoa completa
o perfil em `/entrar/perfil`, que cria a linha em `users`. O `src/proxy.ts` renova a sessão e barra o
`/painel` sem login; a checagem que vale fica em `src/lib/auth.ts`.

A configuração do Auth (código de 6 dígitos, endereços permitidos e o e-mail em
`supabase/templates/codigo.html`) é aplicada por script, sem clicar no painel:

```bash
npm run auth:configurar   # precisa de SUPABASE_ACCESS_TOKEN em .env.development.local
```

Com `RESEND_API_KEY`, o script também liga o envio pelo Resend (SMTP) e o e-mail com o código.

Falta: domínio próprio verificado no Resend. Por enquanto o remetente é `onboarding@resend.dev`
(`EMAIL_REMETENTE`), que só entrega no e-mail dono da conta do Resend.

## Banco

O esquema fica em `src/db/schema.ts` (6 tabelas, valores em centavos, sem CPF) e as migrações em `drizzle/`.

```bash
npm run db:generate   # gera migração a partir do schema
npm run db:migrate    # aplica no Supabase (usa DIRECT_DATABASE_URL)
```

## Temas

Cada tema é um bloco de tokens em `src/themes/temas.css`, registrado em `src/themes/index.ts`.
Um tema novo é um bloco novo de variáveis, não uma tela nova.

## Onde estamos

Fase 2 do plano técnico (base do produto). A seguir: fase 3, pagamento ponta a ponta no sandbox do gateway.
