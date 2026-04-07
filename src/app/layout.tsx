import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { SessionProvider } from "./providers";
import { authOptions } from "../server/auth";
import { TRPCReactProvider } from "../trpc/react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "HB Style",
  description: "Sistema de gestión de citas para HB Style",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body>
        <SessionProvider session={session}>
          <TRPCReactProvider>
            {children}
            <Toaster position="top-right" />
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
