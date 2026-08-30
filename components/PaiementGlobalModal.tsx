// components/PaiementGlobalModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2, Wallet, Smartphone, CreditCard, CheckCircle, AlertTriangle, Percent, TrendingUp, Bus, Utensils, ShoppingCart } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  solde?: {                           // ✅ rendu optionnel
    total: number;
    details: {
      inscription: number;
      transport: number;
      cantine: number;
      fournitures: number;
    };
  };
  parentId?: number;
}

const formatMontant = (montant: number): string => {
  return Math.round(Math.max(0, montant)).toLocaleString();
};

export default function PaiementGlobalModal({ isOpen, onClose, onSuccess, solde, parentId }: Props) {
  const [paying, setPaying] = useState(false);
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✅ Valeur par défaut si solde n'est pas fourni
  const safeSolde = solde || {
    total: 0,
    details: {
      inscription: 0,
      transport: 0,
      cantine: 0,
      fournitures: 0
    }
  };

  const [montantSaisi, setMontantSaisi] = useState<string>(
    safeSolde.total > 0 ? safeSolde.total.toString() : ""
  );

  const handlePaiement = async () => {
    const montant = parseInt(montantSaisi.replace(/\s/g, ''));
    if (!montant || montant <= 0) {
      setError("Veuillez saisir un montant valide");
      return;
    }
    if (montant > safeSolde.total) {
      setError(`Le montant (${formatMontant(montant)}) dépasse le solde global restant (${formatMontant(safeSolde.total)})`);
      return;
    }
    if (!modePaiement) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    setPaying(true);
    setError(null);
    try {
      const payload: any = { montant, modePaiement, reference: reference || null };
      if (parentId) payload.parentId = parentId;
      const response = await fetch("/api/parent/paiement-global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        onSuccess();
        setModePaiement("");
        setReference("");
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

  const handleSuggestion = (pourcentage: number) => {
    const montantSuggere = Math.round(safeSolde.total * (pourcentage / 100));
    setMontantSaisi(montantSuggere.toString());
  };
  const handlePayerSolde = () => setMontantSaisi(safeSolde.total.toString());

  if (!isOpen) return null;
  const montantSaisiNumber = parseInt(montantSaisi.replace(/\s/g, '')) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">Paiement Global</h2>
              <p className="text-sm text-gray-600">Payez pour l'ensemble de vos enfants inscrits</p>
            </div>
            <button onClick={onClose} className="text-gray-900 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Récapitulatif détaillé du solde global */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-700 mb-2">Détail du solde global</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Frais d'inscription</span>
                <span className="font-medium text-indigo-600">{formatMontant(safeSolde.details.inscription)} GNF</span>
              </div>
              {safeSolde.details.transport > 0 && (
                <div className="flex justify-between pl-4">
                  <span className="text-gray-600 flex items-center gap-1"><Bus className="w-3 h-3" /> Transport</span>
                  <span className="font-medium text-blue-600">{formatMontant(safeSolde.details.transport)} GNF</span>
                </div>
              )}
              {safeSolde.details.cantine > 0 && (
                <div className="flex justify-between pl-4">
                  <span className="text-gray-600 flex items-center gap-1"><Utensils className="w-3 h-3" /> Cantine</span>
                  <span className="font-medium text-orange-600">{formatMontant(safeSolde.details.cantine)} GNF</span>
                </div>
              )}
              {safeSolde.details.fournitures > 0 && (
                <div className="flex justify-between pl-4">
                  <span className="text-gray-600 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Fournitures</span>
                  <span className="font-medium text-purple-600">{formatMontant(safeSolde.details.fournitures)} GNF</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-black text-lg">
                <span>Total restant</span>
                <span className="text-indigo-700">{formatMontant(safeSolde.total)} GNF</span>
              </div>
            </div>
          </div>

          {safeSolde.total > 0 ? (
            <>
              {/* Suggestions de montant */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Suggestions de montant</label>
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 75].map(pct => (
                    <button key={pct} onClick={() => handleSuggestion(pct)} className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 transition flex items-center gap-1">
                      <Percent className="w-3 h-3" /> {pct}%
                    </button>
                  ))}
                  <button onClick={handlePayerSolde} className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-sm font-medium text-indigo-700 transition flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Payer le solde
                  </button>
                </div>
              </div>

              {/* Saisie du montant */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Montant à payer *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-semibold">GNF</span>
                  <input
                    type="text"
                    value={montantSaisi}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                      setMontantSaisi(formatted);
                    }}
                    placeholder="Ex: 1 500 000"
                    className="w-full pl-16 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black text-lg font-medium"
                  />
                </div>
                {montantSaisiNumber > safeSolde.total && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Dépasse le solde global
                  </p>
                )}
                {montantSaisiNumber > 0 && montantSaisiNumber <= safeSolde.total && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Il restera {formatMontant(safeSolde.total - montantSaisiNumber)} GNF
                  </p>
                )}
              </div>

              {/* Mode de paiement */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">Mode de paiement *</label>
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
                      className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === value ? `border-${color}-500 bg-${color}-50` : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                      <span className="text-xs text-black">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Référence transaction */}
              {(modePaiement === 'orange_money' || modePaiement === 'carte') && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 text-sm font-medium">Numéro de transaction</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={modePaiement === 'orange_money' ? 'Ex: #OM-123456789' : 'Ex: VISA-****-1234'}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                  />
                </div>
              )}

              {modePaiement === 'especes' && (
                <div className="bg-yellow-50 p-3 rounded-lg text-center mb-4">
                  <p className="text-sm text-yellow-700">Paiement en espèces à effectuer à la caisse.</p>
                </div>
              )}

              <button
                onClick={handlePaiement}
                disabled={!modePaiement || paying || montantSaisiNumber <= 0 || montantSaisiNumber > safeSolde.total}
                className={`w-full py-3 rounded-lg font-semibold transition ${(!modePaiement || paying || montantSaisiNumber <= 0 || montantSaisiNumber > safeSolde.total) ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {paying ? <><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Traitement...</> : `Payer ${montantSaisi ? formatMontant(montantSaisiNumber) : '0'} GNF`}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Tous vos paiements sont à jour</h3>
              <p className="text-gray-900">Vous n'avez aucun solde restant.</p>
              <button onClick={onClose} className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Fermer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}