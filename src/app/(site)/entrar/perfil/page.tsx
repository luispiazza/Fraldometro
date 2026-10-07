import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormPerfil } from "@/components/form-perfil";
import { exigirUsuario, perfilAtual } from "@/lib/auth";

export const metadata: Metadata = { title: "Complete seu cadastro" };

export default async function CompletarPerfil() {
  const usuario = await exigirUsuario();
  if (await perfilAtual()) redirect("/painel");

  return (
    <div className="mx-auto grid max-w-md gap-6 px-4 py-14">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Falta pouco</h1>
        <p className="text-muted">
          Você entrou como <strong className="text-fg">{usuario.email}</strong>. Conta pra gente quem é você.
        </p>
      </div>
      <FormPerfil textoBotao="Continuar" />
    </div>
  );
}
