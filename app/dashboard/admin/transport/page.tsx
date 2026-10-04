// app/dashboard/admin/transport/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bus,
  MapPin,
  Users,
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Search,
  Calendar,
  BookA,
  UserPlus,
  Minus,
  X,
} from "lucide-react";

interface BusItem {
  id: number;
  immatriculation: string;
  chauffeur: string;
  chauffeur_tel?: string;
  capacite: number;
  inscrits: number;
  trajet: string;
  horaireMatin: string;
  horaireSoir: string;
  statut: string;
  prix_abonnement?: number;
}

interface InscriptionTransport {
  id: number;
  eleve_id: number;
  ligne_id: number;
  est_actif: boolean;
  solde: number;
  date_inscription: string;
  mois_total: number;
  mois_restants: number;
  montant_mensuel: number;
  montant_total: number;
  eleve_nom: string;
  eleve_prenom: string;
  classe_nom: string;
  ligne_nom: string;
  bus_immatriculation: string;
}

interface Eleve {
  id: number | null;
  nom: string;
  prenom: string;
  matricule: string;
  classe_nom: string;
  source: "eleve" | "preinscription";
  preinscription_id: number | null;
  ref_id: number;
}

interface LigneTransport {
  id: number;
  nom: string;
  prix_abonnement: number;
  bus_immatriculation: string;
}

