import type { Metadata } from "next";
import { sair } from "@/app/(site)/entrar/acoes";
import { botaoSecundario } from "@/components/campos";
import { FormPerfil } from "@/components/form-perfil";
import { exigirPerfil } from "@/lib/auth";

export const metadata: Metadata = { title: "Minha conta" };

export default async function Conta() {
  const perfil = await exigirPerfil();

  return (
    <div className="mx-auto grid max-w-md gap-8 px-4 py-12">
      <div className="grid gap-2">
        <h1 className="titulo text-4xl leading-tight">Minha conta</h1>
        <p className="text-muted">
          Você entra com <strong className="text-fg">{perfil.email}</strong>.
        </p>
      </div>
      <FormPerfil perfil={perfil} textoBotao="Salvar" />
      <form action={sair} className="border-t border-line pt-6">
        <button className={botaoSecundario}>Sair da conta</button>
      </form>
    </div>
  );
}
