"use client";
import { useEffect, useState } from "react";
import { DataProvider, useData } from "@/lib/data";
import { Login } from "@/components/Login";
import { Shell } from "@/components/Shell";

function Gate() {
  const { ready, email } = useData();
  // Rendu uniquement dans le navigateur : les dates et le thème n'existent pas côté serveur (évite une erreur d'hydratation).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!ready || !mounted) return <div className="login"><div className="box" style={{ gridColumn: "1/-1" }}><p className="lbl">Chargement…</p></div></div>;
  return email ? <Shell /> : <Login />;
}
export default function Home() {
  return <DataProvider><Gate /></DataProvider>;
}
