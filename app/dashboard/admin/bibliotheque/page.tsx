"use client";

import { useState, useEffect } from "react";
import { 
  BookOpen, BookMarked, Users, Search, Plus, Trash2, Edit, CheckCircle, Clock, AlertCircle
} from "lucide-react";

interface Livre {
  id: number;
  titre: string;
  auteur: string;
  isbn: string;
  quantite: number;
  disponible: number;
  emplacement: string;
}

interface Emprunt {
  id: number;
  livre_titre: string;
  eleve_nom: string;
  classe_nom: string;
  date_emprunt: string;
  date_retour_prevue: string;
  date_retour_reelle: string | null;
  statut: string;
}

export default function BibliothequePage() {
  const [activeTab, setActiveTab] = useState("livres");
  const [livres, setLivres] = useState<Livre[]>([]);
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [eleves, setEleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showLivreForm, setShowLivreForm] = useState(false);
  const [showEmpruntForm, setShowEmpruntForm] = useState(false);
  const [editingLivre, setEditingLivre] = useState<Livre | null>(null);

  const [livreData, setLivreData] = useState({
    titre: "", auteur: "", isbn: "", quantite: 1, emplacement: ""
  });
  const [empruntData, setEmpruntData] = useState({
    livre_id: "", eleve_id: "", date_retour_prevue: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLivres, resEmprunts, resEleves] = await Promise.all([
        fetch('/api/admin/bibliotheque/livres'),
        fetch('/api/admin/bibliotheque/emprunts'),
        fetch('/api/admin/eleves')
      ]);
      if (resLivres.ok) setLivres(await resLivres.json());
      if (resEmprunts.ok) setEmprunts(await resEmprunts.json());
      if (resEleves.ok) setEleves(await resEleves.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLivreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingLivre ? 'PUT' : 'POST';
      const body = { ...livreData, id: editingLivre?.id };
      const res = await fetch('/api/admin/bibliotheque/livres', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowLivreForm(false);
        setEditingLivre(null);
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteLivre = async (id: number) => {
    if (confirm("Supprimer ce livre de la bibliothèque ?")) {
      try {
        await fetch(`/api/admin/bibliotheque/livres?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (e) { console.error(e); }
    }
  };

  const handleEmpruntSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/bibliotheque/emprunts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(empruntData)
      });
      if (res.ok) {
        setShowEmpruntForm(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Erreur");
      }
    } catch (e) { console.error(e); }
  };

  const handleRetournerLivre = async (id: number) => {
    if (confirm("Confirmer le retour de ce livre ?")) {
      try {
        await fetch('/api/admin/bibliotheque/emprunts', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'retourner' })
        });
        fetchData();
      } catch (e) { console.error(e); }
    }
  };

  const filteredLivres = livres.filter(l => l.titre.toLowerCase().includes(searchTerm.toLowerCase()) || l.auteur.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredEmprunts = emprunts.filter(e => e.livre_titre.toLowerCase().includes(searchTerm.toLowerCase()) || e.eleve_nom.toLowerCase().includes(searchTerm.toLowerCase()));

  const stats = {
    totalLivres: livres.reduce((acc, l) => acc + l.quantite, 0),
    livresDispos: livres.reduce((acc, l) => acc + l.disponible, 0),
    empruntsActifs: emprunts.filter(e => e.statut === 'en_cours').length,
    empruntsRetard: emprunts.filter(e => e.statut === 'en_retard').length
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bibliothèque</h1>
          <p className="text-gray-500">Gestion des livres et des emprunts</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Total livres</p><p className="text-2xl font-bold">{stats.totalLivres}</p></div>
          <BookOpen className="text-blue-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Disponibles</p><p className="text-2xl font-bold text-green-600">{stats.livresDispos}</p></div>
          <CheckCircle className="text-green-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">Emprunts en cours</p><p className="text-2xl font-bold text-orange-600">{stats.empruntsActifs}</p></div>
          <BookMarked className="text-orange-200 w-10 h-10" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500 flex items-center justify-between">
          <div><p className="text-sm text-gray-500">En retard</p><p className="text-2xl font-bold text-red-600">{stats.empruntsRetard}</p></div>
          <AlertCircle className="text-red-200 w-10 h-10" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b">
          <button onClick={() => setActiveTab("livres")} className={`px-6 py-4 font-medium transition-colors ${activeTab === "livres" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-600 hover:bg-gray-50"}`}>
            Inventaire des livres
          </button>
          <button onClick={() => setActiveTab("emprunts")} className={`px-6 py-4 font-medium transition-colors ${activeTab === "emprunts" ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" : "text-gray-600 hover:bg-gray-50"}`}>
            Suivi des emprunts
          </button>
        </div>

        <div className="p-4 border-b flex justify-between bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 w-4 h-4" />
            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm" />
          </div>
          {activeTab === "livres" ? (
            <button onClick={() => { setEditingLivre(null); setLivreData({ titre: "", auteur: "", isbn: "", quantite: 1, emplacement: "" }); setShowLivreForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Ajouter un livre
            </button>
          ) : (
            <button onClick={() => setShowEmpruntForm(true)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-orange-600">
              <BookMarked className="w-4 h-4" /> Nouvel emprunt
            </button>
          )}
        </div>

        {activeTab === "livres" && (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Titre & Auteur</th>
                <th className="px-6 py-3">Emplacement</th>
                <th className="px-6 py-3 text-center">Quantité totale</th>
                <th className="px-6 py-3 text-center">Disponible</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLivres.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{l.titre}</p>
                    <p className="text-sm text-gray-500">{l.auteur} <span className="text-xs text-gray-900 ml-2">ISBN: {l.isbn || 'N/A'}</span></p>
                  </td>
                  <td className="px-6 py-4 text-sm">{l.emplacement || "-"}</td>
                  <td className="px-6 py-4 text-center font-medium">{l.quantite}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${l.disponible > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{l.disponible}</span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => { setEditingLivre(l); setLivreData(l); setShowLivreForm(true); }} className="text-blue-600 p-1"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteLivre(l.id)} className="text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredLivres.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Aucun livre trouvé</td></tr>}
            </tbody>
          </table>
        )}

        {activeTab === "emprunts" && (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3">Livre</th>
                <th className="px-6 py-3">Élève</th>
                <th className="px-6 py-3">Date Prêt</th>
                <th className="px-6 py-3">Retour Prévu</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEmprunts.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{e.livre_titre}</td>
                  <td className="px-6 py-4 text-sm">{e.eleve_nom} <br/><span className="text-xs text-gray-500">{e.classe_nom}</span></td>
                  <td className="px-6 py-4 text-sm">{new Date(e.date_emprunt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{new Date(e.date_retour_prevue).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {e.statut === 'en_cours' && <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-full">En cours</span>}
                    {e.statut === 'retourne' && <span className="bg-green-100 text-green-700 px-2 py-1 text-xs rounded-full">Retourné</span>}
                    {e.statut === 'en_retard' && <span className="bg-red-100 text-red-700 px-2 py-1 text-xs rounded-full font-bold">En retard</span>}
                  </td>
                  <td className="px-6 py-4">
                    {e.statut !== 'retourne' && (
                      <button onClick={() => handleRetournerLivre(e.id)} className="text-green-600 font-medium text-sm hover:underline">
                        Retourner
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredEmprunts.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Aucun emprunt trouvé</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulaire Livre */}
      {showLivreForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingLivre ? "Modifier le livre" : "Ajouter un livre"}</h2>
            <form onSubmit={handleLivreSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Titre</label>
                <input required type="text" value={livreData.titre} onChange={e => setLivreData({...livreData, titre: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm mb-1">Auteur</label>
                <input required type="text" value={livreData.auteur} onChange={e => setLivreData({...livreData, auteur: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">ISBN</label>
                  <input type="text" value={livreData.isbn} onChange={e => setLivreData({...livreData, isbn: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Quantité Totale</label>
                  <input required type="number" min="1" value={livreData.quantite} onChange={e => setLivreData({...livreData, quantite: parseInt(e.target.value)})} className="w-full border p-2 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Emplacement (Ex: Rayon A2)</label>
                <input type="text" value={livreData.emplacement} onChange={e => setLivreData({...livreData, emplacement: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowLivreForm(false)} className="px-4 py-2 border rounded-lg text-gray-600 ">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire Emprunt */}
      {showEmpruntForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nouvel emprunt</h2>
            <form onSubmit={handleEmpruntSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Livre</label>
                <select required value={empruntData.livre_id} onChange={e => setEmpruntData({...empruntData, livre_id: e.target.value})} className="w-full border p-2 rounded-lg">
                  <option value="">Sélectionner un livre</option>
                  {livres.filter(l => l.disponible > 0).map(l => (
                    <option key={l.id} value={l.id}>{l.titre} (Dispo: {l.disponible})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Élève</label>
                <select required value={empruntData.eleve_id} onChange={e => setEmpruntData({...empruntData, eleve_id: e.target.value})} className="w-full border p-2 rounded-lg">
                  <option value="">Sélectionner un élève</option>
                  {eleves.map(e => (
                    <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.matricule})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Date de retour prévue</label>
                <input required type="date" value={empruntData.date_retour_prevue} onChange={e => setEmpruntData({...empruntData, date_retour_prevue: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowEmpruntForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg">Enregistrer prêt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}