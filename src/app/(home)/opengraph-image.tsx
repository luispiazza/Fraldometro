import { ImageResponse } from "next/og";
import { fonteGoogle, SimboloOg, TAMANHO_OG } from "@/lib/og";

// Imagem de compartilhamento da home, no visual do tema Recortes.

export const alt = "Fraldômetro: chá de fraldas sem pilha de pacotes. Amigos e família doam fraldas via Pix.";
export const size = TAMANHO_OG;
export const contentType = "image/png";

const TINTA = "#26211f";

export default async function Imagem() {
  const [bagel, nunito, instrument] = await Promise.all([
    fonteGoogle("Bagel Fat One", 400),
    fonteGoogle("Nunito", 700),
    fonteGoogle("Instrument Sans", 700),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#fff6ef", position: "relative", color: TINTA }}>
        <div style={{ position: "absolute", top: -170, right: -120, width: 520, height: 520, borderRadius: 999, background: "#b9a6ff" }} />
        <div style={{ position: "absolute", bottom: 0, left: 700, width: 300, height: 150, borderRadius: "300px 300px 0 0", background: "#ffc531" }} />
        <div
          style={{
            position: "absolute",
            top: 150,
            right: 380,
            width: 96,
            height: 96,
            borderRadius: 999,
            background: "#7cc6ff",
            border: `5px solid ${TINTA}`,
            boxShadow: `6px 6px 0 ${TINTA}`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", padding: "64px 72px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "Instrument Sans", fontSize: 38, letterSpacing: -1 }}>
            <SimboloOg tamanho={38} cor={TINTA} />
            fraldômetro
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 56, marginTop: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", width: 600 }}>
              <div style={{ fontFamily: "Bagel Fat One", fontSize: 84, lineHeight: 1 }}>Chá de fraldas sem pilha de pacotes.</div>
              <div style={{ fontFamily: "Nunito", fontSize: 30, color: "#6b5f58", marginTop: 26, lineHeight: 1.35 }}>
                Amigos e família doam fraldas via Pix, direto para a conta da família.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                width: 380,
                padding: 28,
                background: "#ffffff",
                border: `5px solid ${TINTA}`,
                borderRadius: 26,
                boxShadow: `8px 8px 0 ${TINTA}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: "Bagel Fat One", fontSize: 72, lineHeight: 1 }}>2.512</span>
                <span style={{ fontFamily: "Nunito", fontSize: 24, color: "#6b5f58" }}>de 4.000</span>
              </div>
              <div style={{ display: "flex", height: 30, borderRadius: 16, border: `4px solid ${TINTA}`, background: "#ffe1d3", overflow: "hidden" }}>
                <div style={{ width: "63%", background: "#7cc6ff", borderRight: `4px solid ${TINTA}` }} />
              </div>
              <div style={{ fontFamily: "Nunito", fontSize: 22, color: "#6b5f58" }}>fraldas doadas para o Antonio</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bagel Fat One", data: bagel, weight: 400, style: "normal" },
        { name: "Nunito", data: nunito, weight: 700, style: "normal" },
        { name: "Instrument Sans", data: instrument, weight: 700, style: "normal" },
      ],
    },
  );
}
