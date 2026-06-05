// app/dashboard/parent/finances/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Download,
  Eye,
  Printer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
  Bus,
  Utensils,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Users
} from "lucide-react";

interface Paiement {
  id: number;
  date: string;
  montant: number;
  type_frais: string;
  statut: "paye" | "en_attente" | "impaye";
  mode_paiement: "mobile_money" | "especes" | "carte";
  reference: string;
  mois: number;
  annee: number;
  description?: string;
}

interface Enfant {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  classe_nom: string;
  frais_total: number;
  total_paye: number;
  total_en_attente: number;
  solde_restant: number;
  paiements: Paiement[];
}

interface Totals {
  total_du: number;
  total_paye: number;
  total_en_attente: number;
  solde_restant: number;
}

interface DepensesParCategorie {
  inscription: number;
  mensualite: number;
  cantine: number;
  transport: number;
  bibliotheque: number;
  librairie: number;
  autre: number;
}

export default function ParentFinancesPage() {
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnfantId, setSelectedEnfantId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategorie, setSelectedCategorie] = useState<string>("toutes");
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const financesRes = await fetch("/api/parent/finances");
      const financesData = await financesRes.json();

      setEnfants(financesData.enfants || []);
      setTotals(financesData.totals);

      if (financesData.enfants?.length > 0 && !selectedEnfantId) {
        setSelectedEnfantId(financesData.enfants[0].id);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const enfantSelectionne = enfants.find(e => e.id === selectedEnfantId);
  const paiements = enfantSelectionne?.paiements || [];

  // Filtrer par catégorie
  const paiementsFiltres = selectedCategorie === "toutes"
    ? paiements
    : paiements.filter(p => p.type_frais === selectedCategorie);

  const totalPages = Math.ceil(paiementsFiltres.length / itemsPerPage);
  const paginatedPaiements = paiementsFiltres.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculer les dépenses par catégorie
  const depensesParCategorie: DepensesParCategorie = {
    inscription: paiements.filter(p => p.type_frais === "inscription" && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    mensualite: paiements.filter(p => p.type_frais === "mensualite" && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    cantine: paiements.filter(p => p.type_frais === "cantine" && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    transport: paiements.filter(p => p.type_frais === "transport" && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    bibliotheque: paiements.filter(p => p.type_frais === "bibliotheque" && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    librairie: paiements.filter(p => p.type_frais === "librairie" && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0),
    autre: paiements.filter(p => !["inscription", "mensualite", "cantine", "transport", "bibliotheque", "librairie"].includes(p.type_frais) && p.statut === "paye").reduce((acc, p) => acc + p.montant, 0)
  };

  const totalDepenses = Object.values(depensesParCategorie).reduce((acc, val) => acc + val, 0);

  const tauxRecouvrement = totals && totals.total_du > 0
    ? (totals.total_paye / totals.total_du) * 100
    : 0;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "paye":
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
      case "en_attente":
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case "impaye":
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Impayé</span>;
      default:
        return <span>{statut}</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      inscription: <GraduationCap className="w-4 h-4 text-blue-600" />,
      mensualite: <CreditCard className="w-4 h-4 text-green-600" />,
      cantine: <Utensils className="w-4 h-4 text-orange-600" />,
      transport: <Bus className="w-4 h-4 text-purple-600" />,
      bibliotheque: <BookOpen className="w-4 h-4 text-teal-600" />,
      librairie: <ShoppingBag className="w-4 h-4 text-pink-600" />
    };
    return icons[type] || <CreditCard className="w-4 h-4 text-gray-900" />;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      inscription: "Inscription",
      mensualite: "Mensualité",
      cantine: "Cantine",
      transport: "Transport",
      bibliotheque: "Bibliothèque",
      librairie: "Librairie",
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "mobile_money":
        return <Smartphone className="w-4 h-4 text-green-600" />;
      case "especes":
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case "carte":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      mobile_money: "Orange Money",
      especes: "Espèces",
      carte: "Carte bancaire",
    };
    return modes[mode] || mode;
  };

  const categories = [
    { value: "toutes", label: "Toutes les catégories", icon: <CreditCard className="w-4 h-4" /> },
    { value: "inscription", label: "Inscription", icon: <GraduationCap className="w-4 h-4" /> },
    { value: "mensualite", label: "Mensualité", icon: <CreditCard className="w-4 h-4" /> },
    { value: "cantine", label: "Cantine", icon: <Utensils className="w-4 h-4" /> },
    { value: "transport", label: "Transport", icon: <Bus className="w-4 h-4" /> },
    { value: "bibliotheque", label: "Bibliothèque", icon: <BookOpen className="w-4 h-4" /> },
    { value: "librairie", label: "Librairie", icon: <ShoppingBag className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
        <p className="text-gray-900">Gérez les paiements de vos enfants</p>
      </div>

      {/* Cartes récapitulatives */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-90">Total dû (tous enfants)</p>
            <p className="text-2xl font-bold">{totals.total_du.toLocaleString()} GNF</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-900 text-sm">Déjà payé</p><p className="text-2xl font-bold text-green-600">{totals.total_paye.toLocaleString()} GNF</p></div>
              <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-900 text-sm">En attente</p><p className="text-2xl font-bold text-yellow-600">{totals.total_en_attente.toLocaleString()} GNF</p></div>
              <div className="bg-yellow-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-yellow-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div><p className="text-gray-900 text-sm">Solde restant</p><p className="text-2xl font-bold text-orange-600">{totals.solde_restant.toLocaleString()} GNF</p></div>
              <div className="bg-orange-100 p-3 rounded-lg"><AlertCircle className="w-6 h-6 text-orange-600" /></div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {totals && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progression globale des paiements</span>
            <span className="font-medium">{tauxRecouvrement.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${tauxRecouvrement}%` }}></div>
          </div>
        </div>
      )}

      {/* Graphique Dépenses par catégorie (tous enfants) */}
      {enfants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Dépenses par catégorie (tous enfants)
          </h3>
          <div className="space-y-3">
            {Object.entries(depensesParCategorie).map(([categorie, montant]) => {
              if (montant === 0) return null;
              const pourcentage = totalDepenses > 0 ? (montant / totalDepenses) * 100 : 0;
              const labels: Record<string, string> = {
                inscription: "Inscription",
                mensualite: "Mensualité",
                cantine: "Cantine",
                transport: "Transport",
                bibliotheque: "Bibliothèque",
                librairie: "Librairie",
                autre: "Autre"
              };
              const colors: Record<string, string> = {
                inscription: "bg-blue-500",
                mensualite: "bg-green-500",
                cantine: "bg-orange-500",
                transport: "bg-purple-500",
                bibliotheque: "bg-teal-500",
                librairie: "bg-pink-500",
                autre: "bg-gray-500"
              };
              return (
                <div key={categorie}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{labels[categorie]}</span>
                    <span className="text-gray-900">{montant.toLocaleString()} GNF ({pourcentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${colors[categorie]} h-2 rounded-full`} style={{ width: `${pourcentage}%` }}></div>
                  </div>
                </div>
              );
            })}
            {totalDepenses === 0 && (
              <p className="text-center text-gray-900 py-4">Aucune dépense enregistrée</p>
            )}
          </div>
        </div>
      )}

      {/* Historique des paiements avec sélection de l'enfant intégrée */}
      {enfants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h3 className="font-semibold text-gray-900">Historique des paiements</h3>

              {/* Sélection de l'enfant - intégrée ici */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-900 flex items-center gap-1 mr-2">
                  <Users className="w-4 h-4" /> Enfant:
                </span>
                {enfants.map((enfant) => (
                  <button
                    key={enfant.id}
                    onClick={() => { setSelectedEnfantId(enfant.id); setCurrentPage(1); setSelectedCategorie("toutes"); }}
                    className={`px-3 py-1 rounded-lg text-sm transition ${selectedEnfantId === enfant.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                  >
                    {enfant.prenom} {enfant.nom}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtre par catégorie */}
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setSelectedCategorie(cat.value); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition ${selectedCategorie === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 hover:bg-gray-200 border"
                    }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {enfantSelectionne && (
            <>
              <div className="px-6 py-2 bg-blue-50 border-b">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-900">Élève:</span>
                    <span className="font-semibold ml-2">{enfantSelectionne.prenom} {enfantSelectionne.nom}</span>
                    <span className="text-gray-900 ml-2">({enfantSelectionne.classe_nom})</span>
                  </div>
                  <div>
                    <span className="text-gray-900">Matricule:</span>
                    <span className="font-mono text-sm ml-2">{enfantSelectionne.matricule}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Catégorie</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-900 uppercase">Montant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Mode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedPaiements.map((paiement) => (
                      <tr key={paiement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{new Date(paiement.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(paiement.type_frais)}
                            <span className="text-sm">{getTypeLabel(paiement.type_frais)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{paiement.montant.toLocaleString()} GNF</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {getModeIcon(paiement.mode_paiement)}
                            <span className="text-sm">{getModeLabel(paiement.mode_paiement)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getStatutBadge(paiement.statut)}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-700"><Eye className="w-4 h-4" /></button>
                            <button className="text-gray-900 hover:text-gray-900"><Printer className="w-4 h-4" /></button>
                            {paiement.statut === "impaye" && (
                              <button className="text-green-600 hover:text-green-700"><CreditCard className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paiementsFiltres.length === 0 && (
                <div className="text-center py-8 text-gray-900">
                  Aucun paiement trouvé
                </div>
              )}

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <p className="text-sm text-gray-900">{paiementsFiltres.length} paiements</p>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {enfants.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <FileText className="w-16 h-16 text-gray-900 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucun enfant inscrit</h3>
          <p className="text-gray-900 mt-2">Vous n'avez pas encore d'enfant inscrit dans l'école.</p>
          <Link href="/register" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Inscrire un enfant</Link>
        </div>
      )}
    </div>
  );
}