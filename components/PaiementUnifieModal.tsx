// components/PaiementUnifieModal.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, Loader2, Wallet, Smartphone, CreditCard, CheckCircle, 
  Clock, GraduationCap, Bus, Utensils, BookOpen, 
  AlertCircle, TrendingUp, TrendingDown
} from "lucide-react";

interface Echeance {
  id: number;
  type: string;
  echeance: string;
  montant: number;
  statut: string;
  date_echeance: string;
  date_paiement: string | null;
}

interface PlanPaiement {
  niveau: string;
  classe: string;
  frais_inscription: number;
  premier_versement: number;
  deuxieme_versement: number;
  troisieme_versement: number;
  total: number;
  frais_reinscription?: number;
}

interface Totals {
  total_principal: number;
  total_services: number;
  total_general: number;
  paye: number;
  restant: number;
  pourcentage_paye: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  id: number;
  type: 'preinscription' | 'reinscription' | 'enfant';
  enfantNom: string;
  enfantPrenom: string;
  niveau?: string;
  classe?: string;
}

const formatMontant = (montant: number): string => {
  return Math.round(montant).toLocaleString('fr-FR');
};

export default function PaiementUnifieModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  id,
  type,
  enfantNom,
  enfantPrenom,
  niveau,
  classe
}: Props) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [data, setData] = useState<any>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [montantSaisi, setMontantSaisi] = useState<string>("");
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paiementEffectue, setPaiementEffectue] = useState(false);

  const typeLabel = type === 'reinscription' ? 'Réinscription' : type === 'preinscription' ? 'Pré-inscription' : "Frais d'inscription";

  useEffect(() => {
    if (isOpen && id) {
      fetchPlan();
      resetForm();
    }
  }, [isOpen, id]);

  const resetForm = () => {
    setMontantSaisi("");
    setModePaiement("");
    setReference("");
    setError(null);
    setSuccess(null);
    setPaiementEffectue(false);
  };

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      // ⭐ Utiliser l'API stats pour récupérer les données
      const response = await fetch(`/api/parent/enfants/${id}/stats`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors du chargement");
      }
      
      const result = await response.json();
      console.log("📊 Données récupérées:", result);
      
      // ⭐ Construire les données pour le modal
      const plan = result.plan_paiement || {
        niveau: niveau || result.niveau || "Non défini",
        classe: classe || result.classe || "Non définie",
        frais_inscription: result.frais_inscription || 0,
        premier_versement: result.premier_versement || 0,
        deuxieme_versement: result.deuxieme_versement || 0,
        troisieme_versement: result.troisieme_versement || 0,
        total: result.frais_inscription || 0,
        frais_reinscription: result.frais_reinscription || 0
      };

      const totals = {
        total_principal: result.frais_inscription || 0,
        total_services: (result.transport || 0) + (result.cantine || 0) + (result.fournitures || 0),
        total_general: result.total_frais_general || 0,
        paye: result.paiements?.total_paye || 0,
        restant: result.solde_restant || 0,
        pourcentage_paye: result.pourcentage_paye || 0
      };

      // ⭐ Construire les échéances à partir des données
      const echeancesData: Echeance[] = [];

      // Ajouter les versements du plan
      const planTotal = plan.total || plan.frais_inscription || 0;
      if (planTotal > 0) {
        const versements = [
          { echeance: '1er_versement', montant: plan.premier_versement || Math.round(planTotal * 0.4) },
          { echeance: '2eme_versement', montant: plan.deuxieme_versement || Math.round(planTotal * 0.35) },
          { echeance: '3eme_versement', montant: plan.troisieme_versement || Math.round(planTotal * 0.25) }
        ];

        let totalEcheances = 0;
        versements.forEach((v, index) => {
          // Ajuster le dernier versement pour que le total soit exact
          let montant = v.montant;
          if (index === versements.length - 1) {
            montant = planTotal - totalEcheances;
          }
          totalEcheances += montant;

          if (montant > 0) {
            echeancesData.push({
              id: index + 1,
              type: type === 'reinscription' ? 'reinscription' : 'inscription',
              echeance: v.echeance,
              montant: montant,
              statut: 'en_attente',
              date_echeance: new Date(Date.now() + (index + 1) * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              date_paiement: null
            });
          }
        });
      }

      // Ajouter les services optionnels
      if (result.transport > 0) {
        echeancesData.push({
          id: echeancesData.length + 1,
          type: 'transport',
          echeance: 'Transport',
          montant: result.transport,
          statut: 'en_attente',
          date_echeance: new Date().toISOString().split('T')[0],
          date_paiement: null
        });
      }

      if (result.cantine > 0) {
        echeancesData.push({
          id: echeancesData.length + 1,
          type: 'cantine',
          echeance: 'Cantine',
          montant: result.cantine,
          statut: 'en_attente',
          date_echeance: new Date().toISOString().split('T')[0],
          date_paiement: null
        });
      }

      if (result.fournitures > 0) {
        echeancesData.push({
          id: echeancesData.length + 1,
          type: 'fournitures',
          echeance: 'Fournitures',
          montant: result.fournitures,
          statut: 'en_attente',
          date_echeance: new Date().toISOString().split('T')[0],
          date_paiement: null
        });
      }

      setData({
        ...result,
        plan: plan,
        totals: totals
      });
      setEcheances(echeancesData);

    } catch (error) {
      console.error("Erreur chargement plan:", error);
      setError((error as Error).message || "Erreur lors du chargement du plan");
    } finally {
      setLoading(false);
    }
  };

  const totals = data?.totals || { total_general: 0, paye: 0, restant: 0, pourcentage_paye: 0 };
  const montantRestant = totals.restant || 0;
  const montantSaisiNumber = parseInt(montantSaisi.replace(/[^0-9]/g, '')) || 0;

  const handleMontantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setMontantSaisi(value ? parseInt(value).toLocaleString('fr-FR') : "");
  };

  const setMontantRestant = () => {
    setMontantSaisi(montantRestant.toLocaleString('fr-FR'));
  };

  const setMontantMoitie = () => {
    const moitie = Math.ceil(montantRestant / 2);
    setMontantSaisi(moitie.toLocaleString('fr-FR'));
  };

  const setMontantQuart = () => {
    const quart = Math.ceil(montantRestant / 4);
    setMontantSaisi(quart.toLocaleString('fr-FR'));
  };

  const montantValide = montantSaisiNumber > 0 && montantSaisiNumber <= montantRestant;

  const handlePaiement = async () => {
    if (!modePaiement || !montantValide) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setPaying(true);
    setError(null);
    setSuccess(null);

    try {
      // ⭐ Utiliser l'API de paiement personnalisé
      const response = await fetch("/api/parent/paiement-personnalise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          type: type === 'preinscription' ? 'preinscription' : 'reinscription',
          montant: montantSaisiNumber,
          modePaiement,
          reference: reference || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`✅ Paiement de ${formatMontant(montantSaisiNumber)} GNF effectué !`);
        setPaiementEffectue(true);
        
        await fetchPlan();
        
        if (result.est_termine) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        } else {
          setMontantSaisi("");
          setModePaiement("");
          setReference("");
        }
      } else {
        setError(result.error || "Erreur lors du paiement");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  const echeancesEnAttente = useMemo(() => {
    return echeances.filter(e => e.statut === 'en_attente');
  }, [echeances]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">💳 Paiement - {typeLabel}</h2>
              <p className="text-sm text-gray-600">
                {enfantPrenom} {enfantNom} 
                {niveau ? ` - ${niveau}` : ''}
                {classe ? ` (${classe})` : ''}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                type === 'reinscription' ? 'bg-indigo-100 text-indigo-700' : 
                type === 'preinscription' ? 'bg-blue-100 text-blue-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {typeLabel}
              </span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Chargement du plan...</span>
            </div>
          ) : error && !data ? (
            <div className="bg-red-50 p-4 rounded-lg text-center text-red-700">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
              <button
                onClick={fetchPlan}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Réessayer
              </button>
            </div>
          ) : data ? (
            <>
              {/* ⭐ Barre de progression */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progression du paiement</span>
                  <span className="font-medium">{totals.pourcentage_paye}% payé</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(totals.pourcentage_paye, 100)}%`,
                      background: totals.pourcentage_paye >= 100 
                        ? 'linear-gradient(90deg, #10b981, #059669)' 
                        : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Payé: {formatMontant(totals.paye)} GNF</span>
                  <span>Restant: {formatMontant(totals.restant)} GNF</span>
                  <span>Total: {formatMontant(totals.total_general)} GNF</span>
                </div>
              </div>

              {/* ⭐ Récapitulatif du plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                    <GraduationCap className="w-5 h-5" />
                    Frais {typeLabel}
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatMontant(data.plan?.total || data.frais_inscription || 0)} GNF
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {data.plan?.premier_versement ? `1er: ${formatMontant(data.plan.premier_versement)} GNF` : ''}
                    {data.plan?.deuxieme_versement ? ` | 2ème: ${formatMontant(data.plan.deuxieme_versement)} GNF` : ''}
                    {data.plan?.troisieme_versement ? ` | 3ème: ${formatMontant(data.plan.troisieme_versement)} GNF` : ''}
                  </p>
                </div>
                <div className={`${(data.transport || 0) + (data.cantine || 0) + (data.fournitures || 0) > 0 ? 'bg-purple-50' : 'bg-gray-100'} p-4 rounded-lg`}>
                  <div className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
                    <BookOpen className="w-5 h-5" />
                    Services optionnels
                  </div>
                  {(data.transport || 0) + (data.cantine || 0) + (data.fournitures || 0) > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatMontant((data.transport || 0) + (data.cantine || 0) + (data.fournitures || 0))} GNF
                      </p>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        {data.transport > 0 && (
                          <div className="flex justify-between">
                            <span>🚌 Transport</span>
                            <span>{formatMontant(data.transport)} GNF</span>
                          </div>
                        )}
                        {data.cantine > 0 && (
                          <div className="flex justify-between">
                            <span>🍽️ Cantine</span>
                            <span>{formatMontant(data.cantine)} GNF</span>
                          </div>
                        )}
                        {data.fournitures > 0 && (
                          <div className="flex justify-between">
                            <span>📚 Fournitures</span>
                            <span>{formatMontant(data.fournitures)} GNF</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun service optionnel</p>
                  )}
                </div>
              </div>

              {/* ⭐ Si tout est payé */}
              {totals.restant <= 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-green-700">✅ Tout est payé !</h3>
                  <p className="text-green-600">
                    Vous avez finalisé tous vos paiements pour {enfantPrenom} {enfantNom}.
                  </p>
                  <button
                    onClick={() => { onSuccess(); onClose(); }}
                    className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  {/* ⭐ Zone de saisie du montant */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-semibold text-gray-700">
                        Montant à payer
                      </label>
                      <span className="text-sm text-gray-500">
                        Restant: <span className="font-bold text-blue-600">{formatMontant(montantRestant)} GNF</span>
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={montantSaisi}
                        onChange={handleMontantChange}
                        placeholder="0"
                        className="w-full text-2xl font-bold text-center py-3 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        GNF
                      </span>
                    </div>

                    {/* ⭐ Boutons d'actions rapides */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={setMontantQuart}
                        className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full transition"
                        disabled={montantRestant < 1000}
                      >
                        ¼ du restant
                      </button>
                      <button
                        onClick={setMontantMoitie}
                        className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full transition"
                        disabled={montantRestant < 1000}
                      >
                        ½ du restant
                      </button>
                      <button
                        onClick={setMontantRestant}
                        className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition"
                      >
                        Tout payer
                      </button>
                    </div>

                    {montantSaisiNumber > 0 && montantSaisiNumber <= montantRestant && (
                      <div className="mt-2 text-sm text-green-600">
                        ✅ {formatMontant(montantSaisiNumber)} GNF à payer
                        {montantSaisiNumber < montantRestant && ` (reste ${formatMontant(montantRestant - montantSaisiNumber)} GNF)`}
                        {montantSaisiNumber === montantRestant && ` (solde complet)`}
                      </div>
                    )}
                    {montantSaisiNumber > montantRestant && (
                      <div className="mt-2 text-sm text-red-600">
                        ⚠️ Le montant ne peut pas dépasser {formatMontant(montantRestant)} GNF
                      </div>
                    )}
                  </div>

                  {/* ⭐ Mode de paiement */}
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Mode de paiement *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'especes', label: 'Espèces', icon: Wallet, color: 'green' },
                        { value: 'orange_money', label: 'Orange Money', icon: Smartphone, color: 'orange' },
                        { value: 'carte', label: 'Carte', icon: CreditCard, color: 'blue' }
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

                  {/* ⭐ Référence transaction */}
                  {(modePaiement === 'orange_money' || modePaiement === 'carte') && (
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2">Numéro de transaction</label>
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
                        💰 Paiement en espèces à effectuer à la caisse de l'école.
                      </p>
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center mb-4">
                      <p className="text-green-700">{success}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-center mb-4">
                      <p className="text-red-700">{error}</p>
                    </div>
                  )}

                  {/* ⭐ Bouton de paiement */}
                  <button
                    onClick={handlePaiement}
                    disabled={!modePaiement || !montantValide || paying || paiementEffectue}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      !modePaiement || !montantValide || paying || paiementEffectue
                        ? 'bg-gray-300 cursor-not-allowed'
                        : montantSaisiNumber === montantRestant
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Traitement...
                      </>
                    ) : paiementEffectue ? (
                      '✅ Paiement effectué'
                    ) : montantSaisiNumber === montantRestant ? (
                      '💰 Payer le solde complet'
                    ) : (
                      `💳 Payer ${formatMontant(montantSaisiNumber)} GNF`
                    )}
                  </button>
                </>
              )}

              {/* ⭐ Liste des échéances */}
              {echeances.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Détail des échéances</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {echeances.map((echeance) => {
                      const estPaye = echeance.statut === 'paye';
                      const estPartiel = echeance.echeance.includes('_partiel');
                      return (
                        <div
                          key={echeance.id}
                          className={`p-2 rounded-lg border flex justify-between items-center text-sm ${
                            estPaye ? 'bg-green-50 border-green-200' : 
                            estPartiel ? 'bg-yellow-50 border-yellow-200' : 
                            'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              echeance.type === 'reinscription' || echeance.type === 'inscription'
                                ? 'bg-blue-100 text-blue-700'
                                : echeance.type === 'transport'
                                ? 'bg-yellow-100 text-yellow-700'
                                : echeance.type === 'cantine'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {echeance.type === 'reinscription' || echeance.type === 'inscription' 
                                ? 'Frais' 
                                : echeance.type === 'transport' 
                                ? '🚌' 
                                : echeance.type === 'cantine' 
                                ? '🍽️' 
                                : '📚'}
                            </span>
                            <span className="text-black font-medium">
                              {echeance.echeance.replace('_partiel', '')}
                              {estPartiel && ' (partiel)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-black">
                              {formatMontant(echeance.montant)} GNF
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              estPaye ? 'bg-green-100 text-green-700' : 
                              estPartiel ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {estPaye ? '✅ Payé' : estPartiel ? '⏳ Partiel' : '⏳ En attente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}