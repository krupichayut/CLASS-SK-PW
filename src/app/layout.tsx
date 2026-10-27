import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

import { AuthProvider } from "@/context/AuthContext";
import { CockpitProvider } from "@/context/CockpitContext";

export const metadata: Metadata = {
  title: "Classroom OS — The Relay Cockpit",
  description: "ระบบจัดการชั้นเรียน บันทึกเวลาเรียน และรายงาน ปพ.5 ตามเกณฑ์ สพฐ. (50:50 Dual-Term Continuity)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${notoSansThai.variable} font-sans h-full antialiased`}>
      <body className="min-h-screen bg-background antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
        <AuthProvider>
          <CockpitProvider>
            {children}
          </CockpitProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
