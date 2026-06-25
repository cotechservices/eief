// app/api/eleve/devoirs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ELEVE") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const eleveRes = await query(
      "SELECT id, classe_id FROM public.eleves WHERE utilisateur_id = $1",
      [userId]
    );
    if (eleveRes.rows.length === 0) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
    }
    const { id: eleveId, classe_id: classeId } = eleveRes.rows[0];

    // Devoirs de la classe de l'élève avec statut soumission
    const devoirsRes = await query(
      `SELECT 
        d.id,
        d.titre,
        d.description,
        d.fichier_url,
        d.date_limite,
        d.date_publication,
        m.nom AS matiere,
        CONCAT(u.prenom, ' ', u.nom) AS enseignant,
        sd.id AS soumission_id,
        sd.date_soumission,
        sd.note AS note_soumission,
        sd.commentaire AS commentaire_soumission,
        sd.est_retard
      FROM public.devoirs d
      JOIN public.enseignements en ON en.id = d.enseignement_id
      JOIN public.matieres m ON m.id = en.matiere_id
      JOIN public.personnels p ON p.id = en.enseignant_id
      JOIN public.utilisateurs u ON u.id = p.utilisateur_id
      LEFT JOIN public.soumissions_devoirs sd 
        ON sd.devoir_id = d.id AND sd.eleve_id = $1
      WHERE en.classe_id = $2
      ORDER BY d.date_limite ASC`,
      [eleveId, classeId]
    );

    const now = new Date();
    const devoirs = devoirsRes.rows.map((d) => {
      const dateLimite = new Date(d.date_limite);
      const statut = d.soumission_id
        ? "soumis"
        : dateLimite < now
        ? "en_retard"
        : "a_rendre";
      const joursRestants = Math.ceil((dateLimite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return { ...d, statut, joursRestants };
    });

    return NextResponse.json({ devoirs });
  } catch (error: any) {
    console.error("API /eleve/devoirs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
