import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cifra segredos guardados no banco (a chave de API da subconta de cada família).
// AES-256-GCM com a chave de CHAVE_CIFRA (32 bytes em base64). Formato: v1.<iv>.<tag>.<texto>.

function chave(): Buffer {
  const b64 = process.env.CHAVE_CIFRA;
  const k = b64 ? Buffer.from(b64, "base64") : null;
  if (!k || k.length !== 32) {
    throw new Error("Defina CHAVE_CIFRA com 32 bytes em base64 (gere com: openssl rand -base64 32).");
  }
  return k;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(texto, "utf8"), c.final()]);
  return ["v1", iv, c.getAuthTag(), dados].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decifrar(cifrado: string): string {
  const [versao, iv, tag, dados] = cifrado.split(".");
  if (versao !== "v1" || !iv || !tag || !dados) throw new Error("Segredo cifrado em formato desconhecido.");
  const d = createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(dados, "base64url")), d.final()]).toString("utf8");
}