export default function TransportPage() {
  const [bus, setBus] = useState<BusItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // États pour la gestion des bus
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<BusItem | null>(null);
  const [formData, setFormData] = useState({
    immatriculation: "",
    chauffeur: "",
    chauffeur_tel: "",
    capacite: 30,
    trajet: "",
    horaireMatin: "07:30",
    horaireSoir: "16:30",
    prix_abonnement: 50000,
  });

  // États pour les inscriptions
  const [inscriptions, setInscriptions] = useState<InscriptionTransport[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [lignes, setLignes] = useState<LigneTransport[]>([]);
  const [showInscriptionForm, setShowInscriptionForm] = useState(false);
  const [editingInscription, setEditingInscription] = useState<InscriptionTransport | null>(null);
  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null);
  const [inscriptionForm, setInscriptionForm] = useState({
    eleveId: "",
    ligneId: "",
    mois: 9,
    montantMensuel: 0,
    montantTotal: 0,
  });

  // ⭐ Nouveaux états pour la recherche d’élève
  const [eleveSearch, setEleveSearch] = useState("");
  const [filteredEleves, setFilteredEleves] = useState<Eleve[]>([]);
  const [showEleveDropdown, setShowEleveDropdown] = useState(false);
  const eleveInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les données
  const fetchTransport = async () => {
    try {
      const response = await fetch("/api/admin/transport");
      if (response.ok) {
        const data = await response.json();
        setBus(data.bus || []);
        setStats(data.stats || {
          totalBus: 0,
          totalInscrits: 0,
          tauxRemplissage: 0,
          recettesMois: 0,
        });
      }
    } catch (error) {
      console.error("Erreur chargement transport:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInscriptions = async () => {
    try {
      const res = await fetch("/api/admin/transport/inscriptions");
      if (res.ok) {
        const data = await res.json();
        setInscriptions(data);
      }
    } catch (error) {
      console.error("Erreur chargement inscriptions:", error);
    }
  };

  const fetchEleves = async () => {
    try {
      // ⭐ Charger élèves inscrits + pré-inscriptions en attente
      const res = await fetch("/api/admin/eleves-et-preinscriptions");
      if (res.ok) {
        const data = await res.json();
        setEleves(data);
        setFilteredEleves(data);
      }
    } catch (error) {
      console.error("Erreur chargement élèves:", error);
    }
  };

  const fetchLignes = async () => {
    try {
      const res = await fetch("/api/admin/transport/lignes");
      if (res.ok) {
        const data = await res.json();
        setLignes(data);
      }
    } catch (error) {
      console.error("Erreur chargement lignes:", error);
    }
  };

  useEffect(() => {
    fetchTransport();
    fetchInscriptions();
    fetchEleves();
    fetchLignes();
  }, []);

  // Gestion des bus
  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({
      immatriculation: "",
      chauffeur: "",
      chauffeur_tel: "",
      capacite: 30,
      trajet: "",
      horaireMatin: "07:30",
      horaireSoir: "16:30",
      prix_abonnement: 50000,
    });
    setShowForm(true);
  };

  const handleOpenEdit = (item: BusItem) => {
    setEditingBus(item);
    setFormData({
      immatriculation: item.immatriculation,
      chauffeur: item.chauffeur === "Non assigné" ? "" : item.chauffeur,
      chauffeur_tel: item.chauffeur_tel || "",
      capacite: item.capacite,
      trajet: item.trajet === "Aucun trajet" ? "" : item.trajet,
      horaireMatin: item.horaireMatin === "-" ? "07:30" : item.horaireMatin,
      horaireSoir: item.horaireSoir === "-" ? "16:30" : item.horaireSoir,
      prix_abonnement: item.prix_abonnement || 50000,
    });
    setShowForm(true);
  };

  const handleSubmitBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBus ? "PUT" : "POST";
      const body = editingBus ? { ...formData, id: editingBus.id } : formData;

      const response = await fetch("/api/admin/transport", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        fetchTransport();
        fetchLignes();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement du bus");
      }
    } catch (error) {
      console.error("Erreur soumission transport:", error);
    }
  };

  const handleDeleteBus = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce bus et sa ligne ?")) {
      try {
        const response = await fetch(`/api/admin/transport?id=${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchTransport();
          fetchLignes();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur suppression transport:", error);
      }
    }
  };

  // ========== Gestion des inscriptions ==========

  const handleOpenInscriptionAdd = () => {
    setEditingInscription(null);
    setInscriptionForm({
      eleveId: "",
      ligneId: "",
      mois: 9,
      montantMensuel: 0,
      montantTotal: 0,
    });
    setEleveSearch("");
    setFilteredEleves(eleves);
    fetchLignes();
    setShowInscriptionForm(true);
    // Réinitialiser le champ de recherche après l'ouverture
    setTimeout(() => eleveInputRef.current?.focus(), 100);
  };

  const handleOpenInscriptionEdit = (ins: InscriptionTransport) => {
    setEditingInscription(ins);
    setInscriptionForm({
      eleveId: ins.eleve_id.toString(),
      ligneId: ins.ligne_id.toString(),
      mois: ins.mois_total,
      montantMensuel: ins.montant_mensuel,
      montantTotal: ins.montant_total,
    });
    // Trouver l'élève pour afficher son nom dans la recherche
    const eleve = eleves.find(e => e.id === ins.eleve_id);
    setEleveSearch(eleve ? `${eleve.prenom} ${eleve.nom} (${eleve.matricule})` : "");
    setFilteredEleves(eleves);
    setShowInscriptionForm(true);
  };

  // Recherche d'élève
  useEffect(() => {
    if (eleveSearch.trim() === "") {
      setFilteredEleves(eleves);
    } else {
      const query = eleveSearch.toLowerCase();
      setFilteredEleves(
        eleves.filter(
          (e) =>
            e.nom.toLowerCase().includes(query) ||
            e.prenom.toLowerCase().includes(query) ||
            e.matricule.toLowerCase().includes(query)
        )
      );
    }
  }, [eleveSearch, eleves]);

  const handleSelectEleve = (eleve: Eleve) => {
    setSelectedEleve(eleve);
    // Pour les élèves inscrits, on utilise eleve.id ; pour les pré-inscriptions, on met null
    setInscriptionForm({ ...inscriptionForm, eleveId: eleve.ref_id.toString() });
    setEleveSearch(`${eleve.prenom} ${eleve.nom} (${eleve.matricule})${
      eleve.source === 'preinscription' ? ' ⏳ En attente' : ''
    }`);
    setShowEleveDropdown(false);
  };

  // Gestion de la ligne
  const handleLigneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ligneId = parseInt(e.target.value);
    const ligne = lignes.find((l) => l.id === ligneId);
    const prix = ligne?.prix_abonnement || 0;
    setInscriptionForm({
      ...inscriptionForm,
      ligneId: e.target.value,
      montantMensuel: prix,
      montantTotal: inscriptionForm.mois * prix,
    });
  };

  // Gestion des mois
  const handleMoisChange = (delta: number) => {
    const newMois = Math.max(1, Math.min(12, inscriptionForm.mois + delta));
    const prix = inscriptionForm.montantMensuel || 0;
    setInscriptionForm({
      ...inscriptionForm,
      mois: newMois,
      montantTotal: newMois * prix,
    });
  };

  // Soumission
  const handleInscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingInscription
        ? `/api/admin/transport/inscriptions/${editingInscription.id}`
        : "/api/admin/transport/inscrire";
      const method = editingInscription ? "PUT" : "POST";

      let body: any;
      if (editingInscription) {
        body = {
          mois: inscriptionForm.mois,
          montantMensuel: inscriptionForm.montantMensuel,
          montantTotal: inscriptionForm.montantTotal,
        };
      } else if (selectedEleve?.source === 'preinscription') {
        // ⭐ Pré-inscription (en_attente) → envoyer preinscriptionId
        body = {
          preinscriptionId: selectedEleve.preinscription_id,
          ligneId: parseInt(inscriptionForm.ligneId),
          mois: inscriptionForm.mois,
          montantMensuel: inscriptionForm.montantMensuel,
        };
      } else {
        // Élève inscrit → envoyer eleveId
        body = {
          eleveId: parseInt(inscriptionForm.eleveId),
          ligneId: parseInt(inscriptionForm.ligneId),
          mois: inscriptionForm.mois,
          montantMensuel: inscriptionForm.montantMensuel,
        };
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowInscriptionForm(false);
        setSelectedEleve(null);
        fetchInscriptions();
        fetchTransport();
        setTimeout(fetchTransport, 500);
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur soumission inscription:", error);
    }
  };

  const handleDeleteInscription = async (id: number) => {
    if (confirm("Voulez-vous vraiment désactiver cette inscription ?")) {
      try {
        const response = await fetch(`/api/admin/transport/inscriptions/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchInscriptions();
          fetchTransport();
        } else {
          alert("Erreur lors de la désactivation");
        }
      } catch (error) {
        console.error("Erreur désactivation inscription:", error);
      }
    }
  };

  // Fermer la dropdown au clic hors zone
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEleveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const recettesAnnuelles = stats ? stats.recettesMois * 10 : 0;

  if (loading || !stats) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  // ========== Rendu ==========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion du transport</h1>
          <p className="text-gray-900">Bus, trajets, inscriptions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/admin/admin_transport/presences"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Calendar className="w-4 h-4" />
            Présences
          </Link>
          <Link
            href="/dashboard/admin/admin_transport/rapports"
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
          >
            <BookA className="w-4 h-4" />
            Rapports
          </Link>
          <button
            onClick={handleOpenAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Ajouter un bus
          </button>
          <button
            onClick={handleOpenInscriptionAdd}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
          >
            <UserPlus className="w-4 h-4" />
            Inscrire un élève
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Bus en service</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalBus}</p>
          </div>
          <Bus className="w-8 h-8 text-blue-200" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Élèves inscrits</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalInscrits}</p>
          </div>
          <Users className="w-8 h-8 text-green-200" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Taux remplissage</p>
            <p className="text-2xl font-bold text-orange-600">{stats.tauxRemplissage}%</p>
          </div>
          <MapPin className="w-8 h-8 text-orange-200" />
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <p className="text-gray-900 text-sm">Recettes annuelles</p>
            <p className="text-2xl font-bold text-purple-600">
              {recettesAnnuelles.toLocaleString()} GNF
            </p>
          </div>
          <CreditCard className="w-8 h-8 text-purple-200" />
        </div>
      </div>

      {/* Liste des bus */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Liste des bus et trajets</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-gray-50/50"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
              <tr>
                <th className="px-6 py-3">Immatriculation</th>
                <th className="px-6 py-3">Chauffeur</th>
                <th className="px-6 py-3">Trajet / Ligne</th>
                <th className="px-6 py-3">Horaires</th>
                <th className="px-6 py-3">Élèves / Capacité</th>
                <th className="px-6 py-3">Prix</th>
                <th className="px-6 py-3">Taux</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {bus.map((b) => {
                const filledRatio =
                  b.capacite > 0 ? Math.round((b.inscrits / b.capacite) * 100) : 0;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {b.immatriculation}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{b.chauffeur}</div>
                      {b.chauffeur_tel && (
                        <div className="text-gray-900 text-xs">{b.chauffeur_tel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                        <MapPin className="w-3 h-3" /> {b.trajet}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      Matin: {b.horaireMatin} <br /> Soir: {b.horaireSoir}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      <span className="font-semibold">{b.inscrits}</span> /{" "}
                      {b.capacite} places
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {(b.prix_abonnement || 0).toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              filledRatio > 90
                                ? "bg-red-500"
                                : filledRatio > 50
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(100, filledRatio)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-900">{filledRatio}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBus(b.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bus.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-900">
                    Aucun bus disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste des inscriptions actives */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Élèves inscrits au transport</h3>
          <span className="text-sm text-gray-900">{inscriptions.length} inscrits</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-900 uppercase">
              <tr>
                <th className="px-6 py-3">Élève</th>
                <th className="px-6 py-3">Classe</th>
                <th className="px-6 py-3">Ligne</th>
                <th className="px-6 py-3">Bus</th>
                <th className="px-6 py-3">Mois</th>
                <th className="px-6 py-3">Mensuel</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Solde</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {inscriptions.map((ins) => (
                <tr key={ins.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {ins.eleve_prenom} {ins.eleve_nom}
                  </td>
                  <td className="px-6 py-4">{ins.classe_nom || "Non assigné"}</td>
                  <td className="px-6 py-4">{ins.ligne_nom}</td>
                  <td className="px-6 py-4">{ins.bus_immatriculation || "-"}</td>
                  <td className="px-6 py-4">{ins.mois_total} mois</td>
                  <td className="px-6 py-4">
                    {ins.montant_mensuel.toLocaleString()} GNF
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {ins.montant_total.toLocaleString()} GNF
                  </td>
                  <td className="px-6 py-4">
                    {ins.solde.toLocaleString()} GNF
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenInscriptionEdit(ins)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInscription(ins.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {inscriptions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-900">
                    Aucun élève inscrit au transport.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Modal Inscription (style cantine) ===== */}
      {showInscriptionForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInscription
                  ? "Modifier l'inscription au transport"
                  : "Inscription au transport"}
              </h2>
              <button
                onClick={() => setShowInscriptionForm(false)}
                className="text-gray-900 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInscriptionSubmit} className="space-y-4 text-black">
              {/* Élève avec recherche */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Élève *
                </label>
                <input
                  ref={eleveInputRef}
                  type="text"
                  placeholder="Rechercher par nom, prénom ou matricule..."
                  value={eleveSearch}
                  onChange={(e) => {
                    setEleveSearch(e.target.value);
                    setShowEleveDropdown(true);
                    if (e.target.value === "") {
                      setInscriptionForm({ ...inscriptionForm, eleveId: "" });
                    }
                  }}
                  onFocus={() => setShowEleveDropdown(true)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {showEleveDropdown && filteredEleves.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                    {filteredEleves.map((el) => (
                      <div
                        key={el.id}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                        onClick={() => handleSelectEleve(el)}
                      >
                        <span>
                          {el.prenom} {el.nom}
                        </span>
                        <span className="text-gray-900 text-sm">
                          {el.matricule} - {el.classe_nom || "Non assigné"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {inscriptionForm.eleveId && (
                  <p className="text-xs text-green-600 mt-1">✓ Élève sélectionné</p>
                )}
              </div>

              {/* Ligne de transport */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Ligne de transport *
                </label>
                <select
                  required
                  value={inscriptionForm.ligneId}
                  onChange={handleLigneChange}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner une ligne</option>
                  {lignes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nom} - {l.prix_abonnement.toLocaleString()} GNF/mois (
                      {l.bus_immatriculation || "Sans bus"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de mois avec boutons +/- */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Nombre de mois
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleMoisChange(-1)}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {inscriptionForm.mois}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMoisChange(1)}
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-900"></span>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Récapitulatif</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-900">Prix mensuel</p>
                    <p className="font-semibold text-gray-900">
                      {inscriptionForm.montantMensuel.toLocaleString()} GNF
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-900">Nombre de mois</p>
                    <p className="font-semibold text-gray-900">
                      {inscriptionForm.mois} mois
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-900 font-medium">Total à payer</p>
                    <p className="text-xl font-bold text-blue-600">
                      {inscriptionForm.montantTotal.toLocaleString()} GNF
                    </p>
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInscriptionForm(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
                >
                  {editingInscription ? "Modifier" : "Inscrire au transport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajout/Modification d'un bus (inchangé) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBus ? "Modifier le bus" : "Ajouter un bus"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-900 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitBus} className="space-y-4 text-black">
              {/* ... mêmes champs que précédemment ... */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Plaque d'immatriculation
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: RC-1234-A"
                  value={formData.immatriculation}
                  onChange={(e) =>
                    setFormData({ ...formData, immatriculation: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Chauffeur
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nom du chauffeur"
                    value={formData.chauffeur}
                    onChange={(e) =>
                      setFormData({ ...formData, chauffeur: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 622 00 00 00"
                    value={formData.chauffeur_tel}
                    onChange={(e) =>
                      setFormData({ ...formData, chauffeur_tel: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Capacité (places)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.capacite}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacite: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Prix abonnement (GNF)
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ex: 50000"
                    value={formData.prix_abonnement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prix_abonnement: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Nom du Trajet
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ligne Lambanyi-Dixinn"
                  value={formData.trajet}
                  onChange={(e) =>
                    setFormData({ ...formData, trajet: e.target.value })
                  }
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Départ Matin
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 07:30"
                    value={formData.horaireMatin}
                    onChange={(e) =>
                      setFormData({ ...formData, horaireMatin: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Départ Soir
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 16:30"
                    value={formData.horaireSoir}
                    onChange={(e) =>
                      setFormData({ ...formData, horaireSoir: e.target.value })
                    }
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 text-sm font-medium transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}