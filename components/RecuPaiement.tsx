"use client";

import { useRef, useState, useEffect } from "react";
import { X, Printer, CheckCircle, History, Users, ListChecks, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface EnfantInfo {
  nom: string;
  prenom?: string;
  classe?: string;
}

interface DetailsFraisRecu {
  scolarite?: number;
  inscription?: number;
  reinscription?: number;
  cantine?: number;
  transport?: number;
  librairie?: number;
  fournitures?: number;
  total?: number;
  paye?: number;
  reste?: number;
}

interface LignePrestation {
  designation: string;
  montant: number;
  type?: string;
}

interface RecuData {
  numero_recu: string;
  date_paiement: string;
  enfant: string;
  montant: number;
  mode_paiement: string;
  type_frais: string;
  reference: string;
  classe?: string;
  parent_nom?: string;
  parent_email?: string;
  source: string;
  montant_total?: number;
  reste_a_payer?: number;
  preinscription_id?: number;
  paiement_id?: number;
  is_global?: boolean;
  enfants_liste?: Array<EnfantInfo | string>;
  details_frais?: DetailsFraisRecu;
  lignes_frais?: LignePrestation[];
}

interface HistoriquePaiement {
  id: number;
  montant: number;
  mode_paiement: string;
  date_paiement: string;
  reference: string;
  type_frais: string;
}

interface RecuPaiementProps {
  recu: RecuData;
  onClose: () => void;
  onDelete?: () => void;
  onDeleted?: () => void;
}

const MODE_LABELS: Record<string, string> = {
  especes: "Espèces",
  orange_money: "Orange Money",
  mtn_money: "MTN Money",
  carte: "Carte bancaire",
  virement: "Virement bancaire",
  cheque: "Chèque",
};

const TYPE_LABELS: Record<string, string> = {
  inscription: "Frais de scolarité",
  preinscription: "Frais de scolarité",
  "Frais de pré-inscription": "Frais de scolarité",
  "Frais d'inscription": "Frais de scolarité",
  reinscription: "Frais de réinscription",
  "Frais de réinscription": "Frais de réinscription",
  scolarite: "Frais de scolarité",
  "Frais de scolarité": "Frais de scolarité",
  global: "Paiement global - Scolarité",
  "Paiement global": "Paiement global - Scolarité",
  cantine: "Frais de cantine",
  transport: "Frais de transport",
  librairie: "Fournitures scolaires",
  fournitures: "Fournitures scolaires",
};

export default function RecuPaiement({ recu, onClose, onDelete }: RecuPaiementProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [historique, setHistorique] = useState<HistoriquePaiement[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);
  const [detailsFrais, setDetailsFrais] = useState<DetailsFraisRecu | null>(recu.details_frais || null);

  // États pour la confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ⭐ Récupérer l'historique et les détails complets des frais pour cette pré-inscription si nécessaire
  useEffect(() => {
    const fetchData = async () => {
      if (!recu.preinscription_id) return;

      setLoadingHistorique(true);
      try {
        const [histRes, preinscRes] = await Promise.all([
          fetch(`/api/parent/paiements?preinscriptionId=${recu.preinscription_id}`),
          !detailsFrais ? fetch(`/api/parent/preinscriptions/${recu.preinscription_id}`) : Promise.resolve(null)
        ]);

        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData && histData.length > 0) {
            setHistorique(histData);
          }
        }

        if (preinscRes && preinscRes.ok) {
          const preinscData = await preinscRes.json();
          if (preinscData && preinscData.details_frais) {
            setDetailsFrais(preinscData.details_frais);
          }
        }
      } catch (error) {
        console.error("Erreur chargement données reçu:", error);
      } finally {
        setLoadingHistorique(false);
      }
    };

    fetchData();
  }, [recu.preinscription_id]);

  const modeLabel = MODE_LABELS[recu.mode_paiement] || recu.mode_paiement || "Espèces";
  const typeLabel = TYPE_LABELS[recu.type_frais] || (recu.type_frais ? TYPE_LABELS[recu.type_frais.toLowerCase()] : null) || "Frais de scolarité";
  const estSolde = (recu.reste_a_payer || 0) <= 0;
  const totalPaye = (recu.montant_total || 0) - (recu.reste_a_payer || 0);

  const isPaiementGlobal = recu.is_global ||
    recu.type_frais === 'global' ||
    recu.type_frais === 'Paiement Global' ||
    (recu.enfants_liste && recu.enfants_liste.length > 0);

  // ⭐ Construction des lignes de facturation détaillées
  const buildLignesPrestations = (): LignePrestation[] => {
    if (recu.lignes_frais && recu.lignes_frais.length > 0) {
      return recu.lignes_frais;
    }

    if (detailsFrais) {
      const lignes: LignePrestation[] = [];
      const montantScolarite = Number(detailsFrais.scolarite || detailsFrais.inscription || detailsFrais.reinscription || 0);
      if (montantScolarite > 0) {
        lignes.push({
          designation: "Frais de scolarité",
          montant: montantScolarite,
          type: "scolarite"
        });
      }

      const montantCantine = Number(detailsFrais.cantine || 0);
      if (montantCantine > 0) {
        lignes.push({
          designation: "Frais de cantine scolaire",
          montant: montantCantine,
          type: "cantine"
        });
      }

      const montantTransport = Number(detailsFrais.transport || 0);
      if (montantTransport > 0) {
        lignes.push({
          designation: "Frais de transport scolaire",
          montant: montantTransport,
          type: "transport"
        });
      }

      const montantFournitures = Number(detailsFrais.fournitures || detailsFrais.librairie || 0);
      if (montantFournitures > 0) {
        lignes.push({
          designation: "Fournitures scolaires & Librairie",
          montant: montantFournitures,
          type: "fournitures"
        });
      }

      if (lignes.length > 0) {
        return lignes;
      }
    }

    // Ligne unique par défaut
    return [
      {
        designation: typeLabel,
        montant: Number(recu.montant_total || recu.montant || 0),
        type: recu.type_frais
      }
    ];
  };

  const lignesPrestations = buildLignesPrestations();
  const totalLignes = lignesPrestations.reduce((acc, l) => acc + l.montant, 0);

  // ⭐ Fonction pour supprimer le paiement/facture sans toucher au parent ni à l'élève
  const handleDeletePaiement = async () => {
    const idToDelete = recu.paiement_id || (recu as any).source_id || (recu as any).id;
    if (!idToDelete) {
      setDeleteError("Identifiant du paiement introuvable pour la suppression.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/paiements/${idToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression de la facture");
      }

      setShowDeleteModal(false);
      if (onDelete) {
        onDelete();
      }
      if (onDeleted) {
        onDeleted();
      }
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=850,height=750");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <base href="${window.location.origin}" />
        <title>Facture / Reçu — ${recu.numero_recu}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: white; color: #1a1a2e; padding: 30px; }
          .recu { max-width: 720px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
          .header-brand { display: flex; align-items: center; gap: 16px; }
          .logo-img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; border: 2px solid rgba(255,255,255,0.8); background: #ffffff; flex-shrink: 0; }
          .school-info h1 { font-size: 19px; font-weight: 700; letter-spacing: -0.5px; }
          .school-info h4 { font-size: 12px; opacity: 0.9; margin-top: 2px; }
          .school-info .contacts { font-size: 11px; opacity: 0.95; margin-top: 3px; font-weight: 500; }
          .recu-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; padding: 10px 16px; text-align: right; }
          .recu-badge .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
          .recu-badge .number { font-size: 16px; font-weight: 700; font-family: monospace; }
          .stamp { background: #f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 10px 36px; display: flex; align-items: center; gap: 8px; }
          .stamp span { font-size: 13px; font-weight: 600; color: #15803d; }
          .body { padding: 28px 36px; }
          .montants-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
          .montant-card { border-radius: 8px; padding: 12px 16px; text-align: center; }
          .montant-card.paye { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .montant-card.total { background: #eff6ff; border: 1px solid #bfdbfe; }
          .montant-card.reste { background: #fef2f2; border: 1px solid #fecaca; }
          .montant-card.reste.solde { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .montant-card .label { font-size: 11px; font-weight: 500; }
          .montant-card .amount { font-size: 18px; font-weight: 700; margin-top: 2px; }
          .montant-card.paye .label, .montant-card.paye .amount { color: #15803d; }
          .montant-card.total .label, .montant-card.total .amount { color: #2563eb; }
          .montant-card.reste .label, .montant-card.reste .amount { color: #dc2626; }
          .montant-card.reste.solde .label, .montant-card.reste.solde .amount { color: #15803d; }
          .prestations-section { margin-top: 16px; margin-bottom: 20px; }
          .section-title { font-size: 12px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .prestations-table { width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .prestations-table th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
          .prestations-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
          .prestations-table tfoot td { background: #f8fafc; padding: 10px 14px; border-top: 2px solid #e2e8f0; font-weight: 700; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 16px; margin-bottom: 20px; }
          .info-label { font-size: 11px; color: #64748b; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .info-val { font-size: 14px; font-weight: 600; color: #1e293b; }
          .signataires-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
          .signataire-box { text-align: center; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .signataire-role { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .signataire-name { font-size: 14px; font-weight: 700; color: #1e3a5f; margin-top: 6px; }
          .enfants-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-top: 16px; margin-bottom: 16px; }
          .enfants-box h4 { font-size: 11px; color: #1e3a5f; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .enfants-table { width: 100%; font-size: 12px; border-collapse: collapse; }
          .enfants-table th { padding: 4px 8px; text-align: left; color: #64748b; border-bottom: 1px solid #cbd5e1; font-size: 11px; }
          .enfants-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-weight: 500; }
          .footer { background: #f8fafc; padding: 16px 36px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .footer .note { font-size: 11px; color: #94a3b8; max-width: 320px; line-height: 1.4; }
          .footer .date { font-size: 11px; color: #94a3b8; text-align: right; }
          .historique-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          .historique-table th { background: #f8fafc; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
          .historique-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const dateFormatted = recu.date_paiement
    ? new Date(recu.date_paiement).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Barre d'action */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2.5">
            <img
              src="/img/logo.jpg"
              alt="Logo EIEF"
              className="w-7 h-7 rounded-md object-cover border border-gray-200"
            />
            <span className="text-lg font-extrabold text-blue-700">EIEF</span> — Reçu de Paiement
          </h2>
          <div className="flex items-center gap-2">
            {/* ⭐ BOUTON SUPPRIMER LA FACTURE / LE PAIEMENT */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium"
              title="Supprimer cette facture et annuler le paiement"
            >
              <Trash2 className="w-4 h-4 text-red-600" /> Supprimer
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <X className="w-4 h-4 text-gray-900" />
            </button>
          </div>
        </div>

        {/* Contenu imprimable */}
        <div className="overflow-y-auto max-h-[75vh]">
          <div ref={printRef}>
            <div className="recu" style={{ fontFamily: "'Inter', sans-serif" }}>
              {/* En-tête avec coordonnées complètes de l'école */}
              <div
                className="header"
                style={{
                  background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                  color: "white",
                  padding: "24px 32px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div className="header-brand" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <img
                    src="/img/logo.jpg"
                    alt="Logo EIEF"
                    className="logo-img"
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      objectFit: "cover",
                      border: "2px solid rgba(255, 255, 255, 0.8)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      backgroundColor: "#ffffff",
                      flexShrink: 0,
                    }}
                  />
                  <div className="school-info">
                    <h1 style={{ fontSize: "19px", fontWeight: 700, letterSpacing: "-0.5px" }}>
                      École Internationale les Enfants du Futur
                    </h1>
                    <h4 style={{ fontSize: "12px", opacity: 0.9, marginTop: "2px" }}>
                      Coyah-Sanoyah, Conakry-Guinée
                    </h4>
                    <p className="contacts" style={{ fontSize: "11px", opacity: 0.95, marginTop: "3px", fontWeight: 500 }}>
                      📞 Tél : 628 84 84 37 — 611 24 24 92 — 628 52 73 57
                    </p>
                  </div>
                </div>
                <div
                  className="recu-badge"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    textAlign: "right",
                  }}
                >
                  <div className="label" style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Facture / Reçu N°
                  </div>
                  <div className="number" style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>
                    {recu.numero_recu}
                  </div>
                </div>
              </div>

              {/* Tampon payé */}
              <div
                className="stamp"
                style={{
                  background: "#f0fdf4",
                  borderBottom: "1px solid #bbf7d0",
                  padding: "10px 36px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle style={{ width: "16px", height: "16px", color: "#16a34a" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>
                  PAIEMENT VALIDÉ — Ce reçu atteste du règlement des frais scolaires
                </span>
              </div>

              {/* Corps */}
              <div className="body" style={{ padding: "28px 36px" }}>
                {/* Montants Récapitulatifs */}
                <div className="montants-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <div className="montant-card total" style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    textAlign: "center"
                  }}>
                    <div className="label" style={{ fontSize: "11px", color: "#2563eb", fontWeight: 500 }}>
                      Montant total
                    </div>
                    <div className="amount" style={{ fontSize: "18px", fontWeight: 700, color: "#2563eb" }}>
                      {Number(recu.montant_total || recu.montant || 0).toLocaleString("fr-FR")} GNF
                    </div>
                  </div>

                  <div className="montant-card paye" style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    textAlign: "center"
                  }}>
                    <div className="label" style={{ fontSize: "11px", color: "#15803d", fontWeight: 500 }}>
                      Montant payé
                    </div>
                    <div className="amount" style={{ fontSize: "18px", fontWeight: 700, color: "#15803d" }}>
                      {(totalPaye > 0 ? totalPaye : recu.montant).toLocaleString("fr-FR")} GNF
                    </div>
                  </div>

                  <div className={`montant-card reste ${estSolde ? 'solde' : ''}`} style={{
                    background: estSolde ? "#f0fdf4" : "#fef2f2",
                    border: estSolde ? "1px solid #bbf7d0" : "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    textAlign: "center"
                  }}>
                    <div className="label" style={{
                      fontSize: "11px",
                      color: estSolde ? "#15803d" : "#dc2626",
                      fontWeight: 500
                    }}>
                      {estSolde ? "✅ Entièrement payé" : "Reste à payer"}
                    </div>
                    <div className="amount" style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: estSolde ? "#15803d" : "#dc2626"
                    }}>
                      {Number(recu.reste_a_payer || 0).toLocaleString("fr-FR")} GNF
                    </div>
                  </div>
                </div>

                {/* ⭐⭐ LIGNES DE FACTURATION DÉTAILLÉES (SCOLARITÉ, CANTINE, TRANSPORT, FOURNITURES...) ⭐⭐ */}
                <div className="prestations-section" style={{ marginTop: "16px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ListChecks style={{ width: "16px", height: "16px", color: "#2563eb" }} />
                    Détail des prestations facturées
                  </div>
                  <table className="prestations-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                          Désignation de la prestation
                        </th>
                        <th style={{ padding: "10px 14px", textAlign: "right", fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                          Montant (GNF)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignesPrestations.map((ligne, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 600, color: "#1e293b" }}>
                            {ligne.designation}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
                            {ligne.montant.toLocaleString("fr-FR")} GNF
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e293b" }}>
                          Total des prestations
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 800, color: "#1e3a5f", fontSize: "15px" }}>
                          {(totalLignes > 0 ? totalLignes : Number(recu.montant_total || recu.montant || 0)).toLocaleString("fr-FR")} GNF
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* ⭐ LISTE DES ENFANTS EN CAS DE PAIEMENT GLOBAL ⭐ */}
                {isPaiementGlobal && recu.enfants_liste && recu.enfants_liste.length > 0 && (
                  <div className="enfants-box" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
                    <h4 style={{ fontSize: "11px", color: "#1e3a5f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users style={{ width: "14px", height: "14px", color: "#2563eb" }} />
                      Enfants concernés par le paiement global ({recu.enfants_liste.length})
                    </h4>
                    <table className="enfants-table" style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #cbd5e1", color: "#64748b", textAlign: "left" }}>
                          <th style={{ padding: "4px 8px" }}>N°</th>
                          <th style={{ padding: "4px 8px" }}>Élève</th>
                          <th style={{ padding: "4px 8px" }}>Classe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recu.enfants_liste.map((enf: any, idx: number) => {
                          const nomComplet = typeof enf === 'string'
                            ? enf
                            : `${enf.prenom || ''} ${enf.nom || ''}`.trim();
                          const classe = typeof enf === 'object' ? enf.classe || '—' : '—';
                          return (
                            <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ padding: "6px 8px", color: "#64748b" }}>#{idx + 1}</td>
                              <td style={{ padding: "6px 8px", fontWeight: 600, color: "#1e293b" }}>{nomComplet}</td>
                              <td style={{ padding: "6px 8px", color: "#64748b" }}>{classe}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ⭐ HISTORIQUE DES PAIEMENTS ⭐ */}
                {historique.length > 0 && (
                  <>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#1e293b",
                      marginTop: "16px",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      <History style={{ width: "16px", height: "16px", color: "#2563eb" }} />
                      Historique des versements
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#94a3b8", marginLeft: "4px", textTransform: "none" }}>
                        ({historique.length} versement{historique.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <table className="historique-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "8px 10px", textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                            N°
                          </th>
                          <th style={{ padding: "8px 10px", textAlign: "right", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                            Montant
                          </th>
                          <th style={{ padding: "8px 10px", textAlign: "center", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                            Mode
                          </th>
                          <th style={{ padding: "8px 10px", textAlign: "center", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                            Date
                          </th>
                          <th style={{ padding: "8px 10px", textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                            Référence
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historique.map((p, index) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 10px", fontWeight: 500, color: "#64748b" }}>
                              #{index + 1}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#15803d" }}>
                              {Number(p.montant).toLocaleString("fr-FR")} GNF
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>
                              {MODE_LABELS[p.mode_paiement] || p.mode_paiement}
                            </td>
                            <td style={{ padding: "8px 10px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>
                              {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td style={{ padding: "8px 10px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                              {p.reference || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {/* Grille d'informations */}
                <div className="info-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px", marginBottom: "16px" }}>
                  {!isPaiementGlobal && (
                    <>
                      <div>
                        <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                          Élève concerné
                        </div>
                        <div className="info-val" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{recu.enfant || "—"}</div>
                      </div>
                      <div>
                        <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                          Classe
                        </div>
                        <div className="info-val" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{recu.classe || "—"}</div>
                      </div>
                    </>
                  )}
                  <div>
                    <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Type de frais
                    </div>
                    <div className="info-val" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{typeLabel}</div>
                  </div>
                  <div>
                    <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Mode de règlement
                    </div>
                    <div className="info-val" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{modeLabel}</div>
                  </div>
                  {recu.parent_nom && (
                    <div>
                      <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                        Parent / Tuteur
                      </div>
                      <div className="info-val" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{recu.parent_nom}</div>
                    </div>
                  )}
                  <div>
                    <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Date du règlement
                    </div>
                    <div className="info-val" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{dateFormatted}</div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <div className="info-label" style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Référence de transaction
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#475569", fontFamily: "monospace" }}>
                      {recu.reference || "—"}
                    </div>
                  </div>
                </div>

                {/* ⭐ SIGNATAIRES OFFICIELS (DIRECTEUR & COMPTABLE) ⭐ */}
                <div className="signataires-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px", borderTop: "1px dashed #e2e8f0", paddingTop: "18px" }}>
                  <div className="signataire-box" style={{ textAlign: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <p className="signataire-role" style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      La Comptable
                    </p>
                    <p className="signataire-name" style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a5f", marginTop: "6px" }}>
                      Fanta KOUNDOUNO
                    </p>
                  </div>
                  <div className="signataire-box" style={{ textAlign: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <p className="signataire-role" style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Le Directeur
                    </p>
                    <p className="signataire-name" style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a5f", marginTop: "6px" }}>
                      Basile Fara OUENDENO
                    </p>
                  </div>
                </div>
              </div>

              {/* Pied de page */}
              <div
                className="footer"
                style={{
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  padding: "16px 36px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p className="note" style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "320px", lineHeight: 1.4 }}>
                  Document officiel de l'École Internationale les Enfants du Futur (EIEF).
                </p>
                <p className="date" style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Édité le {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⭐ MODAL DE CONFIRMATION DE SUPPRESSION DE LA FACTURE / PAIEMENT */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Supprimer cette facture ?</h3>
                <p className="text-xs text-gray-900">Reçu N° {recu.numero_recu}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-900">
                Êtes-vous sûr de vouloir supprimer le paiement de{" "}
                <strong className="text-gray-900 font-bold">
                  {Number(recu.montant).toLocaleString("fr-FR")} GNF
                </strong>{" "}
                pour <strong className="text-gray-900">{recu.enfant || "cet élève"}</strong> ?
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 space-y-1">
                <p className="font-semibold">🛡️ Sécurité des données :</p>
                <p>• Le compte du parent et des enfants <span className="font-bold">restent intacts</span>.</p>
                <p>• Le solde restant dû sera automatiquement recalculé.</p>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm text-gray-900 border rounded-lg hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDeletePaiement}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 font-medium"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmer la suppression
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}