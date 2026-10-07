// Configura o login (Supabase Auth) pela API de gerenciamento, em vez de clicar no painel.
// Pode rodar quantas vezes quiser: só muda o que estiver diferente.
//
//   npm run auth:configurar
//
// Precisa de SUPABASE_ACCESS_TOKEN em .env.development.local
// (gere em https://supabase.com/dashboard/account/tokens).

import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: [".env.development.local", ".env.local"], quiet: true });

const PRODUCAO = "https://fraldometro-lac.vercel.app";
const REDIRECTS = ["http://localhost:3000/**", `${PRODUCAO}/**`];

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    "Falta SUPABASE_ACCESS_TOKEN em .env.development.local.\n" +
      "Gere um em https://supabase.com/dashboard/account/tokens e cole na linha SUPABASE_ACCESS_TOKEN=",
  );
  process.exit(1);
}

const urlProjeto = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_DATABASE_SUPABASE_SUPABASE_URL;
const ref = urlProjeto && new URL(urlProjeto).hostname.split(".")[0];
if (!ref) {
  console.error("Não achei a URL do projeto (NEXT_PUBLIC_SUPABASE_URL).");
  process.exit(1);
}

const api = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const cabecalhos = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function chamar(metodo, corpo) {
  const r = await fetch(api, { method: metodo, headers: cabecalhos, body: corpo && JSON.stringify(corpo) });
  if (!r.ok) {
    console.error(`A API do Supabase respondeu ${r.status}: ${await r.text()}`);
    if (r.status === 403) diagnosticar403();
    process.exit(1);
  }
  return r.json();
}

// Um token com escopo só para Auth Config também leva 403 em outros endereços, então
// não dá para saber daqui qual das causas é; o texto lista as duas.
function diagnosticar403() {
  console.error(
    `\nO token não tem acesso ao Auth do projeto ${ref}. As causas possíveis:` +
      "\n  - o token foi criado para outra organização ou sem esse projeto, ou sem Auth Config (Read-write);" +
      "\n  - o seu papel na organização não permite mexer no Auth (precisa ser Owner ou Admin)." +
      "\nUm token Classic tira a dúvida: se ele também der 403, o problema é o papel.",
  );
}

const atual = await chamar("GET");

// Mantém os endereços que já estiverem cadastrados.
const redirects = [...new Set([...(atual.uri_allow_list ?? "").split(",").filter(Boolean), ...REDIRECTS])];

// O mesmo e-mail serve para o primeiro acesso (confirmation) e para os seguintes (magic_link).
const template = readFileSync(new URL("../supabase/templates/codigo.html", import.meta.url), "utf8");
const assunto = "Seu código do Fraldômetro: {{ .Token }}";

const desejado = {
  external_email_enabled: true,
  site_url: PRODUCAO,
  uri_allow_list: redirects.join(","),
  mailer_otp_length: 6,
  mailer_otp_exp: 600,
};

// No plano gratuito, o Supabase só deixa trocar o template com SMTP próprio (Resend).
const temSmtp = Boolean(atual.smtp_host);
if (temSmtp) {
  Object.assign(desejado, {
    mailer_subjects_confirmation: assunto,
    mailer_subjects_magic_link: assunto,
    mailer_templates_confirmation_content: template,
    mailer_templates_magic_link_content: template,
  });
}
const avisoSmtp = () =>
  !temSmtp &&
  console.log("\nO e-mail com o código fica para quando o SMTP (Resend) estiver configurado; rode de novo depois.");

const mudancas = Object.fromEntries(Object.entries(desejado).filter(([k, v]) => atual[k] !== v));

if (Object.keys(mudancas).length === 0) {
  console.log("Login já estava configurado. Nada a mudar.");
  avisoSmtp();
  process.exit(0);
}

await chamar("PATCH", mudancas);
console.log(`Projeto ${ref} atualizado:`);
for (const k of Object.keys(mudancas)) console.log(`  - ${k}`);
avisoSmtp();
