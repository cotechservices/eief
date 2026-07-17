"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User, GraduationCap, CreditCard, CheckCircle, AlertCircle, Bus, Utensils, ShoppingCart, ChevronRight, Search } from "lucide-react";

// ⭐ Interface corrigée pour correspondre à l'API
interface Eleve {
  id: number;
  enfant_nom: string;
  enfant_prenom: string;
  matricule: string;
  classe_nom: string;
  niveau: string;
  photo_url: string | null;
  // Pour compatibilité
  nom?: string;
  prenom?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  reinscription_total_versement: number;
  reinscription_premier_versement: number;
  reinscription_deuxieme_versement: number;
  reinscription_troisieme_versement: number;
  total_versement: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formatMontant = (montant: number): string => {
  return Math.round(Math.max(0, montant)).toLocaleString();
};

// ⭐ Fonctions utilitaires
const getEleveNom = (eleve: Eleve): string => eleve.enfant_nom || eleve.nom || '';
const getElevePrenom = (eleve: Eleve): string => eleve.enfant_prenom || eleve.prenom || '';
const getEleveNomComplet = (eleve: Eleve): string => `${getElevePrenom(eleve)} ${getEleveNom(eleve)}`;

export default function AdminReinscriptionModal({ isOpen, onClose, onSuccess }: Props) {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [searchEleve, setSearchEleve] = useState("");
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);

  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClasseId, setSelectedClasseId] = useState<number | null>(null);
  const [fraisReinscription, setFraisReinscription] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedServices, setSelectedServices] = useState({
    transport: false,
    cantine: false,
    fournitures: false
  });
  const [transportPrix, setTransportPrix] = useState(0);
  const [cantinePrix, setCantinePrix] = useState(0);
  const [fournituresPrix, setFournituresPrix] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchEleves();
      fetchClasses();
      setSelectedEleve(null);
      setSelectedClasseId(null);
      setFraisReinscription(0);
      setSelectedServices({ transport: false, cantine: false, fournitures: false });
      setTransportPrix(0);
      setCantinePrix(0);
      setFournituresPrix(0);
      setError(null);
      setSuccess(false);
      setSearchEleve("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClasseId) {
      const classe = classes.find(c => c.id === selectedClasseId);
      if (classe) {
        setFraisReinscription(classe.reinscription_total_versement || classe.total_versement || 0);
      }
    }
  }, [selectedClasseId, classes]);

  const fetchEleves = async () => {
    setLoadingEleves(true);
    try {
      const response = await fetch("/api/admin/eleves");
      if (response.ok) {
        const data = await response.json();
        setEleves(data);
      }
    } catch (error) {
      console.error("Erreur chargement élèves:", error);
    } finally {
      setLoadingEleves(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/public/classes");
      if (response.ok) {
        const data = await response.json();
        const classesWithReinscription = data.map((c: any) => ({
          ...c,
          reinscription_total_versement: c.reinscription_total_versement || c.total_versement || 0,
          reinscription_premier_versement: c.reinscription_premier_versement || c.premier_versement || 0,
          reinscription_deuxieme_versement: c.reinscription_deuxieme_versement || c.deuxieme_versement || 0,
          reinscription_troisieme_versement: c.reinscription_troisieme_versement || c.troisieme_versement || 0
        }));
        setClasses(classesWithReinscription);
      }
    } catch (error) {
      console.error("Erreur chargement classes:", error);
    }
  };

  // ⭐ FILTRE CORRIGÉ avec gestion des undefined
  const filteredEleves = eleves.filter(e => {
    const searchLower = searchEleve.toLowerCase();
    const nom = (getEleveNom(e) || '').toLowerCase();
    const prenom = (getElevePrenom(e) || '').toLowerCase();
    const matricule = (e.matricule || '').toLowerCase();
    
    return nom.includes(searchLower) ||
           prenom.includes(searchLower) ||
           matricule.includes(searchLower);
  });

  const getTotalGeneral = () => {
    let total = fraisReinscription;
    if (selectedServices.transport && transportPrix > 0) total += transportPrix;
    if (selectedServices.cantine && cantinePrix > 0) total += cantinePrix;
    if (selectedServices.fournitures && fournituresPrix > 0) total += fournituresPrix;
    return total;
  };

  const handleSubmit = async () => {
    if (!selectedEleve || !selectedClasseId) {
      setError("Veuillez sélectionner un élève et une classe");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const transport = selectedServices.transport ? [{ nom: 'transport', prix: transportPrix }] : [];
      const cantine = selectedServices.cantine ? [{ nom: 'cantine', prix: cantinePrix }] : [];
      const fournitures = selectedServices.fournitures ? [{ nom: 'fournitures', prix: fournituresPrix }] : [];

      const response = await fetch("/api/admin/reinscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eleveId: selectedEleve.id,
          classeId: selectedClasseId,
          montantFrais: fraisReinscription,
          transport,
          cantine,
          fournitures,
          montantTransport: selectedServices.transport ? transportPrix : 0,
          montantCantine: selectedServices.cantine ? cantinePrix : 0,
          montantFournitures: selectedServices.fournitures ? fournituresPrix : 0
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Erreur lors de la création de la réinscription");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-black">Nouvelle réinscription</h2>
              <p className="text-sm text-gray-600">Créez une réinscription pour un élève</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Sélection de l'élève */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Élève à réinscrire *
            </label>
            
            {!selectedEleve ? (
              <div className="border rounded-lg p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un élève par nom, prénom ou matricule..."
                    value={searchEleve}
                    onChange={(e) => setSearchEleve(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                  />
                </div>
                
                {loadingEleves ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : filteredEleves.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{searchEleve ? "Aucun élève trouvé" : "Aucun élève disponible"}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                    {filteredEleves.map((eleve) => (
                      <button
                        key={eleve.id}
                        onClick={() => {
                          setSelectedEleve(eleve);
                        }}
                        className="flex items-center gap-4 p-3 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-left w-full"
                      >
                        {eleve.photo_url ? (
                          <img src={eleve.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-black">{getEleveNomComplet(eleve)}</p>
                          <p className="text-sm text-gray-500">Matricule: {eleve.matricule || 'N/A'}</p>
                          <p className="text-xs text-purple-600">{eleve.classe_nom || 'Sans classe'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedEleve.photo_url ? (
                    <img src={selectedEleve.photo_url} alt="photo" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-7 h-7 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-black text-lg">{getEleveNomComplet(selectedEleve)}</p>
                    <p className="text-sm text-gray-600">Matricule: {selectedEleve.matricule || 'N/A'}</p>
                    <p className="text-sm text-gray-600">Classe actuelle: {selectedEleve.classe_nom || 'Non définie'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEleve(null)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Changer
                </button>
              </div>
            )}
          </div>

          {/* Suite du formulaire... (classe, frais, services, total, boutons) */}
          {selectedEleve && (
            <>
              {/* Sélection de la classe */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Classe pour la réinscription *
                </label>
                <select
                  value={selectedClasseId || ""}
                  onChange={(e) => setSelectedClasseId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((classe) => (
                    <option key={classe.id} value={classe.id}>
                      {classe.niveau} - {classe.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Frais de réinscription */}
              {selectedClasseId && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-3">Frais de réinscription</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-500">1er versement</p>
                      <p className="font-bold text-purple-600">
                        {formatMontant(classes.find(c => c.id === selectedClasseId)?.reinscription_premier_versement || 0)} GNF
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-500">2ème versement</p>
                      <p className="font-bold text-purple-600">
                        {formatMontant(classes.find(c => c.id === selectedClasseId)?.reinscription_deuxieme_versement || 0)} GNF
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-500">3ème versement</p>
                      <p className="font-bold text-purple-600">
                        {formatMontant(classes.find(c => c.id === selectedClasseId)?.reinscription_troisieme_versement || 0)} GNF
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg border border-purple-300 text-center">
                      <p className="text-xs text-gray-600 font-semibold">Total</p>
                      <p className="font-bold text-purple-700 text-lg">
                        {formatMontant(fraisReinscription)} GNF
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Services optionnels */}
              {selectedClasseId && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Services optionnels</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedServices.transport}
                        onChange={(e) => {
                          setSelectedServices(prev => ({ ...prev, transport: e.target.checked }));
                          if (e.target.checked) setTransportPrix(2000000);
                          else setTransportPrix(0);
                        }}
                        className="w-5 h-5 text-purple-600 rounded"
                      />
                      <Bus className="w-5 h-5 text-blue-600" />
                      <span className="flex-1 text-gray-700">Transport scolaire</span>
                      <input
                        type="number"
                        value={transportPrix}
                        onChange={(e) => setTransportPrix(Number(e.target.value))}
                        disabled={!selectedServices.transport}
                        className="w-32 px-2 py-1 border rounded text-right text-black disabled:bg-gray-100"
                        placeholder="Prix"
                      />
                      <span className="text-gray-500 text-sm">GNF</span>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedServices.cantine}
                        onChange={(e) => {
                          setSelectedServices(prev => ({ ...prev, cantine: e.target.checked }));
                          if (e.target.checked) setCantinePrix(3600000);
                          else setCantinePrix(0);
                        }}
                        className="w-5 h-5 text-purple-600 rounded"
                      />
                      <Utensils className="w-5 h-5 text-orange-600" />
                      <span className="flex-1 text-gray-700">Cantine</span>
                      <input
                        type="number"
                        value={cantinePrix}
                        onChange={(e) => setCantinePrix(Number(e.target.value))}
                        disabled={!selectedServices.cantine}
                        className="w-32 px-2 py-1 border rounded text-right text-black disabled:bg-gray-100"
                        placeholder="Prix"
                      />
                      <span className="text-gray-500 text-sm">GNF</span>
                    </div>

                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedServices.fournitures}
                        onChange={(e) => {
                          setSelectedServices(prev => ({ ...prev, fournitures: e.target.checked }));
                          if (e.target.checked) setFournituresPrix(400000);
                          else setFournituresPrix(0);
                        }}
                        className="w-5 h-5 text-purple-600 rounded"
                      />
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                      <span className="flex-1 text-gray-700">Fournitures scolaires</span>
                      <input
                        type="number"
                        value={fournituresPrix}
                        onChange={(e) => setFournituresPrix(Number(e.target.value))}
                        disabled={!selectedServices.fournitures}
                        className="w-32 px-2 py-1 border rounded text-right text-black disabled:bg-gray-100"
                        placeholder="Prix"
                      />
                      <span className="text-gray-500 text-sm">GNF</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total général */}
              {selectedClasseId && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total général</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatMontant(getTotalGeneral())} GNF
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Frais de réinscription</span>
                      <span>{formatMontant(fraisReinscription)} GNF</span>
                    </div>
                    {selectedServices.transport && transportPrix > 0 && (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-600">└ Transport</span>
                        <span>{formatMontant(transportPrix)} GNF</span>
                      </div>
                    )}
                    {selectedServices.cantine && cantinePrix > 0 && (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-600">└ Cantine</span>
                        <span>{formatMontant(cantinePrix)} GNF</span>
                      </div>
                    )}
                    {selectedServices.fournitures && fournituresPrix > 0 && (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-600">└ Fournitures</span>
                        <span>{formatMontant(fournituresPrix)} GNF</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 p-3 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 p-3 rounded-lg text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Réinscription créée avec succès !
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition text-black"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedClasseId || success}
                  className={`px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                    loading || !selectedClasseId || success
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer la réinscription'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}