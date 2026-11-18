"use client";
import { useData } from "@/lib/data";
import { gradientFor, usd, ago } from "@/lib/format";
import { Avatar, Card, Empty, Head, Pill } from "../ui";
import { Icon } from "../Icons";

const ST: Record<string, [string, "ok" | "wa" | "ac"]> = { plan: ["Plan", "ac"], production: ["En production", "ac"], validation: ["En validation", "wa"], vente: ["En vente", "ok"] };

export function Ebooks({ q }: { q: string }) {
  const { ebooks } = useData();
  const list = ebooks.filter((b) => !q || (b.title + (b.creator_handle ?? "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Head title={<span className="grad">Ebooks</span>} sub="Votre catalogue : statut, prix et fichiers de chaque livre." />
      {!list.length ? <Card><Empty icon="ebk" title="Aucun ebook pour l'instant" text="Les ebooks apparaîtront ici dès que n8n enverra un brouillon (collection « ebooks » de Firestore). Le contrat actuel ne transporte pas encore ces données : à ajouter avec Zoum." /></Card> : (
        <div className="bk">{list.map((b) => {
          const [lab, tone] = ST[b.status] ?? [b.status, "ac" as const];
          return (
            <Card key={b.id}>
              <div className="cvr" style={{ background: gradientFor(b.title) }}><small>Ebook</small>{b.title}</div>
              <div className="who"><Avatar name={b.creator_handle ?? b.title} size={28} />@{b.creator_handle ?? "—"}</div>
              <p style={{ margin: "12px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}><Pill tone={tone}>{lab}</Pill><span className="price">{b.price != null ? usd(b.price) : "—"}</span></p>
              <div className="files">{b.pdf_url ? <a href={b.pdf_url} className="pill ok">PDF</a> : <span className="pill">PDF</span>}{b.epub_url ? <a href={b.epub_url} className="pill ok">EPUB</a> : <span className="pill">EPUB</span>}<span style={{ marginLeft: "auto", color: "var(--mu)" }}><Icon n="clock" size={13} /> {ago(b.updated_at)}</span></div>
            </Card>
          );
        })}</div>
      )}
    </>
  );
}
