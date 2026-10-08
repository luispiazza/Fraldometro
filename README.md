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
- `/painel/paginas/[id]/conta`: conta da família no Asaas (abertura e verificação)
- `/[slug]/doacao/[id]`: Pix da doação (QR Code e copia e cola)

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

O remetente é `contato@fraldometro.com.br` (`EMAIL_REMETENTE`), com o domínio verificado no Resend
(registros DNS na Cloudflare).

## Pagamento (Asaas)

Cada página tem uma subconta da família no Asaas (`src/lib/asaas.ts`). A cobrança Pix é criada com a
chave da subconta, então o Pix sai no nome de quem recebe; a comissão vai por split (`fixedValue`) para a
conta do Fraldômetro, e a taxa do Asaas sai da subconta. A chave de cada subconta fica cifrada no banco
(`src/lib/cifra.ts`, `CHAVE_CIFRA`); o CPF vai direto para o Asaas.

O Asaas exige CPF do pagador. Para não pedir CPF ao convidado, cada subconta tem um cliente só,
"Convidados", criado com o CPF do titular na abertura da conta.

Uma doação vira paga pelo webhook (`/api/asaas/webhook`, com `ASAAS_WEBHOOK_TOKEN`) ou pela consulta à
API que a tela do Pix faz enquanto espera (`/api/doacoes/[id]`). No Mac o webhook não chega, e a
consulta cobre. Os eventos ficam em `webhook_events`, sem repetir.

No sandbox (`ASAAS_AMBIENTE=sandbox`) aparecem dois botões de teste: "Aprovar no sandbox", na conta da
família, e "Simular pagamento", na tela do Pix.

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

Fase 3 do plano técnico: pagamento ponta a ponta no sandbox do Asaas, em andamento.

Falta para fechar a fase 3:
- Rodar o fluxo no sandbox com uma conta de testes do Asaas (`ASAAS_API_KEY`).
- Confirmar no sandbox que o Asaas aceita o cliente "Convidados" com o CPF do titular.
- Link de envio de documentos (`onboardingUrl`): no sandbox, pedir ao suporte do Asaas para ligar.
- Limitar quantos Pix um mesmo visitante pode gerar (hoje qualquer um gera cobranças sem limite).
