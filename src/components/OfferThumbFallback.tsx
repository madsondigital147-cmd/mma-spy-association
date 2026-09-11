// Fallback de imagem contextual: quando não há criativo real capturado (nem
// print nem CDN do FB), mostra um quadro ilustrativo por nicho em vez de um
// quadrado vazio — e deixa claro que é ILUSTRATIVO, não o criativo real.
const GROUP_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  saude: { icon: "💊", color: "#009dff", bg: "#0d1a26" },
  dinheiro: { icon: "💰", color: "#f59e0b", bg: "#241d0d" },
  relacionamento: { icon: "💌", color: "#8b5cf6", bg: "#1c1526" },
  outros: { icon: "🗂️", color: "#5c6773", bg: "#161b21" },
};

export function OfferThumbFallback({ group, funnelType }: { group?: string | null; funnelType?: string | null }) {
  const s = GROUP_STYLE[group || "outros"] || GROUP_STYLE.outros;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: s.bg,
        color: s.color,
      }}
    >
      <span style={{ fontSize: 28, lineHeight: 1 }}>{funnelType === "vsl" ? "▶" : s.icon}</span>
      <span style={{ fontSize: 9, letterSpacing: 0.3, color: "var(--faint)", textTransform: "uppercase" }}>
        ilustrativa
      </span>
    </div>
  );
}
