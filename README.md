# Fraldômetro

A página do bebê onde amigos e família doam fraldas via Pix, direto para a conta dos pais.

Stack: Next.js (App Router) + TypeScript, Tailwind, Postgres no Supabase com Drizzle ORM, hospedagem na Vercel.

## Rodando

Precisa de Node 20 (`nvm use`).

```bash
npm install
npx vercel env pull .env.local   # traz as variáveis da integração Supabase
npm run dev
```

- `/` e `/como-funciona`: site institucional
- `/exemplo/placar`, `/exemplo/diario`, `/exemplo/recortes`: página do bebê de exemplo em cada tema

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
