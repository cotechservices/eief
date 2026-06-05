// app/dashboard/parent/enfants/[id]/page.tsx
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
  XCircle
} from "lucide-react";

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
}

interface Stats {
  notes: Array<{ matiere: string; moyenne: number; coefficient: number }>;
  presences: { total: number; presents: number; absents: number; retards: number };
  paiements: { total_paye: number; nombre_paiements: number };
}

export default function EnfantDetailPage() {
  const params = useParams();
  const enfantId = params.id as string;

  const [enfant, setEnfant] = useState<EleveDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnfantDetail();
  }, [enfantId]);

  const fetchEnfantDetail = async () => {
    try {
      const [enfantRes, statsRes] = await Promise.all([
        fetch(`/api/parent/enfants/${enfantId}`),
        fetch(`/api/parent/enfants/${enfantId}/stats`)
      ]);

      const enfantData = await enfantRes.json();
      const statsData = await statsRes.json();

      setEnfant(enfantData);
      setStats(statsData);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMoyenneGenerale = () => {
    if (!stats?.notes || stats.notes.length === 0) return 0;
    const total = stats.notes.reduce((acc, n) => acc + (n.moyenne * n.coefficient), 0);
    const coeffTotal = stats.notes.reduce((acc, n) => acc + n.coefficient, 0);
    return coeffTotal > 0 ? (total / coeffTotal).toFixed(1) : "0";
  };

  const getAppreciation = (moyenne: number) => {
    if (moyenne >= 14) return { text: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (moyenne >= 12) return { text: "Très bien", color: "text-blue-600", bg: "bg-blue-100" };
    if (moyenne >= 10) return { text: "Bien", color: "text-cyan-600", bg: "bg-cyan-100" };
    if (moyenne >= 8) return { text: "Passable", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { text: "À améliorer", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!enfant) {
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

  const moyenne = parseFloat(getMoyenneGenerale());
  const appreciation = getAppreciation(moyenne);
  const tauxPresence = stats?.presences?.total > 0 ?
    ((stats.presences.presents / stats.presences.total) * 100).toFixed(1) : "0";

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{enfant.prenom} {enfant.nom}</h1>
          <p className="text-gray-900">{enfant.classe_nom} - Matricule: {enfant.matricule}</p>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <GraduationCap className="w-5 h-5" />
            <p className="text-sm">Moyenne générale</p>
          </div>
          <p className={`text-3xl font-bold ${appreciation.color}`}>{getMoyenneGenerale()}/20</p>
          <p className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${appreciation.bg} ${appreciation.color}`}>
            {appreciation.text}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <Calendar className="w-5 h-5" />
            <p className="text-sm">Assiduité</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">{tauxPresence}%</p>
          <p className="text-xs text-gray-900 mt-1">
            Présents: {stats?.presences?.presents || 0} |
            Absents: {stats?.presences?.absents || 0} |
            Retards: {stats?.presences?.retards || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <CreditCard className="w-5 h-5" />
            <p className="text-sm">Frais de scolarité</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats?.paiements?.total_paye?.toLocaleString() || 0} GNF
          </p>
          <p className="text-xs text-gray-900 mt-1">
            {stats?.paiements?.nombre_paiements || 0} paiement(s)
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-900 mb-1">
            <BookOpen className="w-5 h-5" />
            <p className="text-sm">Matières</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{stats?.notes?.length || 0}</p>
          <p className="text-xs text-gray-900 mt-1">Matières enseignées</p>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Informations personnelles
          </h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-900">Date de naissance</p>
              <p className="font-medium">{enfant.date_naissance ? new Date(enfant.date_naissance).toLocaleDateString() : "Non renseignée"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-900">Lieu de naissance</p>
              <p className="font-medium">{enfant.lieu_naissance || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-900">Sexe</p>
              <p className="font-medium">{enfant.sexe === "M" ? "Masculin" : "Féminin"}</p>
            </div>
          </div>
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
          {stats?.notes && stats.notes.length > 0 ? (
            <div className="space-y-4">
              {stats.notes.map((note, idx) => {
                const noteCouleur = note.moyenne >= 14 ? "text-green-600" : note.moyenne >= 10 ? "text-blue-600" : "text-orange-600";
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="font-medium">{note.matiere}</span>
                        <span className="text-xs text-gray-900 ml-2">Coeff. {note.coefficient}</span>
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
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-900">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-900" />
              <p>Aucune note disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Historique des paiements
          </h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-900">Total payé</p>
              <p className="text-2xl font-bold text-green-600">{stats?.paiements?.total_paye?.toLocaleString() || 0} GNF</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-900">Nombre de paiements</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.paiements?.nombre_paiements || 0}</p>
            </div>
          </div>
          {(!stats?.paiements || stats.paiements.nombre_paiements === 0) && (
            <p className="text-center text-gray-900 mt-4">Aucun paiement enregistré</p>
          )}
        </div>
      </div>
    </div>
  );
}