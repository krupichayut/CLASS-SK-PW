import { NextResponse } from "next/server";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { generateAllTerm1VaultDocs } from "@/lib/data/term1SeedData";

export async function POST() {
  try {
    const allVaults = generateAllTerm1VaultDocs();
    const batch = writeBatch(db);
    const count = Object.keys(allVaults).length;

    for (const [docId, vaultData] of Object.entries(allVaults)) {
      // 1. Write to term1Baselines (used by Classroom OS services)
      const refBaselines = doc(db, "term1Baselines", docId);
      batch.set(refBaselines, {
        ...vaultData,
        updatedAt: new Date()
      }, { merge: true });

      // 2. Also write to term1_vault (for direct vault indexing)
      const refVault = doc(db, "term1_vault", docId);
      batch.set(refVault, {
        ...vaultData,
        updatedAt: new Date()
      }, { merge: true });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Seeded ${count} Term 1 Vaults to Firestore successfully (term1Baselines & term1_vault)`,
      vaultIds: Object.keys(allVaults),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error seeding Term 1 data:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Unknown error seeding Term 1 data"
    }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
