"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  CreditCard,
  AlertCircle,
  BookOpen,
  TrendingUp,
  Loader2,
  User,
  FileText,
  XCircle,
  Bus,
  Utensils,
  ShoppingCart,
  Wallet,
  CheckCircle,
  Download,
  Eye,
  Clock,
  File,
  Image,
  ExternalLink,
  Camera
} from "lucide-react";

// Types
interface EleveDetail {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  classe_nom: string;
  niveau: string;
  photo_url: string | null;
  acte_naissance_url?: string | null;
  bulletin_url?: string | null;
  moyenne_generale: number;
  appreciation: { text: string; color: string; bg: string };
  taux_presence: string;
  inscription_statut: string;
}

interface Note {
  matiere: string;
  moyenne: number;
  coefficient: number;
  nombre_notes: number;
  details_notes: Array<{ valeur: number; type_note: string; date_saisie: string; commentaire: string }>;
}

interface Presences {
  total: number;
  presents: number;
  absents: number;
  retards: number;
  justifies: number;
}

interface Frais {
  inscription: number;
  transport: number;
  transport_details: any;
  cantine: number;
  cantine_details: any;
  fournitures: number;
  fournitures_details: Array<{ nom: string; quantite: number; prix_unitaire: number; total: number }>;
  scolarite: number;
  total_a_payer: number;
  total_paye: number;
  solde_restant: number;
  paiements: Array<{ montant: number; type_frais: string; mode_paiement: string; date_paiement: string; reference_transaction: string }>;
}

interface Bulletin {
  fichier_url: string;
  titre: string;
  date_publication: string;
  periodicite?: string;
  trimestre?: string;
}

interface Stats {
  nombre_notes: number;
  taux_presence: number;
  nombre_paiements: number;
}

interface FullData {
  eleve: EleveDetail | null;
  notes: Note[];
  presences: Presences;
  frais: Frais;
  bulletins: Bulletin[];
  statistiques: Stats;
}

