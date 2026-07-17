// components/PaiementLibreModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Wallet, Smartphone, CreditCard, CheckCircle, Clock, AlertTriangle, Edit2, Percent, TrendingUp } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preinscriptionId: number;
  enfantNom: string;
  niveau: string;
  montantTotal?: number;
  montantRestant?: number;
}

const formatMontant = (montant: number): string => {
  return Math.round(montant).toLocaleString();
};

export default function PaiementLibreModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preinscriptionId, 
  enfantNom, 
  niveau,
  montantTotal = 0,
  montantRestant = 0
}: Props) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [montantSaisi, setMontantSaisi] = useState<string>("");
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [restant, setRestant] = useState(0);
  const [montantPaye, setMontantPaye] = useState(0);
  const [echeances, setEcheances] = useState<any[]>([]);
  const [suggestionMontant, setSuggestionMontant] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && preinscriptionId) {
      fetchInfos();
    }
  }, [isOpen, preinscriptionId]);

  const fetchInfos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les infos de la pré-inscription
      const response = await fetch(`/api/parent/plan-paiement?preinscriptionId=${preinscriptionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du chargement");
      }
      
      const data = await response.json();
      
      if (data) {
        setTotal(Number(data.montant_total_plan) || montantTotal || 0);
        setRestant(Number(data.montant_restant_plan) || montantRestant || 0);
        setMontantPaye(Number(data.montant_total_plan) - Number(data.montant_restant_plan) || 0);
        setEcheances(data.echeances || []);
        
        // Suggérer le montant restant
        setSuggestionMontant(Number(data.montant_restant_plan) || montantRestant || 0);
        
        // Pré-remplir le champ avec le montant restant
        const restantValue = Number(data.montant_restant_plan) || montantRestant || 0;
        if (restantValue > 0) {
          setMontantSaisi(restantValue.toString());
        }
      } else {
        setError("Impossible de charger les informations de paiement");
      }
    } catch (error) {
      console.error("Erreur chargement infos:", error);
      setError((error as Error).message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePaiement = async () => {
    const montant = parseInt(montantSaisi.replace(/\s/g, ''));
    
    if (!montant || montant <= 0) {
      setError("Veuillez saisir un montant valide");
      return;
    }

    if (montant > restant) {
      setError(`Le montant (${formatMontant(montant)}) dépasse le solde restant (${formatMontant(restant)})`);
      return;
    }

    if (!modePaiement) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    setPaying(true);
    setError(null);
    
    try {
      const response = await fetch("/api/parent/paiement-libre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preinscriptionId,
          montant,
          modePaiement,
          reference: reference || null,
          type: 'libre'
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchInfos();
        onSuccess();
        setMontantSaisi("");
        setModePaiement("");
        setReference("");
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
    const montantSuggere = Math.round(restant * (pourcentage / 100));
    setMontantSaisi(montantSuggere.toString());
  };

  if (!isOpen) return null;

  const pourcentagePaye = total > 0 ? Math.round((montantPaye / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">Paiement échelonné</h2>
              <p className="text-sm text-gray-600">{enfantNom} - {niveau}</p>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                Saisie libre du montant
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Chargement...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg text-center text-red-700">
              <p>{error}</p>
              <button
                onClick={fetchInfos}
                className="mt-2 text-indigo-600 hover:underline text-sm"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <>
              {/* ⭐ BARRE DE PROGRESSION */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progression du paiement</span>
                  <span className="font-semibold">{pourcentagePaye}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pourcentagePaye)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Payé: {formatMontant(montantPaye)} GNF</span>
                  <span>Total: {formatMontant(total)} GNF</span>
                  <span className="font-semibold text-indigo-600">Reste: {formatMontant(restant)} GNF</span>
                </div>
              </div>

              {/* ⭐ RÉCAPITULATIF DES VERSEMENTS */}
              {total > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Récapitulatif</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-600">Total des frais</span>
                      <span className="font-bold text-black">{formatMontant(total)} GNF</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-600">Déjà payé</span>
                      <span className="font-bold text-green-600">{formatMontant(montantPaye)} GNF</span>
                    </div>
                    <div className="flex justify-between col-span-2 pt-1">
                      <span className="text-gray-600 font-semibold">Solde restant</span>
                      <span className="font-bold text-indigo-600 text-lg">{formatMontant(restant)} GNF</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ⭐ SUGGESTIONS DE MONTANT */}
              {restant > 0 && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Suggestions de montant
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[10, 25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleSuggestion(pct)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 transition flex items-center gap-1"
                      >
                        <Percent className="w-3 h-3" />
                        {pct}%
                      </button>
                    ))}
                    {suggestionMontant && suggestionMontant > 0 && (
                      <button
                        onClick={() => setMontantSaisi(suggestionMontant.toString())}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium text-indigo-700 transition flex items-center gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        Solde total
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ⭐ CHAMP DE SAISIE DU MONTANT */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Montant à payer * <span className="text-gray-400 text-xs">(saisie libre)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">GNF</span>
                  <input
                    type="text"
                    value={montantSaisi}
                    onChange={(e) => {
                      // Nettoyer l'entrée : garder seulement les chiffres
                      const cleaned = e.target.value.replace(/\D/g, '');
                      // Formater avec des espaces tous les 3 chiffres
                      const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                      setMontantSaisi(formatted);
                    }}
                    placeholder="Ex: 1 500 000"
                    className="w-full pl-20 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black text-lg font-medium"
                  />
                </div>
                {montantSaisi && parseInt(montantSaisi.replace(/\s/g, '')) > restant && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Le montant saisi dépasse le solde restant ({formatMontant(restant)} GNF)
                  </p>
                )}
                {montantSaisi && parseInt(montantSaisi.replace(/\s/g, '')) > 0 && parseInt(montantSaisi.replace(/\s/g, '')) <= restant && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Après ce paiement, il restera {formatMontant(restant - parseInt(montantSaisi.replace(/\s/g, '')))} GNF
                  </p>
                )}
              </div>

              {/* ⭐ MODE DE PAIEMENT */}
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

              {/* ⭐ RÉFÉRENCE DE TRANSACTION */}
              {(modePaiement === 'orange_money' || modePaiement === 'carte') && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Numéro de transaction</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={modePaiement === 'orange_money' ? 'Ex: #OM-123456789' : 'Ex: VISA-****-1234'}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
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

              {/* ⭐ BOUTON DE PAIEMENT */}
              <button
                onClick={handlePaiement}
                disabled={
                  !modePaiement || 
                  paying || 
                  !montantSaisi || 
                  parseInt(montantSaisi.replace(/\s/g, '')) <= 0 ||
                  parseInt(montantSaisi.replace(/\s/g, '')) > restant
                }
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  !modePaiement || 
                  paying || 
                  !montantSaisi || 
                  parseInt(montantSaisi.replace(/\s/g, '')) <= 0 ||
                  parseInt(montantSaisi.replace(/\s/g, '')) > restant
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Traitement...
                  </>
                ) : (
                  `Payer ${montantSaisi ? formatMontant(parseInt(montantSaisi.replace(/\s/g, ''))) : '0'} GNF`
                )}
              </button>

              {/* ⭐ HISTORIQUE DES PAIEMENTS */}
              {echeances.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Historique des paiements</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {echeances
                      .filter(e => e.statut === 'paye')
                      .map((e, index) => (
                        <div key={e.id || index} className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-700">
                              {e.echeance || `Paiement ${index + 1}`}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-green-600">{formatMontant(e.montant)} GNF</span>
                            <p className="text-xs text-gray-500">
                              {e.date_paiement ? new Date(e.date_paiement).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>
                        </div>
                      ))}
                    {echeances.filter(e => e.statut === 'paye').length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">Aucun paiement effectué</p>
                    )}
                  </div>
                </div>
              )}

              {/* ⭐ MESSAGE DE FINALISATION */}
              {restant === 0 && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg text-center border-2 border-green-200">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700 text-lg">✓ Paiement terminé !</p>
                  <p className="text-sm text-green-600">
                    Tous les frais ont été réglés. Vous pouvez fermer cette fenêtre.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}