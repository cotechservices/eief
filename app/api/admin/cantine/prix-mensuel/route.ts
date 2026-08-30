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

        // ⭐ Récupérer le dernier prix mensuel configuré
        const result = await query(`
            SELECT 
                prix as prix_mensuel,
                prix_annuel,
                CASE 
                    WHEN prix_annuel IS NOT NULL AND prix_annuel > 0 
                    THEN prix_annuel / 9 
                    ELSE prix 
                END as prix_calcule
            FROM cantine_menus 
            WHERE prix IS NOT NULL OR prix_annuel IS NOT NULL
            ORDER BY date DESC 
            LIMIT 1
        `);

        if (result.rows.length === 0) {
            // ⭐ Valeur par défaut si aucun prix n'est configuré
            return NextResponse.json({ 
                prix_mensuel: 150000,
                prix_annuel: 1350000,
                source: "default"
            });
        }

        const row = result.rows[0];
        const prixMensuel = row.prix_mensuel || row.prix_calcule || 150000;

        return NextResponse.json({
            prix_mensuel: Number(prixMensuel),
            prix_annuel: Number(row.prix_annuel) || null,
            source: row.prix_annuel ? "annuel" : "mensuel"
        });

    } catch (error) {
        console.error("Erreur récupération prix cantine:", error);
        return NextResponse.json(
            { error: "Erreur serveur" }, 
            { status: 500 }
        );
    }
}