// Composant principal
export default function EnfantDetailPage() {
  const params = useParams();
  const enfantId = params.id as string;

  const [data, setData] = useState<FullData>({
    eleve: null,
    notes: [],
    presences: { total: 0, presents: 0, absents: 0, retards: 0, justifies: 0 },
    frais: {
      inscription: 0,
      transport: 0,
      transport_details: null,
      cantine: 0,
      cantine_details: null,
      fournitures: 0,
      fournitures_details: [],
      scolarite: 0,
      total_a_payer: 0,
      total_paye: 0,
      solde_restant: 0,
      paiements: []
    },
    bulletins: [],
    statistiques: { nombre_notes: 0, taux_presence: 0, nombre_paiements: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnfantDetail();
  }, [enfantId]);

  const fetchEnfantDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/parent/enfants/${enfantId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log("📊 Données reçues:", result);
      setData(result);
    } catch (error) {
      console.error("Erreur:", error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-gray-900 mt-2">{error}</p>
        <button
          onClick={fetchEnfantDetail}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
        <Link href="/dashboard/parent/enfants" className="mt-4 ml-4 inline-block text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  if (!data.eleve) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Enfant non trouvé</h2>
        <Link href="/dashboard/parent/enfants" className="mt-4 inline-block text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const { eleve, notes, presences, frais, bulletins, statistiques } = data;

  return (
    <div className="space-y-6">
      {/* En-tête avec retour */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/parent/enfants"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-4 flex-1">
          {eleve.photo_url ? (
            <img 
              src={eleve.photo_url} 
              alt="photo" 
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{eleve.prenom} {eleve.nom}</h1>
            <p className="text-gray-900">{eleve.classe_nom} - Matricule: {eleve.matricule}</p>
            <p className="text-sm text-gray-500">
              {eleve.sexe === "M" ? "Garçon" : "Fille"} - 
              {eleve.date_naissance ? new Date(eleve.date_naissance).toLocaleDateString() : "Date non renseignée"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${eleve.appreciation.bg} ${eleve.appreciation.color}`}>
              {eleve.appreciation.text}
            </span>
          </div>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            <p className="text-sm">Moyenne générale</p>
          </div>
          <p className={`text-2xl font-bold ${eleve.appreciation.color}`}>
            {eleve.moyenne_generale.toFixed(1)}/20
          </p>
          <p className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${eleve.appreciation.bg} ${eleve.appreciation.color}`}>
            {eleve.appreciation.text}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <Calendar className="w-5 h-5 text-blue-500" />
            <p className="text-sm">Assiduité</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{eleve.taux_presence}%</p>
          <p className="text-xs text-gray-900 mt-1">
            Présents: {presences.presents} | Absents: {presences.absents} | Retards: {presences.retards}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <Wallet className="w-5 h-5 text-green-500" />
            <p className="text-sm">Total payé</p>
          </div>
          <p className="text-xl font-bold text-green-600">{frais.total_paye.toLocaleString()} GNF</p>
          <p className="text-xs text-gray-900 mt-1">{statistiques.nombre_paiements} paiement(s)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <CreditCard className="w-5 h-5 text-red-500" />
            <p className="text-sm">Solde restant</p>
          </div>
          <p className={`text-xl font-bold ${frais.solde_restant > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {frais.solde_restant.toLocaleString()} GNF
          </p>
          {frais.solde_restant === 0 && (
            <span className="text-xs text-green-600">✅ Tout est payé</span>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <p className="text-sm">Matières</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{statistiques.nombre_notes}</p>
          <p className="text-xs text-gray-900 mt-1">Matières suivies</p>
        </div>
      </div>

      {/* ⭐ SECTION DOCUMENTS - AJOUTÉE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Documents joints
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Acte de naissance */}
            <div className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-2">
                <File className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Acte de naissance</span>
              </div>
              {eleve.acte_naissance_url ? (
                <a 
                  href={eleve.acte_naissance_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  Voir le document <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-gray-500 text-sm">Non téléchargé</p>
              )}
            </div>

            {/* Photo d'identité */}
            <div className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-2">
                <Image className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Photo d'identité</span>
              </div>
              {eleve.photo_url ? (
                <a 
                  href={eleve.photo_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  Voir la photo <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-gray-500 text-sm">Non téléchargée</p>
              )}
            </div>

            {/* Bulletin scolaire */}
            <div className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-900">Bulletin scolaire</span>
              </div>
              {eleve.bulletin_url ? (
                <a 
                  href={eleve.bulletin_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 text-sm hover:underline flex items-center gap-1"
                >
                  Voir le bulletin <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <p className="text-gray-500 text-sm">Non téléchargé</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION DÉTAIL DES PAIEMENTS */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Détail des paiements
          </h2>
        </div>
        <div className="p-6">
          {frais ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600">Inscription</p>
                  <p className="font-bold text-blue-600">{frais.inscription.toLocaleString()} GNF</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                  <p className="text-xs text-gray-600">Cantine</p>
                  <p className="font-bold text-pink-600">{frais.cantine.toLocaleString()} GNF</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600">Transport</p>
                  <p className="font-bold text-green-600">{frais.transport.toLocaleString()} GNF</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600">Frais de fourniture</p>
                  <p className="font-bold text-purple-600">{frais.fournitures.toLocaleString()} GNF</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="text-xs text-gray-600">Scolarité</p>
                  <p className="font-bold text-orange-600">{frais.scolarite.toLocaleString()} GNF</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                  <p className="text-xs text-gray-600 font-semibold">Total à payer</p>
                  <p className="font-bold text-gray-800 text-lg">{frais.total_a_payer.toLocaleString()} GNF</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Déjà payé</p>
                  <p className="font-bold text-green-600">{frais.total_paye.toLocaleString()} GNF</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Reste à payer</p>
                  <p className={`font-bold ${frais.solde_restant > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {frais.solde_restant.toLocaleString()} GNF
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Statut</p>
                  {frais.solde_restant === 0 ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Tout payé
                    </span>
                  ) : frais.total_paye > 0 ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Partiel
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Non payé
                    </span>
                  )}
                </div>
              </div>

              {frais.total_a_payer > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progression des paiements</span>
                    <span>{Math.round((frais.total_paye / frais.total_a_payer) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (frais.total_paye / frais.total_a_payer) * 100)}%` }} 
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>Chargement des informations de frais...</p>
            </div>
          )}
        </div>
      </div>
      

      {/* Notes par matière */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Notes par matière
          </h2>
        </div>
        <div className="p-6">
          {notes && notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((note, idx) => {
                const noteCouleur = note.moyenne >= 14 ? "text-green-600" : note.moyenne >= 10 ? "text-blue-600" : "text-orange-600";
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-medium">{note.matiere}</span>
                        <span className="text-xs text-gray-500 ml-2">Coeff. {note.coefficient}</span>
                        <span className="text-xs text-gray-400 ml-2">({note.nombre_notes} notes)</span>
                      </div>
                      <span className={`font-bold ${noteCouleur}`}>{note.moyenne.toFixed(1)}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(note.moyenne / 20) * 100}%`,
                          backgroundColor: note.moyenne >= 14 ? "#22c55e" : note.moyenne >= 10 ? "#3b82f6" : "#f97316"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune note disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulletins */}
      {bulletins && bulletins.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Bulletins scolaires
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bulletins.map((bulletin, idx) => (
                <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{bulletin.titre || "Bulletin"}</h4>
                      {bulletin.trimestre && (
                        <p className="text-xs text-gray-500">Trimestre {bulletin.trimestre}</p>
                      )}
                      {bulletin.periodicite && (
                        <p className="text-xs text-gray-500">{bulletin.periodicite}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {bulletin.date_publication ? new Date(bulletin.date_publication).toLocaleDateString() : "Date inconnue"}
                      </p>
                    </div>
                    {bulletin.fichier_url && (
                      <a
                        href={bulletin.fichier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                      >
                        <Download className="w-5 h-5 text-blue-600" />
                      </a>
                    )}
                  </div>
                  {!bulletin.fichier_url && (
                    <p className="text-xs text-gray-400 mt-2">Aucun fichier disponible</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/dashboard/parent/transport?enfantId=${eleve.id}`} className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-600 transition">
            <Bus className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Transport</p>
        </Link>
        <Link href={`/dashboard/parent/cantine?enfantId=${eleve.id}`} className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-pink-600 transition">
            <Utensils className="w-6 h-6 text-pink-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Cantine</p>
        </Link>
        <Link href={`/dashboard/parent/librairie?enfantId=${eleve.id}`} className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-600 transition">
            <ShoppingCart className="w-6 h-6 text-purple-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Librairie</p>
        </Link>
        <Link href={`/dashboard/parent/finances?enfantId=${eleve.id}`} className="bg-white rounded-xl shadow-sm p-4 text-center hover:shadow-md transition group">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition">
            <Wallet className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <p className="text-sm font-medium">Finances</p>
        </Link>
      </div>
    </div>
  );
}