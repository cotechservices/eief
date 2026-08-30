"use client";

import { useRef, useState, useEffect } from "react";
import { X, Printer, CheckCircle, History } from "lucide-react";

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
}

const MODE_LABELS: Record<string, string> = {
  especes: "Espèces",
  orange_money: "Orange Money",
  carte: "Carte bancaire",
  virement: "Virement bancaire",
  cheque: "Chèque",
};

const TYPE_LABELS: Record<string, string> = {
  inscription: "Frais de pré-inscription",
  reinscription: "Frais de réinscription",
  scolarite: "Frais de scolarité",
  cantine: "Frais de cantine",
  transport: "Frais de transport",
  librairie: "Fournitures scolaires",
  "Frais de pré-inscription": "Frais de pré-inscription",
  "Frais de réinscription": "Frais de réinscription",
  "Frais de scolarité": "Frais de scolarité",
};

export default function RecuPaiement({ recu, onClose }: RecuPaiementProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [historique, setHistorique] = useState<HistoriquePaiement[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  // ⭐ Récupérer l'historique des paiements pour cette pré-inscription
  useEffect(() => {
    const fetchHistorique = async () => {
      if (!recu.preinscription_id) return;
      
      setLoadingHistorique(true);
      try {
        const response = await fetch(`/api/parent/paiements?preinscriptionId=${recu.preinscription_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setHistorique(data);
          }
        }
      } catch (error) {
        console.error("Erreur chargement historique:", error);
      } finally {
        setLoadingHistorique(false);
      }
    };

    fetchHistorique();
  }, [recu.preinscription_id]);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Reçu de Paiement — ${recu.numero_recu}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: white; color: #1a1a2e; padding: 40px; }
          .recu { max-width: 720px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; }
          .school-info h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .school-info p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
          .recu-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 10px; padding: 10px 16px; text-align: right; }
          .recu-badge .label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
          .recu-badge .number { font-size: 16px; font-weight: 700; font-family: monospace; }
          .stamp { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 40px; display: flex; align-items: center; gap: 8px; }
          .stamp span { font-size: 13px; font-weight: 600; color: #15803d; }
          .body { padding: 32px 40px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 600; margin-bottom: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
          .info-item label { font-size: 11px; color: #64748b; margin-bottom: 2px; display: block; }
          .info-item value, .info-item .val { font-size: 14px; font-weight: 500; color: #1e293b; }
          .amount-box { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .amount-box .label { font-size: 12px; color: #0369a1; font-weight: 500; }
          .amount-box .amount { font-size: 36px; font-weight: 800; color: #1e3a5f; margin: 4px 0; }
          .amount-box .currency { font-size: 14px; color: #0369a1; }
          .divider { border: none; border-top: 1px dashed #e2e8f0; margin: 24px 0; }
          .footer { background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .footer .note { font-size: 11px; color: #94a3b8; max-width: 300px; line-height: 1.5; }
          .footer .date { font-size: 12px; color: #64748b; text-align: right; }
          .signature { margin-top: 32px; display: flex; justify-content: flex-end; }
          .signature-box { border-top: 2px solid #1e3a5f; padding-top: 8px; width: 200px; text-align: center; }
          .signature-box p { font-size: 11px; color: #64748b; }
          .montants-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
          .montant-card { border-radius: 8px; padding: 12px 16px; text-align: center; }
          .montant-card.paye { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .montant-card.total { background: #eff6ff; border: 1px solid #bfdbfe; }
          .montant-card.reste { background: #fef2f2; border: 1px solid #fecaca; }
          .montant-card.reste.solde { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .montant-card .label { font-size: 11px; font-weight: 500; }
          .montant-card .amount { font-size: 18px; font-weight: 700; margin-top: 2px; }
          .montant-card.paye .label { color: #15803d; }
          .montant-card.paye .amount { color: #15803d; }
          .montant-card.total .label { color: #2563eb; }
          .montant-card.total .amount { color: #2563eb; }
          .montant-card.reste .label { color: #dc2626; }
          .montant-card.reste .amount { color: #dc2626; }
          .montant-card.reste.solde .label { color: #15803d; }
          .montant-card.reste.solde .amount { color: #15803d; }
          .historique-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
          .historique-table th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
          .historique-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
          .historique-table tr:hover { background: #f8fafc; }
          .historique-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 20px 0 8px 0; display: flex; align-items: center; gap: 8px; }
          .total-paye { font-weight: 700; color: #15803d; }
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

  const modeLabel = MODE_LABELS[recu.mode_paiement] || recu.mode_paiement;
  const typeLabel = TYPE_LABELS[recu.type_frais] || recu.type_frais;
  const estSolde = (recu.reste_a_payer || 0) <= 0;
  const totalPaye = (recu.montant_total || 0) - (recu.reste_a_payer || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Barre d'action */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-lg">EIEF - </span> Reçu de Paiement
          </h2>
          <div className="flex items-center gap-2">
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
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Contenu imprimable */}
        <div className="overflow-y-auto max-h-[75vh]">
          <div ref={printRef}>
            <div className="recu" style={{ fontFamily: "'Inter', sans-serif" }}>
              {/* En-tête */}
              <div
                className="header"
                style={{
                  background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                  color: "white",
                  padding: "32px 40px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div className="school-info">
                  <h1 style={{ fontSize: "22px", fontWeight: 700 }}> École Internationale les Enfants du Futur</h1>
                  <h4 style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>
                    Coyah-Sanoyah, Conakry-Guinée
                  </h4>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    textAlign: "right",
                  }}
                >
                  <div style={{ fontSize: "10px", opacity: 0.7, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Reçu N°
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace" }}>
                    {recu.numero_recu}
                  </div>
                </div>
              </div>

              {/* Tampon payé */}
              <div
                style={{
                  background: "#f0fdf4",
                  borderBottom: "1px solid #bbf7d0",
                  padding: "10px 40px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle style={{ width: "16px", height: "16px", color: "#16a34a" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>
                  PAIEMENT VALIDÉ — Ce reçu confirme la réception du paiement
                </span>
              </div>

              {/* Corps */}
              <div style={{ padding: "32px 40px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
                  <div style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: 500 }}>
                      Montant total
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#2563eb" }}>
                      {Number(recu.montant_total || 0).toLocaleString("fr-FR")} GNF
                    </div>
                  </div>

                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "11px", color: "#15803d", fontWeight: 500 }}>
                      Montant payé
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#15803d" }}>
                      {totalPaye.toLocaleString("fr-FR")} GNF
                    </div>
                  </div>

                  <div style={{
                    background: estSolde ? "#f0fdf4" : "#fef2f2",
                    border: estSolde ? "1px solid #bbf7d0" : "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    textAlign: "center"
                  }}>
                    <div style={{ 
                      fontSize: "11px", 
                      color: estSolde ? "#15803d" : "#dc2626", 
                      fontWeight: 500 
                    }}>
                      {estSolde ? "✅ Entièrement payé" : "Reste à payer"}
                    </div>
                    <div style={{ 
                      fontSize: "18px", 
                      fontWeight: 700, 
                      color: estSolde ? "#15803d" : "#dc2626" 
                    }}>
                      {Number(recu.reste_a_payer || 0).toLocaleString("fr-FR")} GNF
                    </div>
                  </div>
                </div>

                {/* ⭐ HISTORIQUE DES PAIEMENTS ⭐ */}
                {historique.length > 0 && (
                  <>
                    <div style={{ 
                      fontSize: "14px", 
                      fontWeight: 600, 
                      color: "#1e293b", 
                      marginTop: "20px",
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <History style={{ width: "18px", height: "18px", color: "#2563eb" }} />
                      Historique des paiements
                      <span style={{ fontSize: "12px", fontWeight: 400, color: "#94a3b8", marginLeft: "4px" }}>
                        ({historique.length} paiement{historique.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <table className="historique-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "8px 12px", textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
                            N°
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "right", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
                            Montant
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "center", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
                            Mode
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "center", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
                            Date
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
                            Référence
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historique.map((p, index) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 500, color: "#64748b" }}>
                              #{index + 1}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#15803d" }}>
                              {Number(p.montant).toLocaleString("fr-FR")} GNF
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>
                              {MODE_LABELS[p.mode_paiement] || p.mode_paiement}
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", color: "#64748b" }}>
                              {p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                              {p.reference || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 700 }}>Total payé</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#15803d" }}>
                            {historique.reduce((acc, p) => acc + Number(p.montant), 0).toLocaleString("fr-FR")} GNF
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </>
                )}

                {/* Grille d'informations */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px", marginBottom: "20px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Élève concerné
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{recu.enfant || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Classe
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{recu.classe || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Type de frais
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{typeLabel}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Mode de paiement
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{modeLabel}</div>
                  </div>
                  {recu.parent_nom && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Parent / Tuteur
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{recu.parent_nom}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Référence
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#475569", fontFamily: "monospace" }}>
                      {recu.reference || "—"}
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div
                  style={{
                    borderTop: "1px dashed #e2e8f0",
                    paddingTop: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Date du paiement
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{dateFormatted}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px" }}>Signature & Cachet</div>
                    <div
                      style={{
                        width: "120px",
                        height: "50px",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "6px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Pied de page */}
              <div
                style={{
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                  padding: "16px 40px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: "#94a3b8", maxWidth: "300px", lineHeight: 1.5 }}>
                  Ce document est un reçu officiel délivré par l'EIEF. Conservez-le précieusement
                  comme preuve de votre paiement.
                </p>
                <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Imprimé le {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}