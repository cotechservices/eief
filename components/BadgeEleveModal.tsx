// components/BadgeEleveModal.tsx
"use client";

import React, { useRef } from "react";
import { X, Printer, Download, Phone, MapPin, User, ShieldCheck, GraduationCap } from "lucide-react";

interface EleveBadgeProps {
  isOpen: boolean;
  onClose: () => void;
  eleve: {
    id: number;
    matricule: string;
    enfant_nom: string;
    enfant_prenom: string;
    date_naissance?: string;
    lieu_naissance?: string;
    sexe?: string;
    niveau?: string;
    classe_nom?: string;
    photo_url?: string | null;
    parent_nom?: string;
    parent_prenom?: string;
    parent_telephone?: string;
    parent_email?: string;
  } | null;
}

export default function BadgeEleveModal({ isOpen, onClose, eleve }: EleveBadgeProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !eleve) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const win = window.open("", "", "width=800,height=900");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Carte d'Élève - ${eleve.enfant_prenom} ${eleve.enfant_nom}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 20px; background: white; }
              .no-print { display: none !important; }
              .badge-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body className="bg-gray-100 flex flex-col items-center justify-center p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            ${printContent.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // URL du QR code statique scannable encodant le matricule et le nom de l'élève
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `EIEF-ELEVE:${eleve.matricule}:${eleve.enfant_prenom}_${eleve.enfant_nom}`
  )}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* En-tête du Modal */}
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-blue-950 font-black rounded-lg flex items-center justify-center shadow-md">
              🪪
            </div>
            <div>
              <h2 className="text-xl font-bold">Carte d'Élève Officielle</h2>
              <p className="text-xs text-blue-200">
                Aperçu et impression pour <span className="font-semibold text-amber-300">{eleve.enfant_prenom} {eleve.enfant_nom}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition p-2 hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corps du Modal - Aperçu des cartes (Recto & Verso) */}
        <div className="p-6 bg-gray-50 flex flex-col items-center space-y-6">
          <div ref={printRef} className="flex flex-col md:flex-row gap-6 items-center justify-center">

            {/* ==================== RECTO DU BADGE ==================== */}
            <div className="badge-card w-[340px] h-[215px] bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 rounded-2xl shadow-xl text-white p-3.5 relative overflow-hidden border-2 border-amber-400/40 flex flex-col justify-between shrink-0">

              {/* Effet visuel d'arrière-plan */}
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-blue-400/10 rounded-full blur-xl pointer-events-none"></div>

              {/* En-tête École */}
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-400 text-blue-950 rounded-lg font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                    EIEF
                  </div>
                  <div>
                    <h3 className="font-bold text-xs tracking-tight leading-none text-amber-300">
                      ÉCOLE I.E.F
                    </h3>
                    <p className="text-[9px] text-blue-100 opacity-90 leading-tight">
                      Internationale des Élites
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="bg-amber-400 text-blue-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    2025 - 2026
                  </span>
                </div>
              </div>

              {/* Contenu Principal du Recto */}
              <div className="flex gap-3 items-center my-auto">
                {/* Photo de l'élève */}
                <div className="relative shrink-0">
                  {eleve.photo_url ? (
                    <img
                      src={eleve.photo_url}
                      alt={`${eleve.enfant_prenom} ${eleve.enfant_nom}`}
                      className="w-16 h-20 rounded-xl object-cover border-2 border-amber-400 shadow-md bg-white"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-blue-800 rounded-xl flex items-center justify-center border-2 border-amber-400 shadow-md">
                      <User className="w-9 h-9 text-amber-300" />
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-blue-900 shadow-sm" title="Élève Régulier"></span>
                </div>

                {/* Infos Élève */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  <h4 className="font-black text-sm text-white truncate leading-tight uppercase tracking-tight">
                    {eleve.enfant_prenom} {eleve.enfant_nom}
                  </h4>

                  <div className="text-[10px] space-y-0.5 text-blue-100">
                    <div className="flex items-center gap-1 font-semibold text-amber-200">
                      <GraduationCap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{eleve.classe_nom || "Classe N/A"}</span>
                      {eleve.niveau && <span className="opacity-75">({eleve.niveau})</span>}
                    </div>

                    <div className="text-[9.5px] opacity-90">
                      Matricule: <span className="font-bold text-white tracking-wide">{eleve.matricule || "N/A"}</span>
                    </div>

                    {eleve.enfant_email ? (
                      <div className="text-[8.5px] opacity-90 truncate">
                        Email: <span className="font-mono text-white">{eleve.enfant_email}</span>
                      </div>
                    ) : eleve.date_naissance ? (
                      <div className="text-[9px] opacity-80">
                        Né(e) le: {eleve.date_naissance}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* QR Code Scannable */}
                <div className="shrink-0 bg-white p-1 rounded-lg border border-amber-400/50 shadow-sm">
                  <img src={qrCodeUrl} alt="QR Code" className="w-11 h-11" />
                </div>
              </div>

              {/* Bas du Recto */}
              <div className="flex justify-between items-center border-t border-white/20 pt-1.5 text-[8.5px] text-blue-200 font-medium">
                <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Carte Officielle
                </span>
                <span className="tracking-widest font-mono text-white/80">{eleve.matricule}</span>
              </div>
            </div>


            {/* ==================== VERSO DU BADGE ==================== */}
            <div className="badge-card w-[340px] h-[215px] bg-white rounded-2xl shadow-xl text-gray-800 p-3.5 relative overflow-hidden border-2 border-blue-900/30 flex flex-col justify-between shrink-0">

              {/* En-tête Verso */}
              <div className="border-b pb-1.5 flex justify-between items-center">
                <h4 className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-600" /> Urgence & Contact Parent
                </h4>
                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">E.I.E.F</span>
              </div>

              {/* Infos Parent & Secours */}
              <div className="space-y-1.5 my-auto text-[10px] text-gray-700">
                <div className="bg-blue-50/70 p-2 rounded-lg border border-blue-100 space-y-1">
                  <p className="font-bold text-blue-950 text-[10.5px]">
                    Parent / Tuteur : <span className="font-medium text-blue-900">{eleve.parent_prenom} {eleve.parent_nom || "Non renseigné"}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-gray-800 font-semibold">
                    <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Tél: {eleve.parent_telephone || "+224 --- --- ---"}</span>
                  </p>
                  {eleve.parent_email && (
                    <p className="text-[9px] text-gray-600 truncate">
                      Email: {eleve.parent_email}
                    </p>
                  )}
                </div>

                <div className="text-[8.5px] text-gray-900 italic leading-tight text-center px-1">
                  "Cette carte est strictement personnelle. En cas de perte ou de sinistre, merci de contacter immédiatement le secrétariat de l'école."
                </div>
              </div>

              {/* Cachet & Signature */}
              <div className="border-t pt-1 flex justify-between items-end">
                <div className="text-[8px] text-gray-900">
                  <p className="font-semibold text-gray-600">E.I.E.F Conakry</p>
                  <p>République de Guinée</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-6 border-b border-dashed border-gray-900 flex items-center justify-center text-[7.5px] font-serif text-blue-900 italic font-bold">
                    Direction EIEF
                  </div>
                  <span className="text-[7px] text-gray-900 block uppercase tracking-tighter">Signature & Cachet</span>
                </div>
              </div>

            </div>

          </div>

          {/* Boutons d'Action */}
          <div className="flex gap-4 w-full max-w-md pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-lg hover:from-blue-800 hover:to-indigo-900 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              Imprimer le Badge
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-amber-400 text-blue-950 py-2.5 px-4 rounded-xl font-extrabold text-sm shadow-md hover:bg-amber-300 transition flex items-center justify-center gap-2 border border-amber-500/30"
            >
              <Download className="w-4 h-4" />
              Télécharger PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
