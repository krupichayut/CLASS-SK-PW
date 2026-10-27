import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090A0F]" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
