// Alerta honesto: se as últimas rodadas todas vieram com 0 anúncios brutos,
// não é "nicho fraco" — é o Facebook bloqueando/raspagem quebrada. Melhor
// avisar isso alto e claro do que deixar a fila vazia sem explicação.
export function MiningHealthAlert({ zeroStreak, sinceIso }: { zeroStreak: number; sinceIso: string | null }) {
  if (zeroStreak < 4) return null;
  return (
    <div className="mining" style={{ background: "rgba(245,158,11,.1)", borderColor: "rgba(245,158,11,.3)" }}>
      <span style={{ color: "var(--warning)", fontWeight: 600 }}>
        ⚠ mineração sem retorno do Facebook
      </span>
      <span style={{ color: "var(--muted)" }}>
        últimas {zeroStreak} rodadas trouxeram 0 anúncios{sinceIso ? ` (desde ${new Date(sinceIso).toLocaleString("pt-BR")})` : ""} —
        provável bloqueio/rate-limit da Ad Library pra este IP, não falta de oferta no nicho
      </span>
    </div>
  );
}
