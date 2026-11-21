// Liste des associés autorisés : variable ALLOWED_EMAILS (adresses séparées par des virgules).
// Si la variable est absente ou vide, on retombe sur les trois associés ci-dessous (jamais sur "tout le monde").
const DEFAULT_TEAM = ["khalifadylla@gmail.com", "papeamdou48@gmail.com", "zoumxyz@gmail.com"];

export function allowedEmails(): string[] {
  const fromEnv = (process.env.ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_TEAM;
}

// Autorisé = adresse présente dans la liste ET vérifiée par Google/Firebase.
export function isAllowed(email?: string | null, verified?: boolean): boolean {
  return !!email && verified === true && allowedEmails().includes(email.trim().toLowerCase());
}
