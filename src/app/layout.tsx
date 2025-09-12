// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { AuthContextProvider } from "@/context/AuthContext"; // assuming context is here
import LayoutShell from "@/components/LayoutShell";

export const metadata: Metadata = {
  title: "Strafe",
  description: "Valorant stats dashboard with AI analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#151515] text-white">
        <div id="portal" />
        {/* AuthProvider must be a client component */}
        <AuthContextProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthContextProvider>
      </body>
    </html>
  );
}
