import { ImageResponse } from "next/og";
import type { DadosPagina } from "@/components/pagina-do-bebe";
import { formatarNumero } from "@/lib/dinheiro";
import { CORES_OG, fontesDoTema, SimboloOg, TAMANHO_OG } from "@/lib/og";
import { artigo, contracao } from "@/lib/pagina";

// Imagem de compartilhamento da página do bebê: é o que aparece quando o link cai no grupo.
// Segue o tema da página (cores, fontes e forma da foto).

const FORMA_FOTO = { placar: "28px", diario: "180px 180px 26px 26px", recortes: "999px" } as const;

export async function imagemDaPagina(dados: DadosPagina) {
  const c = CORES_OG[dados.tema];
  const [display, texto] = c.display[0] === c.texto[0] ? [c.display[0], c.display[0]] : [c.display[0], c.texto[0]];
  const art = artigo(dados.sexo);
  const chegada = dados.chegada && (dados.jaNasceu ? `Cheguei em ${dados.chegada}!` : `Chego em ${dados.chegada}!`);
  const pct = dados.metaFraldas > 0 ? Math.min(100, (dados.totalFraldas / dados.metaFraldas) * 100) : 0;
  // Palavra por palavra, para o título quebrar linha sem recuo e o nome ganhar a cor de destaque.
  const palavras = [
    ...`Oi, eu sou${art ? ` ${art}` : ""}`.split(" ").map((texto) => ({ texto, nome: false })),
    { texto: `${dados.nomeBebe}.`, nome: true },
    ...(chegada ? chegada.split(" ") : []).map((texto) => ({ texto, nome: false })),
  ];
  const recortes = dados.tema === "recortes";
  const foto = recortes ? { width: 360, height: 360 } : { width: 340, height: 400 };
  const borda = recortes ? `5px solid ${c.borda}` : "none";
  const sombra = recortes ? `8px 8px 0 ${c.borda}` : "none";

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg, color: c.fg, fontFamily: texto, position: "relative" }}>
        {recortes && (
          <>
            <div style={{ position: "absolute", top: -150, right: -110, width: 420, height: 420, borderRadius: 999, background: "#b9a6ff" }} />
            <div style={{ position: "absolute", bottom: 0, left: -40, width: 260, height: 130, borderRadius: "260px 260px 0 0", background: "#ffc531" }} />
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 64, padding: "0 80px", width: "100%" }}>
          {dados.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- ImageResponse só entende <img>
            <img
              src={dados.fotoUrl}
              alt=""
              width={foto.width}
              height={foto.height}
              style={{ objectFit: "cover", borderRadius: FORMA_FOTO[dados.tema], border: borda, boxShadow: sombra, flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                ...foto,
                paddingBottom: recortes ? 50 : 60,
                background: c.track,
                borderRadius: FORMA_FOTO[dados.tema],
                border: borda,
                boxShadow: sombra,
                flexShrink: 0,
              }}
            >
              <div style={{ width: recortes ? 170 : 190, height: recortes ? 170 : 190, borderRadius: 999, background: c.accent }} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 28, color: c.muted }}>
              {`Chá ${contracao(dados.sexo)} ${dados.nomeBebe}${dados.encerraEm ? `, até ${dados.encerraEm}` : ""}`}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", fontFamily: display, fontSize: 70, lineHeight: 1.04, marginTop: 14, letterSpacing: dados.tema === "placar" ? -2 : 0 }}>
              {palavras.map((p, i) => (
                <span key={i} style={{ marginRight: 18, color: p.nome ? c.accent : c.fg }}>
                  {p.texto}
                </span>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginTop: 36,
                padding: 26,
                background: c.surface,
                borderRadius: 22,
                border: borda,
                boxShadow: sombra,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: display, fontSize: 64, lineHeight: 1 }}>{formatarNumero(dados.totalFraldas)}</span>
                <span style={{ fontSize: 26, color: c.muted }}>de {formatarNumero(dados.metaFraldas)} fraldas</span>
              </div>
              <div style={{ display: "flex", height: 26, borderRadius: 14, background: c.track, border: recortes ? `4px solid ${c.borda}` : "none", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, background: c.fill }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", left: 80, bottom: 34, display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: c.muted }}>
          <SimboloOg tamanho={24} cor={c.muted} destaque={c.accent} />
          fraldômetro
        </div>
      </div>
    ),
    { ...TAMANHO_OG, fonts: await fontesDoTema(dados.tema) },
  );
}
