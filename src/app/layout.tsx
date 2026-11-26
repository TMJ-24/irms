import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSlaBreached } from "@/lib/stats";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Incident Reporting Management System",
  description:
    "National Cyber Security Centre Incident Reporting Management System — report, investigate and track cyber security incidents.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const db = await getDb();
  const user = await getCurrentUser();
  const path = (await headers()).get("x-irms-path") ?? "/";
  const onLogin = path === "/login";

  // Full session validation (the proxy only checks that a cookie is present).
  if (!user && !onLogin) redirect("/login");
  if (user && onLogin) redirect("/");

  const now = new Date();
  const alertCount = db.incidents.filter((i) => isSlaBreached(i, now) || (i.severity === "Critical" && i.status === "Reported")).length;

  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--page)] font-sans text-[var(--ink)]">
        {user && !onLogin ? (
          <AppShell alertCount={alertCount} user={{ name: user.name, email: user.email, role: user.role, initials: user.initials }}>
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
