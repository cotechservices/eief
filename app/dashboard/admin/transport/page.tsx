// app/dashboard/admin/transport/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Bus, MapPin, Users, CreditCard, Plus, Edit, Trash2, Eye, Search, Download, AlertCircle, X } from "lucide-react";

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

export default function TransportPage() {
  const [bus, setBus] = useState<BusItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
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
    prix_abonnement: 50000
  });

  const fetchTransport = async () => {
    try {
      const response = await fetch('/api/admin/transport');
      if (response.ok) {
        const data = await response.json();
        setBus(data.bus || []);
        setStats(data.stats || {
          totalBus: 0,
          totalInscrits: 0,
          tauxRemplissage: 0,
          recettesMois: 0
        });
      }
    } catch (error) {
      console.error("Erreur chargement transport:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, []);

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
      prix_abonnement: 50000
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
      prix_abonnement: item.prix_abonnement || 50000
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBus ? "PUT" : "POST";
      const body = editingBus ? { ...formData, id: editingBus.id } : formData;

      const response = await fetch('/api/admin/transport', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowForm(false);
        fetchTransport();
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de l'enregistrement du bus");
      }
    } catch (error) {
      console.error("Erreur soumission transport:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce bus et sa ligne ?")) {
      try {
        const response = await fetch(`/api/admin/transport?id=${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchTransport();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur suppression transport:", error);
      }
    }
  };

  if (loading || !stats) {
    return <div className="flex justify-center items-center h-64">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">Gestion du transport</h1>
          <p className="text-gray-900">Bus, trajets, inscriptions</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />Ajouter un bus
        </button>
      </div>

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
            <p className="text-gray-900 text-sm">Recettes (mois)</p>
            <p className="text-2xl font-bold text-purple-600">{stats.recettesMois.toLocaleString()} GNF</p>
          </div>
          <CreditCard className="w-8 h-8 text-purple-200" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Liste des bus et trajets</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-1.5 border rounded-lg text-sm bg-gray-50/50" />
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
                const filledRatio = b.capacite > 0 ? Math.round((b.inscrits / b.capacite) * 100) : 0;
                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{b.immatriculation}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{b.chauffeur}</div>
                      {b.chauffeur_tel && <div className="text-gray-900 text-xs">{b.chauffeur_tel}</div>}
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
                      <span className="font-semibold">{b.inscrits}</span> / {b.capacite} places
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {(b.prix_abonnement || 0).toLocaleString()} GNF
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${filledRatio > 90 ? 'bg-red-500' : filledRatio > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, filledRatio)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-900">{filledRatio}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(b)} className="text-blue-600 hover:text-blue-800 p-1">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-800 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bus.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-900">Aucun bus disponible.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBus ? "Modifier le bus" : "Ajouter un bus"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-900 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-black">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Plaque d'immatriculation</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: RC-1234-A"
                  value={formData.immatriculation}
                  onChange={e => setFormData({ ...formData, immatriculation: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Chauffeur</label>
                  <input
                    required
                    type="text"
                    placeholder="Nom du chauffeur"
                    value={formData.chauffeur}
                    onChange={e => setFormData({ ...formData, chauffeur: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Téléphone</label>
                  <input
                    type="text"
                    placeholder="Ex: 622 00 00 00"
                    value={formData.chauffeur_tel}
                    onChange={e => setFormData({ ...formData, chauffeur_tel: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Capacité (places)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.capacite}
                    onChange={e => setFormData({ ...formData, capacite: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Prix abonnement (GNF)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Ex: 50000"
                    value={formData.prix_abonnement}
                    onChange={e => setFormData({ ...formData, prix_abonnement: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Nom du Trajet</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Ligne Lambanyi-Dixinn"
                  value={formData.trajet}
                  onChange={e => setFormData({ ...formData, trajet: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Départ Matin</label>
                  <input
                    type="text"
                    placeholder="Ex: 07:30"
                    value={formData.horaireMatin}
                    onChange={e => setFormData({ ...formData, horaireMatin: e.target.value })}
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Départ Soir</label>
                  <input
                    type="text"
                    placeholder="Ex: 16:30"
                    value={formData.horaireSoir}
                    onChange={e => setFormData({ ...formData, horaireSoir: e.target.value })}
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