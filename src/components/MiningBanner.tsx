"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function MiningBanner({
  active,
  label,
  startedAt,
}: {
  active: boolean;
  label: string;
  startedAt: string | null;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (startedAt) {
        const s = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
        const m = Math.floor(s / 60);
        setElapsed(m > 0 ? `${m}min` : `${s}s`);
      }
    };
    tick();
    const t1 = setInterval(tick, 1000);
    // enquanto minera, atualiza a fila sozinho
    const t2 = setInterval(() => router.refresh(), 20000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [active, startedAt, router]);

  if (!active) return null;

  return (
    <div className="mining">
      <span className="pulse" />
      <span>
        minerando agora — <b>{label}</b>
        {elapsed ? ` · há ${elapsed}` : ""}
      </span>
      <span className="mining-hint">a fila atualiza sozinha</span>
    </div>
  );
}
