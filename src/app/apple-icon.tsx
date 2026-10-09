import { ImageResponse } from "next/og";
import { SimboloOg } from "@/lib/og";

// Ícone da tela inicial do iPhone: o símbolo da marca sobre o creme do tema Recortes.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icone() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: "#fff6ef" }}>
        <SimboloOg tamanho={128} cor="#26211f" />
      </div>
    ),
    size,
  );
}
