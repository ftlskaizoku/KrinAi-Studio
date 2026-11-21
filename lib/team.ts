// Liste des associés autorisés : variable ALLOWED_EMAILS (adresses séparées par des virgules).
// Si la variable est vide ou absente, PERSONNE n'est autorisé (on refuse par défaut).
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

// Autorisé = adresse présente dans la liste ET vérifiée par Google/Firebase.
export function isAllowed(email?: string | null, verified?: boolean): boolean {
  return !!email && verified === true && allowedEmails().includes(email.trim().toLowerCase());
}
