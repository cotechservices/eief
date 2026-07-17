// components/PaiementPlanModal.tsx

"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Wallet, Smartphone, CreditCard, CheckCircle, Clock, AlertTriangle, Percent, TrendingUp, History, Bus, Utensils, ShoppingCart } from "lucide-react";

interface Echeance {
  id: number;
  type: string;
  echeance: string;
  montant: number;
  statut: string;
  date_echeance: string;
  date_paiement: string | null;
  mode_paiement?: string;
  reference_transaction?: string;
}

interface PlanPaiement {
  id: number;
  niveau: string;
  premier_versement: number;
  deuxieme_versement: number;
  troisieme_versement: number;
  total: number;
  type_inscription?: string;
}

interface ServicesOptionnels {
  transport: {
    total: number;
    details: any[];
  };
  cantine: {
    total: number;
    details: any[];
  };
  fournitures: {
    total: number;
    details: any[];
  };
  total_services: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onPaymentComplete?: () => void;
  preinscriptionId: number;
  enfantNom: string;
  niveau: string;
}

const formatMontant = (montant: number): string => {
  return Math.round(Math.max(0, montant)).toLocaleString();
};

export default function PaiementPlanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onPaymentComplete,
  preinscriptionId, 
  enfantNom, 
  niveau 
}: Props) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [plan, setPlan] = useState<PlanPaiement | null>(null);
  const [services, setServices] = useState<ServicesOptionnels | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [montantSaisi, setMontantSaisi] = useState<string>("");
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [montantTotal, setMontantTotal] = useState(0);
  const [montantPaye, setMontantPaye] = useState(0);
  const [montantRestant, setMontantRestant] = useState(0);

  useEffect(() => {
    if (isOpen && preinscriptionId) {
      fetchPlan();
    }
  }, [isOpen, preinscriptionId]);

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/parent/plan-paiement?preinscriptionId=${preinscriptionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du chargement");
      }
      
      const data = await response.json();
      
      if (data && data.plan) {
        setPlan(data.plan);
        setServices(data.services_optionnels || null);
        
        const allEcheances = data.echeances || [];
        setEcheances(allEcheances);
        
        // ⭐ Total = inscription + services optionnels
        const totalInscription = Number(data.plan?.total) || Number(data.montant_total_plan) || 0;
        const totalServices = data.services_optionnels?.total_services || 0;
        const total = totalInscription + totalServices;
        
        // ⭐ Montant payé = total - restant (calculé par l'API)
        const restant = Number(data.restant_calcule) || Number(data.montant_restant_plan) || 0;
        const paye = Math.max(0, total - restant);
        
        console.log("📊 Calcul des montants:", { 
          totalInscription, 
          totalServices, 
          total, 
          paye, 
          restant,
          restant_calcule: data.restant_calcule,
          montant_restant_plan: data.montant_restant_plan
        });
        
        setMontantTotal(total);
        setMontantPaye(paye);
        setMontantRestant(restant);
        
        if (restant > 0) {
          setMontantSaisi(restant.toString());
        } else {
          setMontantSaisi("");
        }
      } else {
        setError("Aucun plan de paiement trouvé");
      }
    } catch (error) {
      console.error("Erreur chargement plan:", error);
      setError((error as Error).message || "Erreur lors du chargement du plan");
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

    if (montant > montantRestant) {
      setError(`Le montant (${formatMontant(montant)}) dépasse le solde restant (${formatMontant(montantRestant)})`);
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
        await fetchPlan();
        onSuccess();
        
        if (onPaymentComplete) {
          onPaymentComplete();
        }
        
        setModePaiement("");
        setReference("");
        
        if (data.est_termine) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
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
    const montantSuggere = Math.round(montantRestant * (pourcentage / 100));
    setMontantSaisi(montantSuggere.toString());
  };

  const handlePayerSolde = () => {
    setMontantSaisi(montantRestant.toString());
  };

  if (!isOpen) return null;

  const pourcentagePaye = montantTotal > 0 ? Math.round((montantPaye / montantTotal) * 100) : 0;
  const estTermine = montantRestant === 0;
  const montantSaisiNumber = parseInt(montantSaisi.replace(/\s/g, '')) || 0;

  const totalInscription = plan?.total || 0;
  const totalServices = services?.total_services || 0;
  const totalGeneral = totalInscription + totalServices;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">Plan de paiement échelonné</h2>
              <p className="text-sm text-gray-600">{enfantNom} - {niveau}</p>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                Paiement libre
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
              <span className="ml-2 text-gray-600">Chargement du plan...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg text-center text-red-700">
              <p>{error}</p>
              <button
                onClick={fetchPlan}
                className="mt-2 text-indigo-600 hover:underline text-sm"
              >
                Réessayer
              </button>
            </div>
          ) : plan ? (
            <>
              {/* TABLEAU RÉCAPITULATIF DES VERSEMENTS */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-indigo-50">
                      <th className="border p-2 text-left text-gray-700">Niveau</th>
                      <th className="border p-2 text-left text-gray-700">1er Versement</th>
                      <th className="border p-2 text-left text-gray-700">2ème Versement</th>
                      <th className="border p-2 text-left text-gray-700">3ème Versement</th>
                      <th className="border p-2 text-left text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium text-black">
                        {plan.niveau || niveau || "N/A"}
                      </td>
                      <td className="border p-2 text-indigo-600 font-medium">
                        {formatMontant(plan.premier_versement || 0)} GNF
                      </td>
                      <td className="border p-2 text-indigo-600 font-medium">
                        {formatMontant(plan.deuxieme_versement || 0)} GNF
                      </td>
                      <td className="border p-2 text-indigo-600 font-medium">
                        {formatMontant(plan.troisieme_versement || 0)} GNF
                      </td>
                      <td className="border p-2 font-bold text-black">
                        {formatMontant(plan.total || 0)} GNF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SERVICES OPTIONNELS */}
              {services && services.total_services > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                    Services optionnels
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {services.transport.total > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">Transport</span>
                        </div>
                        <span className="font-medium text-blue-600">{formatMontant(services.transport.total)} GNF</span>
                      </div>
                    )}
                    {services.cantine.total > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-gray-700">Cantine</span>
                        </div>
                        <span className="font-medium text-orange-600">{formatMontant(services.cantine.total)} GNF</span>
                      </div>
                    )}
                    {services.fournitures.total > 0 && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700">Fournitures</span>
                        </div>
                        <span className="font-medium text-purple-600">{formatMontant(services.fournitures.total)} GNF</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-black">
                      <span>Total services</span>
                      <span className="text-indigo-600">{formatMontant(services.total_services)} GNF</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BARRE DE PROGRESSION */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progression du paiement</span>
                  <span className="font-semibold">{Math.max(0, pourcentagePaye)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, pourcentagePaye))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Payé: {formatMontant(montantPaye)} GNF</span>
                  <span>Total: {formatMontant(montantTotal)} GNF</span>
                  <span className="font-semibold text-indigo-600">Reste: {formatMontant(montantRestant)} GNF</span>
                </div>
              </div>

              {/* RÉCAPITULATIF DES FRAIS */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Récapitulatif des frais</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Frais d'inscription</span>
                    <span className="font-medium text-indigo-600">{formatMontant(totalInscription)} GNF</span>
                  </div>
                  
                  {services && services.total_services > 0 && (
                    <>
                      {services.transport.total > 0 && (
                        <div className="flex justify-between pl-4">
                          <span className="text-gray-600">└ Transport</span>
                          <span className="font-medium text-blue-600">{formatMontant(services.transport.total)} GNF</span>
                        </div>
                      )}
                      {services.cantine.total > 0 && (
                        <div className="flex justify-between pl-4">
                          <span className="text-gray-600">└ Cantine</span>
                          <span className="font-medium text-orange-600">{formatMontant(services.cantine.total)} GNF</span>
                        </div>
                      )}
                      {services.fournitures.total > 0 && (
                        <div className="flex justify-between pl-4">
                          <span className="text-gray-600">└ Fournitures</span>
                          <span className="font-medium text-purple-600">{formatMontant(services.fournitures.total)} GNF</span>
                        </div>
                      )}
                      <div className="flex justify-between pl-4 text-xs text-gray-500">
                        <span>Sous-total services</span>
                        <span>{formatMontant(services.total_services)} GNF</span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-2 flex justify-between font-bold text-black text-lg">
                    <span>Total général</span>
                    <span className="text-indigo-700">{formatMontant(totalGeneral)} GNF</span>
                  </div>
                </div>
              </div>

              {/* SUGGESTIONS DE MONTANT */}
              {montantRestant > 0 && (
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
                    {montantRestant > 0 && (
                      <button
                        onClick={handlePayerSolde}
                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 rounded-lg text-sm font-medium text-indigo-700 transition flex items-center gap-1"
                      >
                        <TrendingUp className="w-3 h-3" />
                        Payer le solde
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* CHAMP DE SAISIE DU MONTANT */}
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
                      const cleaned = e.target.value.replace(/\D/g, '');
                      const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
                      setMontantSaisi(formatted);
                    }}
                    placeholder="Ex: 1 500 000"
                    className="w-full pl-20 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black text-lg font-medium"
                    disabled={estTermine}
                  />
                </div>
                {montantSaisiNumber > 0 && montantSaisiNumber > montantRestant && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Le montant saisi dépasse le solde restant ({formatMontant(montantRestant)} GNF)
                  </p>
                )}
                {montantSaisiNumber > 0 && montantSaisiNumber <= montantRestant && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Après ce paiement, il restera {formatMontant(montantRestant - montantSaisiNumber)} GNF
                  </p>
                )}
              </div>

              {/* MODE DE PAIEMENT */}
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
                      disabled={estTermine}
                    >
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                      <span className="text-xs text-black">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RÉFÉRENCE DE TRANSACTION */}
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

              {/* BOUTON DE PAIEMENT */}
              {!estTermine ? (
                <button
                  onClick={handlePaiement}
                  disabled={
                    !modePaiement || 
                    paying || 
                    montantSaisiNumber <= 0 ||
                    montantSaisiNumber > montantRestant
                  }
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    !modePaiement || 
                    paying || 
                    montantSaisiNumber <= 0 ||
                    montantSaisiNumber > montantRestant
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
                    `Payer ${montantSaisi ? formatMontant(montantSaisiNumber) : '0'} GNF`
                  )}
                </button>
              ) : (
                <div className="w-full py-3 rounded-lg font-semibold bg-green-100 text-green-700 text-center border-2 border-green-300">
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  ✓ Paiement terminé !
                </div>
              )}

              {/* HISTORIQUE DES PAIEMENTS */}
              {echeances.filter(e => e.statut === 'paye').length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Historique des paiements
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {echeances
                      .filter(e => e.statut === 'paye')
                      .sort((a, b) => {
                        const dateA = a.date_paiement ? new Date(a.date_paiement).getTime() : 0;
                        const dateB = b.date_paiement ? new Date(b.date_paiement).getTime() : 0;
                        return dateB - dateA;
                      })
                      .map((e, index) => (
                        <div key={e.id || index} className="flex justify-between items-center p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-700">
                              {e.echeance || `Paiement ${index + 1}`}
                            </span>
                            {e.mode_paiement && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {e.mode_paiement === 'especes' ? 'Espèces' : 
                                 e.mode_paiement === 'orange_money' ? 'Orange Money' : 
                                 e.mode_paiement === 'carte' ? 'Carte' : e.mode_paiement}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-green-600">{formatMontant(e.montant)} GNF</span>
                            <p className="text-xs text-gray-500">
                              {e.date_paiement ? new Date(e.date_paiement).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* MESSAGE DE FINALISATION */}
              {estTermine && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg text-center border-2 border-green-200">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-green-700 text-lg">✓ Tous les paiements sont effectués !</p>
                  <p className="text-sm text-green-600">
                    Vous avez finalisé tous vos paiements pour cette inscription.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun plan de paiement disponible pour cette inscription.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}