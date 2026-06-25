// components/PaiementPlanModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Wallet, Smartphone, CreditCard, CheckCircle, Clock, ShoppingCart, Bus, Utensils, GraduationCap } from "lucide-react";

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
  id: number;
  niveau: string;
  premier_versement: number;
  deuxieme_versement: number;
  troisieme_versement: number;
  total: number;
  type_inscription?: string;
}

interface ServiceOptionnel {
  total: number;
  details: any[];
}

interface ServicesOptionnels {
  transport: ServiceOptionnel;
  cantine: ServiceOptionnel;
  fournitures: ServiceOptionnel;
  total_services: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preinscriptionId: number;
  enfantNom: string;
  niveau: string;
}

type PaiementType = 'echeance' | 'frais_seuls' | 'tout';

const formatMontant = (montant: number): string => {
  return Math.round(montant).toLocaleString();
};

export default function PaiementPlanModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  preinscriptionId, 
  enfantNom, 
  niveau 
}: Props) {
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [plan, setPlan] = useState<PlanPaiement | null>(null);
  const [echeances, setEcheances] = useState<Echeance[]>([]);
  const [allEcheances, setAllEcheances] = useState<Echeance[]>([]);
  const [servicesOptionnels, setServicesOptionnels] = useState<ServicesOptionnels | null>(null);
  const [selectedEcheance, setSelectedEcheance] = useState<Echeance | null>(null);
  const [paiementType, setPaiementType] = useState<PaiementType>('echeance');
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inclureServicesOptionnels, setInclureServicesOptionnels] = useState(false);

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
        
        const allEcheancesData = data.echeances || [];
        setAllEcheances(allEcheancesData);
        
        // ⭐ Utiliser les échéances d'inscription filtrées
        const echeancesInscription = data.echeances_inscription || allEcheancesData.filter(
          (e: Echeance) => e.type === 'inscription'
        );
        setEcheances(echeancesInscription);
        
        setServicesOptionnels(data.services_optionnels || null);
        
        const echeanceNonPayee = echeancesInscription.find(
          (e: Echeance) => e.statut === 'en_attente'
        );
        if (echeanceNonPayee) {
          setSelectedEcheance(echeanceNonPayee);
        } else if (echeancesInscription.length > 0) {
          setSelectedEcheance(echeancesInscription[0]);
        }
        
        setInclureServicesOptionnels(false);
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
    if (!modePaiement) return;

    setPaying(true);
    setError(null);
    try {
      let echeancesIds: number[] = [];

      if (paiementType === 'echeance') {
        if (!selectedEcheance) {
          setError("Veuillez sélectionner une échéance");
          setPaying(false);
          return;
        }
        echeancesIds = [selectedEcheance.id];
        
        if (inclureServicesOptionnels && servicesOptionnels && servicesOptionnels.total_services > 0) {
          const servicesEcheances = allEcheances.filter(
            e => e.type !== 'inscription' && e.statut === 'en_attente'
          );
          echeancesIds = [...echeancesIds, ...servicesEcheances.map(e => e.id)];
        }
      } else if (paiementType === 'frais_seuls') {
        echeancesIds = echeances
          .filter(e => e.statut === 'en_attente')
          .map(e => e.id);
      } else if (paiementType === 'tout') {
        echeancesIds = allEcheances
          .filter(e => e.statut === 'en_attente')
          .map(e => e.id);
      }

      if (echeancesIds.length === 0) {
        setError("Aucune échéance à payer");
        setPaying(false);
        return;
      }

      const response = await fetch("/api/parent/paiement-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          echeancesIds,
          modePaiement,
          reference: reference || null,
          type: paiementType
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        await fetchPlan();
        setPaiementType('echeance');
        setModePaiement("");
        setReference("");
        setInclureServicesOptionnels(false);
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

  const getEcheanceLabel = (echeance: string) => {
    const map: { [key: string]: string } = {
      '1er_versement': '1er Versement',
      '2eme_versement': '2ème Versement',
      '3eme_versement': '3ème Versement'
    };
    return map[echeance] || echeance;
  };

  const getTypeLabel = (type: string) => {
    const map: { [key: string]: string } = {
      'inscription': 'Inscription',
      'transport': 'Transport',
      'cantine': 'Cantine',
      'fournitures': 'Fournitures'
    };
    return map[type] || type;
  };

  const getTypeIcon = (type: string) => {
    const map: { [key: string]: React.ReactNode } = {
      'inscription': <GraduationCap className="w-4 h-4 inline" />,
      'transport': <Bus className="w-4 h-4 inline" />,
      'cantine': <Utensils className="w-4 h-4 inline" />,
      'fournitures': <ShoppingCart className="w-4 h-4 inline" />
    };
    return map[type] || '📝';
  };

  const getMontantTotalRestant = () => {
    return echeances
      .filter(e => e.statut === 'en_attente')
      .reduce((sum, e) => sum + e.montant, 0);
  };

  const getMontantTotalAvecServices = () => {
    let total = getMontantTotalRestant();
    if (inclureServicesOptionnels && servicesOptionnels) {
      total += servicesOptionnels.total_services;
    }
    return total;
  };

  const hasEcheancesInscription = () => {
    return echeances.some(e => e.statut === 'en_attente');
  };

  const hasServicesOptionnelsDisponibles = () => {
    if (!servicesOptionnels || servicesOptionnels.total_services === 0) return false;
    return allEcheances.some(e => e.type !== 'inscription' && e.statut === 'en_attente');
  };

  if (!isOpen) return null;

  const montant1er = plan?.premier_versement || 0;
  const montant2eme = plan?.deuxieme_versement || 0;
  const montant3eme = plan?.troisieme_versement || 0;
  const totalPlan = plan?.total || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">Plan de paiement</h2>
              <p className="text-sm text-gray-600">{enfantNom} - {niveau}</p>
              {plan?.type_inscription && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {plan.type_inscription === 'reinscription' ? 'Réinscription' : 'Inscription'}
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Chargement du plan...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg text-center text-red-700">
              <p>{error}</p>
              <button
                onClick={fetchPlan}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Réessayer
              </button>
            </div>
          ) : plan ? (
            <>
              {/* ⭐ Tableau récapitulatif avec les montants EXACTS du plan */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left text-gray-700">Niveau</th>
                      <th className="border p-2 text-left text-gray-700">1er Versement</th>
                      <th className="border p-2 text-left text-gray-700">2ème Versement</th>
                      <th className="border p-2 text-left text-gray-700">3ème Versement</th>
                      <th className="border p-2 text-left text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium text-black">{plan.niveau || niveau}</td>
                      <td className="border p-2 text-blue-600 font-medium">
                        {formatMontant(montant1er)} GNF
                      </td>
                      <td className="border p-2 text-blue-600 font-medium">
                        {formatMontant(montant2eme)} GNF
                      </td>
                      <td className="border p-2 text-blue-600 font-medium">
                        {formatMontant(montant3eme)} GNF
                      </td>
                      <td className="border p-2 font-bold text-black">
                        {formatMontant(totalPlan)} GNF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Services optionnels */}
              {servicesOptionnels && servicesOptionnels.total_services > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Services optionnels (paiement en une fois)</h4>
                  {servicesOptionnels.transport.total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Transport</span>
                      <span className="font-medium text-green-600">{servicesOptionnels.transport.total.toLocaleString()} GNF</span>
                    </div>
                  )}
                  {servicesOptionnels.cantine.total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Cantine</span>
                      <span className="font-medium text-orange-600">{servicesOptionnels.cantine.total.toLocaleString()} GNF</span>
                    </div>
                  )}
                  {servicesOptionnels.fournitures.total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Fournitures</span>
                      <span className="font-medium text-purple-600">{servicesOptionnels.fournitures.total.toLocaleString()} GNF</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-black">
                    <span>Total services</span>
                    <span className="text-blue-600">{servicesOptionnels.total_services.toLocaleString()} GNF</span>
                  </div>
                </div>
              )}

              {/* Sélection du type de paiement */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Choisissez votre option de paiement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {hasEcheancesInscription() && (
                    <button
                      onClick={() => setPaiementType('echeance')}
                      className={`p-4 border rounded-lg text-center transition ${
                        paiementType === 'echeance'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium text-sm text-black">Payer une échéance</p>
                      <p className="text-xs text-gray-900">Paiement échelonné</p>
                    </button>
                  )}

                  <button
                    onClick={() => setPaiementType('frais_seuls')}
                    className={`p-4 border rounded-lg text-center transition ${
                      paiementType === 'frais_seuls'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <GraduationCap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium text-sm text-black">Frais scolaires seuls</p>
                    <p className="text-xs text-gray-900">Sans services optionnels</p>
                    {getMontantTotalRestant() > 0 && (
                      <p className="text-xs font-bold text-purple-600 mt-1">
                        {formatMontant(getMontantTotalRestant())} GNF
                      </p>
                    )}
                  </button>

                  <button
                    onClick={() => setPaiementType('tout')}
                    className={`p-4 border rounded-lg text-center transition ${
                      paiementType === 'tout'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="font-medium text-sm text-black">Tout payer</p>
                    <p className="text-xs text-gray-900">Inscription + Services</p>
                    {servicesOptionnels && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        {formatMontant(getMontantTotalRestant() + servicesOptionnels.total_services)} GNF
                      </p>
                    )}
                  </button>
                </div>
              </div>

              {/* Détail des frais restants */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Détail des frais restants</h4>
                <div className="space-y-1 text-sm">
                  {echeances.filter(e => e.statut === 'en_attente').length > 0 ? (
                    echeances
                      .filter(e => e.statut === 'en_attente')
                      .map(e => (
                        <div key={e.id} className="flex justify-between">
                          <span className="text-gray-700">{getEcheanceLabel(e.echeance)}</span>
                          <span className="font-medium text-blue-600">{formatMontant(e.montant)} GNF</span>
                        </div>
                      ))
                  ) : (
                    <div className="text-gray-500 text-center py-2">Aucun frais restant</div>
                  )}
                  
                  {paiementType === 'echeance' && inclureServicesOptionnels && servicesOptionnels && servicesOptionnels.total_services > 0 && (
                    <>
                      {servicesOptionnels.transport.total > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>+ Transport</span>
                          <span>{servicesOptionnels.transport.total.toLocaleString()} GNF</span>
                        </div>
                      )}
                      {servicesOptionnels.cantine.total > 0 && (
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>+ Cantine</span>
                          <span>{servicesOptionnels.cantine.total.toLocaleString()} GNF</span>
                        </div>
                      )}
                      {servicesOptionnels.fournitures.total > 0 && (
                        <div className="flex justify-between text-sm text-purple-600">
                          <span>+ Fournitures</span>
                          <span>{servicesOptionnels.fournitures.total.toLocaleString()} GNF</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="border-t text-black pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg">
                      {formatMontant(
                        paiementType === 'echeance' 
                          ? getMontantTotalAvecServices()
                          : paiementType === 'frais_seuls'
                            ? getMontantTotalRestant()
                            : getMontantTotalRestant() + (servicesOptionnels?.total_services || 0)
                      )} GNF
                    </span>
                  </div>
                </div>
              </div>

              {/* Échéances d'inscription */}
              {paiementType === 'echeance' && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-gray-900">Échéances d'inscription</h3>
                  <p className="text-xs text-gray-800 mb-2">
                    Sélectionnez une échéance à payer. Cochez la case ci-dessous pour inclure les services optionnels.
                  </p>
                  
                  {hasServicesOptionnelsDisponibles() && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inclureServicesOptionnels}
                          onChange={(e) => setInclureServicesOptionnels(e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-800">
                            Inclure les services optionnels
                          </span>
                          <p className="text-xs text-gray-600">
                            Transport, cantine et fournitures (paiement en une fois)
                          </p>
                        </div>
                      </label>
                      {inclureServicesOptionnels && servicesOptionnels && (
                        <div className="mt-2 text-sm text-gray-700 border-t pt-2">
                          <p className="font-medium">Montant supplémentaire : {formatMontant(servicesOptionnels.total_services)} GNF</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {echeances.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>Aucune échéance d'inscription disponible</p>
                    </div>
                  ) : (
                    echeances.map((echeance) => (
                      <div
                        key={echeance.id}
                        onClick={() => {
                          if (echeance.statut === 'en_attente') {
                            setSelectedEcheance(echeance);
                          }
                        }}
                        className={`p-3 rounded-lg border flex justify-between items-center transition ${
                          echeance.statut === 'paye' 
                            ? 'bg-green-50 border-green-200 cursor-default' 
                            : selectedEcheance?.id === echeance.id 
                              ? 'bg-blue-50 border-blue-400' 
                              : 'hover:bg-gray-50 border-gray-200 cursor-pointer'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-black">
                            {getEcheanceLabel(echeance.echeance)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {getTypeIcon(echeance.type)} {getTypeLabel(echeance.type)} - {echeance.date_echeance ? new Date(echeance.date_echeance).toLocaleDateString('fr-FR') : 'Date non définie'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-black">{formatMontant(echeance.montant)} GNF</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            echeance.statut === 'paye' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {echeance.statut === 'paye' ? '✓ Payé' : 'En attente'}
                          </span>
                          {echeance.statut === 'paye' && echeance.date_paiement && (
                            <p className="text-xs text-green-600 mt-1">
                              Payé le {new Date(echeance.date_paiement).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Formulaire de paiement */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {paiementType === 'echeance' && selectedEcheance 
                    ? `Payer ${getEcheanceLabel(selectedEcheance.echeance)}${inclureServicesOptionnels ? ' + Services' : ''}`
                    : paiementType === 'frais_seuls'
                      ? 'Payer les frais scolaires'
                      : 'Payer la totalité'
                  }
                </h3>
                
                <div className="bg-blue-50 p-3 rounded-lg text-center mb-4">
                  <p className="text-sm text-gray-600">Montant à payer</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatMontant(
                      paiementType === 'echeance' && selectedEcheance
                        ? selectedEcheance.montant + (inclureServicesOptionnels && servicesOptionnels ? servicesOptionnels.total_services : 0)
                        : paiementType === 'frais_seuls'
                          ? getMontantTotalRestant()
                          : getMontantTotalRestant() + (servicesOptionnels?.total_services || 0)
                    )} GNF
                  </p>
                  {paiementType === 'echeance' && selectedEcheance && (
                    <p className="text-xs text-gray-500">
                      {getTypeLabel(selectedEcheance.type)}
                      {inclureServicesOptionnels && servicesOptionnels && (
                        <span className="block text-green-600 font-medium">
                          + Services optionnels : {formatMontant(servicesOptionnels.total_services)} GNF
                        </span>
                      )}
                    </p>
                  )}
                </div>

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
                  disabled={!modePaiement || paying || (paiementType === 'echeance' && !selectedEcheance)}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    !modePaiement || paying || (paiementType === 'echeance' && !selectedEcheance)
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

              {echeances.length > 0 && echeances.every((e) => e.statut === 'paye') && (
                <div className="mt-6 bg-green-50 p-4 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">✓ Toutes les échéances sont payées !</p>
                  <p className="text-sm text-green-600">Vous avez finalisé tous vos paiements d'inscription.</p>
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