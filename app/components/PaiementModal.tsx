// app/components/PaiementModal.tsx
"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Wallet, X } from "lucide-react";

interface PaiementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preinscriptionId: number;
  enfantNom: string;
  montantFrais?: number;
}

export default function PaiementModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preinscriptionId, 
  enfantNom,
  montantFrais = 500000 
}: PaiementModalProps) {
  const [modePaiement, setModePaiement] = useState<string>("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [montant, setMontant] = useState(montantFrais);

  const handlePaiement = async () => {
    if (!modePaiement) {
      alert("Veuillez choisir un mode de paiement");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/preinscriptions/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preinscriptionId,
          montant,
          modePaiement,
          reference: reference || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Paiement enregistré avec succès !");
        onSuccess();
        onClose();
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (error) {
      console.error("Erreur paiement:", error);
      alert("Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Paiement des frais</h2>
          <button onClick={onClose} className="text-gray-900 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Enfant concerné</p>
            <p className="font-semibold text-gray-800">{enfantNom}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{montant.toLocaleString()} GNF</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Mode de paiement *</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setModePaiement("especes")}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                  modePaiement === "especes" 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Wallet className="w-6 h-6 text-green-600" />
                <span className="text-xs">Espèces</span>
              </button>

              <button
                type="button"
                onClick={() => setModePaiement("orange_money")}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                  modePaiement === "orange_money" 
                    ? "border-orange-500 bg-orange-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Smartphone className="w-6 h-6 text-orange-600" />
                <span className="text-xs">Orange Money</span>
              </button>

              <button
                type="button"
                onClick={() => setModePaiement("carte")}
                className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                  modePaiement === "carte" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CreditCard className="w-6 h-6 text-blue-600" />
                <span className="text-xs">Carte Visa</span>
              </button>
            </div>
          </div>

          {modePaiement === "orange_money" && (
            <div>
              <label className="block text-gray-700 mb-2">Numéro de transaction Orange Money</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: #OM-123456789"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Entrez le numéro de transaction reçu par SMS</p>
            </div>
          )}

          {modePaiement === "carte" && (
            <div>
              <label className="block text-gray-700 mb-2">Numéro de transaction Carte</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: VISA-****-1234"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {modePaiement === "especes" && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Paiement en espèces à effectuer à la caisse de l'école.
                Le reçu vous sera remis sur place.
              </p>
            </div>
          )}

          <button
            onClick={handlePaiement}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {loading ? "Traitement en cours..." : "Confirmer le paiement"}
          </button>
        </div>
      </div>
    </div>
  );
}