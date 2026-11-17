import "./globals.css";
export const metadata = { title: "KrinAi Studio" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
