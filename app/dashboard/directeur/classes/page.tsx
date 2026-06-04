// app/dashboard/admin/classes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  School,
  Calendar
} from "lucide-react";

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  salle: string;
  capacite: number;
  effectif: number;
  titulaire: string;
  anneeScolaire: string;
  statut: "active" | "inactive";
  horaires: string;
}

interface Matiere {
  id: number;
  nom: string;
  enseignant: string;
  heuresSemaine: number;
}

export default function GestionClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("all");
  const [selectedStatut, setSelectedStatut] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showMatiereForm, setShowMatiereForm] = useState(false);
  const [editingClasse, setEditingClasse] = useState<Classe | null>(null);
  const [selectedClasse, setSelectedClasse] = useState<Classe | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClasseMatieres, setSelectedClasseMatieres] = useState<Matiere[]>([]);

  const itemsPerPage = 10;

  // Données simulées
  useEffect(() => {
    setTimeout(() => {
      const mockClasses: Classe[] = [
        { id: 1, nom: "6ème A", niveau: "6ème", salle: "Salle 101", capacite: 30, effectif: 28, titulaire: "M. Camara", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 2, nom: "6ème B", niveau: "6ème", salle: "Salle 102", capacite: 30, effectif: 25, titulaire: "Mme Diallo", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 3, nom: "5ème A", niveau: "5ème", salle: "Salle 103", capacite: 30, effectif: 30, titulaire: "M. Konaté", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 4, nom: "5ème B", niveau: "5ème", salle: "Salle 104", capacite: 30, effectif: 27, titulaire: "Mme Barry", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 5, nom: "4ème A", niveau: "4ème", salle: "Salle 105", capacite: 30, effectif: 22, titulaire: "M. Souaré", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 6, nom: "3ème A", niveau: "3ème", salle: "Salle 106", capacite: 25, effectif: 20, titulaire: "Mme Touré", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 7, nom: "2nd A", niveau: "2nde", salle: "Salle 107", capacite: 25, effectif: 18, titulaire: "M. Keita", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 8, nom: "1ère A", niveau: "1ère", salle: "Salle 108", capacite: 25, effectif: 15, titulaire: "Mme Sylla", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
        { id: 9, nom: "Terminale A", niveau: "Terminale", salle: "Salle 109", capacite: 25, effectif: 22, titulaire: "M. Camara", anneeScolaire: "2025-2026", statut: "active", horaires: "08:00 - 15:00" },
      ];

      const mockMatieres: Matiere[] = [
        { id: 1, nom: "Mathématiques", enseignant: "M. Camara", heuresSemaine: 6 },
        { id: 2, nom: "Français", enseignant: "Mme Diallo", heuresSemaine: 5 },
        { id: 3, nom: "Anglais", enseignant: "M. Smith", heuresSemaine: 4 },
        { id: 4, nom: "Histoire-Géo", enseignant: "M. Konaté", heuresSemaine: 3 },
        { id: 5, nom: "Sciences", enseignant: "Mme Barry", heuresSemaine: 4 },
        { id: 6, nom: "Physique-Chimie", enseignant: "M. Souaré", heuresSemaine: 4 },
        { id: 7, nom: "Philosophie", enseignant: "Mme Touré", heuresSemaine: 2 },
        { id: 8, nom: "Sport", enseignant: "M. Keita", heuresSemaine: 2 },
      ];

      setClasses(mockClasses);
      setMatieres(mockMatieres);
      setLoading(false);
    }, 1000);
  }, []);

  // Niveaux uniques pour le filtre
  const niveaux = ["all", ...new Set(classes.map(c => c.niveau))];

  // Filtrage des classes
  const filteredClasses = classes.filter(classe => {
    const matchesSearch = 
      classe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classe.titulaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classe.salle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiveau = selectedNiveau === "all" || classe.niveau === selectedNiveau;
    const matchesStatut = selectedStatut === "all" || classe.statut === selectedStatut;
    return matchesSearch && matchesNiveau && matchesStatut;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatutBadge = (statut: string) => {
    if (statut === "active") {
      return <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
    }
    return <span className="text-red-600 text-sm flex items-center gap-1"><XCircle className="w-3 h-3" /> Inactive</span>;
  };

  const getTauxRemplissage = (effectif: number, capacite: number) => {
    const taux = (effectif / capacite) * 100;
    if (taux >= 90) return { color: "bg-red-500", text: "Saturée" };
    if (taux >= 70) return { color: "bg-yellow-500", text: "Élevé" };
    return { color: "bg-green-500", text: "Normal" };
  };

  const handleDelete = (id: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette classe ?")) {
      setClasses(classes.filter(c => c.id !== id));
    }
  };

  const handleViewMatieres = (classe: Classe) => {
    setSelectedClasse(classe);
    setSelectedClasseMatieres(matieres);
    setShowDetailModal(true);
  };

  const taux = (effectif: number, capacite: number) => getTauxRemplissage(effectif, capacite);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des classes</h1>
          <p className="text-gray-500">Gérez toutes les classes de l'école</p>
        </div>
        <button 
          onClick={() => { setEditingClasse(null); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle classe
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total classes</p>
              <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
            </div>
            <School className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total élèves</p>
              <p className="text-2xl font-bold text-green-600">{classes.reduce((acc, c) => acc + c.effectif, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Capacité totale</p>
              <p className="text-2xl font-bold text-orange-600">{classes.reduce((acc, c) => acc + c.capacite, 0)}</p>
            </div>
            <GraduationCap className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Taux remplissage</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round((classes.reduce((acc, c) => acc + c.effectif, 0) / classes.reduce((acc, c) => acc + c.capacite, 0)) * 100)}%
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                placeholder="Rechercher une classe, salle ou titulaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedNiveau}
            onChange={(e) => setSelectedNiveau(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les niveaux</option>
            {niveaux.filter(n => n !== "all").map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <select
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Tableau des classes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titulaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effectif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClasses.map((classe) => {
                const tauxRemplissage = taux(classe.effectif, classe.capacite);
                return (
                  <tr key={classe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-800">{classe.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{classe.niveau}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-900" />
                        <span>{classe.salle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-900" />
                        <span>{classe.titulaire}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{classe.effectif}/{classe.capacite}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${tauxRemplissage.color} h-2 rounded-full`}
                            style={{ width: `${(classe.effectif / classe.capacite) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{Math.round((classe.effectif / classe.capacite) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatutBadge(classe.statut)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewMatieres(classe)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Voir matières"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setEditingClasse(classe); setShowForm(true); }}
                          className="text-green-600 hover:text-green-700"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(classe.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredClasses.length)} sur {filteredClasses.length} classes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Matières de la classe */}
      {showDetailModal && selectedClasse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Matières - {selectedClasse.nom}</h2>
                  <p className="text-gray-500 text-sm">Titulaire: {selectedClasse.titulaire}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-900 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Liste des matières</h3>
                <button 
                  onClick={() => setShowMatiereForm(true)}
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Ajouter une matière
                </button>
              </div>
              <div className="space-y-3">
                {selectedClasseMatieres.map((matiere) => (
                  <div key={matiere.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{matiere.nom}</p>
                      <p className="text-sm text-gray-500">Enseignant: {matiere.enseignant}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{matiere.heuresSemaine}h/semaine</span>
                      <button className="text-blue-600"><Edit className="w-4 h-4" /></button>
                      <button className="text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulaire (Ajout/Modification) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingClasse ? "Modifier la classe" : "Ajouter une nouvelle classe"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-900 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom de la classe *</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: 6ème A" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Niveau *</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>6ème</option><option>5ème</option><option>4ème</option><option>3ème</option>
                    <option>2nde</option><option>1ère</option><option>Terminale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Salle *</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Salle 101" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacité max *</label>
                  <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Titulaire *</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="Nom du professeur" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Année scolaire</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>2025-2026</option><option>2024-2025</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Horaires</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="08:00 - 15:00" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingClasse ? "Mettre à jour" : "Créer la classe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout matière */}
      {showMatiereForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Ajouter une matière</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Matière *</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  {matieres.map(m => <option key={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Enseignant</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>M. Camara</option><option>Mme Diallo</option><option>M. Konaté</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Heures/semaine</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="4" />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowMatiereForm(false)} className="px-4 py-2 border rounded-lg">Annuler</button>
              <button onClick={() => setShowMatiereForm(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}