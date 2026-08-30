import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // ⭐ Récupérer le prix moyen des lignes de transport
        const result = await query(`
            SELECT 
                AVG(prix_abonnement) as prix_moyen,
                MIN(prix_abonnement) as prix_min,
                MAX(prix_abonnement) as prix_max
            FROM lignes_transport 
            WHERE prix_abonnement IS NOT NULL AND prix_abonnement > 0
        `);

        if (result.rows.length === 0 || !result.rows[0].prix_moyen) {
            // ⭐ Valeur par défaut
            return NextResponse.json({ 
                prix_mensuel: 200000,
                source: "default"
            });
        }

        const row = result.rows[0];
        const prixMoyen = Math.round(Number(row.prix_moyen));

        return NextResponse.json({
            prix_mensuel: prixMoyen,
            prix_min: Number(row.prix_min),
            prix_max: Number(row.prix_max),
            source: "moyenne_lignes"
        });

    } catch (error) {
        console.error("Erreur récupération prix transport:", error);
        return NextResponse.json(
            { error: "Erreur serveur" }, 
            { status: 500 }
        );
    }
}