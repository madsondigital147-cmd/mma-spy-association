"use client";

import { useEffect, useState } from "react";

// Saudação calculada no navegador (hora local de quem tá olhando), não no
// servidor — evita "bom dia" errado por causa do fuso do datacenter.
export function Greeting({ name }: { name: string }) {
  const [greet, setGreet] = useState("Olá");
  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
  }, []);
  return (
    <h1>
      {greet}
      {name ? `, ${name}` : ""}.
    </h1>
  );
}
