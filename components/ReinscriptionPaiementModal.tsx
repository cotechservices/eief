// components/ReinscriptionPaiementModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2, Wallet, Smartphone, CreditCard, CheckCircle, Clock, GraduationCap } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  reinscriptionId: number;
  enfantNom: string;
  montant: number;
}

const formatMontant = (montant: number): string => {
  return Math.round(montant).toLocaleString();
};

export default function ReinscriptionPaiementModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  reinscriptionId, 
  enfantNom, 
  montant 
}: Props) {
  const [paying, setPaying] = useState(false);
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handlePaiement = async () => {
    if (!modePaiement) return;

    setPaying(true);
    setError(null);
    try {
      const response = await fetch("/api/parent/paiement-reinscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reinscriptionId,
          modePaiement,
          reference: reference || null,
          montant,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Erreur lors du paiement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* En-tête - même style que PaiementPlanModal */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">Paiement de la réinscription</h2>
              <p className="text-sm text-gray-600">{enfantNom}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Réinscription
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Récapitulatif - même style que le tableau */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left text-gray-700">Type</th>
                  <th className="border p-2 text-left text-gray-700">Montant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 font-medium text-black">Réinscription</td>
                  <td className="border p-2 text-blue-600 font-medium">
                    {formatMontant(montant)} GNF
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Information - même style que les services optionnels */}
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-700 mb-2">Informations de paiement</h4>
            <div className="flex justify-between text-sm">
              <span className="text-gray-900">Réinscription</span>
              <span className="font-medium text-blue-600">{formatMontant(montant)} GNF</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-black">
              <span>Total à payer</span>
              <span className="text-blue-600">{formatMontant(montant)} GNF</span>
            </div>
          </div>

          {/* Message de statut - même style que les échéances */}
          <div className="bg-yellow-50 p-3 rounded-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-700">Paiement en attente</span>
          </div>

          {/* FORMULAIRE DE PAIEMENT - même style que PaiementPlanModal */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Payer la réinscription
            </h3>
            
            <div className="bg-blue-50 p-3 rounded-lg text-center mb-4">
              <p className="text-sm text-gray-600">Montant à payer</p>
              <p className="text-xl font-bold text-blue-700">
                {formatMontant(montant)} GNF
              </p>
              <p className="text-xs text-gray-500">Réinscription</p>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-lg text-center text-red-700 mb-4">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Mode de paiement *</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'especes', label: 'Espèces', icon: Wallet, color: 'green' },
                  { value: 'orange_money', label: 'Orange Money', icon: Smartphone, color: 'orange' },
                  { value: 'carte', label: 'Carte Visa', icon: CreditCard, color: 'blue' }
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setModePaiement(value)}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${
                      modePaiement === value
                        ? `border-${color}-500 bg-${color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                    <span className="text-xs text-black">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {(modePaiement === 'orange_money' || modePaiement === 'carte') && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Numéro de transaction</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={modePaiement === 'orange_money' ? 'Ex: #OM-123456789' : 'Ex: VISA-****-1234'}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {modePaiement === 'orange_money'
                    ? 'Entrez le numéro de transaction reçu par SMS'
                    : 'Entrez le numéro de transaction de votre carte'}
                </p>
              </div>
            )}

            {modePaiement === 'especes' && (
              <div className="bg-yellow-50 p-3 rounded-lg text-center mb-4">
                <p className="text-sm text-yellow-700">
                  Paiement en espèces à effectuer à la caisse de l'école.
                  Un email sera envoyé au comptable pour validation.
                </p>
              </div>
            )}

            <button
              onClick={handlePaiement}
              disabled={!modePaiement || paying}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                !modePaiement || paying
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {paying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Traitement...
                </>
              ) : (
                `Confirmer le paiement`
              )}
            </button>
          </div>

          {/* Message de confirmation - même style que PaiementPlanModal */}
          {montant === 0 && (
            <div className="mt-6 bg-green-50 p-4 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-700">✓ Paiement déjà effectué !</p>
              <p className="text-sm text-green-600">Cette réinscription a déjà été payée.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}