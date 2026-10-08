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
- `/painel/paginas/[id]/conta`: conexão da conta Mercado Pago da família
- `/[slug]/doacao/[id]`: Pix da doação (QR Code e copia e cola)
- `/admin`: visão geral da plataforma, só para a equipe (404 para os outros)

## Admin

Quem abre o `/admin` está na tabela `admins` (fora de `users`, que o próprio usuário pode editar pelo
cliente do Supabase). Para incluir alguém já cadastrado, no SQL Editor do Supabase:

```sql
insert into admins (user_id) select id from users where email = 'alguem@exemplo.com';
```

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

## Pagamento (Mercado Pago)

Modelo marketplace do Mercado Pago (`src/lib/mercadopago.ts`). A família conecta a conta Mercado Pago dela
por OAuth ("Conectar com Mercado Pago", volta em `/painel/mercadopago/retorno`); não há cadastro nem
verificação no Fraldômetro. O Pix é criado com o token da família, então o dinheiro cai direto na conta
dela; a comissão vai por `application_fee` para a conta dona da aplicação, e a taxa do Mercado Pago sai da
parte da família. Os tokens ficam cifrados no banco (`src/lib/cifra.ts`, `CHAVE_CIFRA`) e são renovados
quando faltam 30 dias para vencer (valem 180).

A conta da família precisa ter chave Pix cadastrada no Mercado Pago; sem ela, o Pix é recusado e o
convidado vê um aviso.

Uma doação vira paga pelo webhook (`/api/mercadopago/webhook`, enviado no `notification_url` de cada Pix)
ou pela consulta à API que a tela do Pix faz enquanto espera (`/api/doacoes/[id]`). O webhook não confia no
corpo do aviso: busca o pagamento na API. No Mac o webhook não chega, e a consulta cobre.

Configuração da aplicação no painel do Mercado Pago:
- Modelo de integração marketplace, com `MP_CLIENT_ID` e `MP_CLIENT_SECRET`.
- URL de redirecionamento: `<SITE_URL>/painel/mercadopago/retorno` (https; o OAuth não volta para localhost).
- Webhooks: assinatura secreta em `MP_WEBHOOK_SECRET`.

Em teste (`MP_AMBIENTE=teste`), o OAuth gera tokens de teste: conecte com o usuário vendedor de teste do
painel. O Pix de teste não pode ser pago, então a tela do Pix mostra "Simular pagamento", que marca a doação
como paga (só quando o Mercado Pago diz que o pagamento é de teste).

## Banco

O esquema fica em `src/db/schema.ts` (7 tabelas, valores em centavos, sem CPF) e as migrações em `drizzle/`.

```bash
npm run db:generate   # gera migração a partir do schema
npm run db:migrate    # aplica no Supabase (usa DIRECT_DATABASE_URL)
```

## Temas

Cada tema é um bloco de tokens em `src/themes/temas.css`, registrado em `src/themes/index.ts`.
Um tema novo é um bloco novo de variáveis, não uma tela nova.

## Onde estamos

Fase 3 do plano técnico: pagamento ponta a ponta em teste no Mercado Pago, em andamento.

Falta para fechar a fase 3:
- Criar a aplicação marketplace no Mercado Pago e os usuários de teste (vendedor e comprador).
- Rodar o fluxo em teste num endereço https (preview da Vercel), por causa da volta do OAuth.
- Confirmar o código de erro de conta sem chave Pix (hoje tratamos o 13253).
- Limitar quantos Pix um mesmo visitante pode gerar (hoje qualquer um gera cobranças sem limite).
