import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { perfilAtual, usuarioAtual } from "@/lib/auth";
import { FormEntrar } from "./form-entrar";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  if (await usuarioAtual()) redirect((await perfilAtual()) ? "/painel" : "/entrar/perfil");

  return (
    <div className="mx-auto grid max-w-md gap-6 px-4 py-14">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Entrar ou criar conta</h1>
        <p className="text-muted">Sem senha: mandamos um código para o seu e-mail.</p>
      </div>
      {(await searchParams).erro === "link" && (
        <p role="alert" className="rounded-lg bg-chip px-4 py-3 text-sm">
          Esse link já foi usado ou venceu. Peça um código novo abaixo.
        </p>
      )}
      <FormEntrar />
    </div>
  );
}
