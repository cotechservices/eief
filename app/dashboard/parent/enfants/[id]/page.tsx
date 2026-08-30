"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, FileText, Award, ClipboardList, GraduationCap,
  Loader2, CheckCircle, Clock, AlertTriangle, Download, ExternalLink,
  User, Calendar, TrendingUp, Star, ChevronDown, ChevronUp, BookMarked,
  PlayCircle, AlertCircle, BarChart2, Eye, CreditCard, Wallet,
  Bus, Utensils, ShoppingCart, XCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Profil {
  prenom: string; nom: string; classe_nom: string; classe_niveau: string;
  annee_scolaire: string; matricule: string; photo_url?: string;
}
interface Devoir {
  id: number; titre: string; description: string; fichier_url?: string;
  date_limite: string; date_publication: string; enseignant: string;
  statut: "soumis" | "en_retard" | "a_rendre"; joursRestants: number;
  soumission_id?: number; note_soumission?: number; commentaire_soumission?: string;
}
interface NoteMatiere {
  matiere: string; coefficient: number; enseignant: string;
  notes: Array<{ valeur: number; coefficient: number; type_note: string; date_saisie: string; commentaire?: string }>;
  moyenne: number;
}
interface LigneBulletin {
  matiere: string; coefficient: number; enseignant: string;
  moyenne: number; appreciation: string; nbNotes: number;
}
interface Examen {
  id: number; titre: string; matiere: string; enseignant: string;
  date_debut?: string; nb_questions: number; total_points: number;
  deja_passe: boolean; fichier_url?: string;
}
interface CoursMatiere {
  matiere: string; enseignant: string;
  lecons: Array<{ id: number; titre: string; description?: string; fichier_url?: string; video_url?: string; date_publication: string }>;
}
interface DetailsFrais {
  inscription: number; cantine: number; transport: number; librairie: number;
  scolarite: number; total: number; paye: number; reste: number;
}
interface EnfantDetails {
  id: number; nom: string; prenom: string; classe_nom: string; niveau: string;
  matricule: string; photo_url?: string; details_frais: DetailsFrais;
  frais_montant: number; frais_paye: number; frais_reste: number;
}

type Tab = "apercu" | "devoirs" | "notes" | "examens" | "cours" | "bulletin" | "finances";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MentionBadge = ({ moy }: { moy: number }) => {
  const cfg =
    moy >= 16 ? { label: "Très Bien", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" } :
      moy >= 14 ? { label: "Bien", cls: "bg-blue-100 text-blue-700 border-blue-200" } :
        moy >= 12 ? { label: "Assez Bien", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" } :
          moy >= 10 ? { label: "Passable", cls: "bg-yellow-100 text-yellow-700 border-yellow-200" } :
            { label: "Insuffisant", cls: "bg-red-100 text-red-700 border-red-200" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
};

const StatutDevoir = ({ statut, jours }: { statut: string; jours: number }) => {
  if (statut === "soumis") return <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"><CheckCircle className="w-3 h-3" /> Rendu</span>;
  if (statut === "en_retard") return <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium"><AlertTriangle className="w-3 h-3" /> En retard</span>;
  if (jours <= 1) return <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium"><Clock className="w-3 h-3" /> Urgent</span>;
  return <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"><Clock className="w-3 h-3" /> À rendre ({jours}j)</span>;
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ParentEnfantDashboard() {
  const { id } = useParams<{ id: string }>();

  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  const [profil, setProfil] = useState<Profil | null>(null);
  const [enfantDetails, setEnfantDetails] = useState<EnfantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [devoirs, setDevoirs] = useState<Devoir[]>([]);
  const [matieres, setMatieres] = useState<NoteMatiere[]>([]);
  const [moyenneGenerale, setMoyenneGenerale] = useState(0);
  const [examens, setExamens] = useState<Examen[]>([]);
  const [cours, setCours] = useState<CoursMatiere[]>([]);
  const [bulletin, setBulletin] = useState<{ lignes: LigneBulletin[]; moyenneGenerale: number; mentionGenerale: string } | null>(null);
  const [loadingTab, setLoadingTab] = useState<Tab | null>(null);
  const [expandedMatiere, setExpandedMatiere] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Charger profil + devoirs + notes en parallèle
        const [profilRes, devoirsRes, notesRes, enfantsRes] = await Promise.all([
          fetch(`/api/parent/enfants/${id}/profil`),
          fetch(`/api/parent/enfants/${id}/devoirs`),
          fetch(`/api/parent/enfants/${id}/notes`),
          fetch("/api/parent/enfants"),
        ]);

        if (!profilRes.ok) { setError("Accès refusé ou enfant introuvable"); return; }

        const profilData = await profilRes.json();
        setProfil(profilData.profil);

        if (devoirsRes.ok) { const d = await devoirsRes.json(); setDevoirs(d.devoirs || []); }
        if (notesRes.ok) { const n = await notesRes.json(); setMatieres(n.matieres || []); setMoyenneGenerale(n.moyenneGenerale || 0); }
        if (enfantsRes.ok) {
          const enfants = await enfantsRes.json();
          const enfant = enfants.find((e: any) => String(e.eleve_id) === String(id) || String(e.id) === String(id));
          if (enfant) setEnfantDetails(enfant);
        }
      } catch (e) {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id]);

  const loadTab = useCallback(async (tab: Tab) => {
    setActiveTab(tab);
    if (["apercu", "devoirs", "notes", "finances"].includes(tab)) return;

    setLoadingTab(tab);
    try {
      if (tab === "examens" && examens.length === 0) {
        const res = await fetch(`/api/parent/enfants/${id}/examens`);
        if (res.ok) { const d = await res.json(); setExamens(d.examens || []); }
      }
      if (tab === "cours" && cours.length === 0) {
        const res = await fetch(`/api/parent/enfants/${id}/cours`);
        if (res.ok) { const d = await res.json(); setCours(d.parMatiere || []); }
      }
      if (tab === "bulletin" && !bulletin) {
        const res = await fetch(`/api/parent/enfants/${id}/bulletin`);
        if (res.ok) { const d = await res.json(); setBulletin(d); }
      }
    } finally {
      setLoadingTab(null);
    }
  }, [id, examens.length, cours.length, bulletin]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto mt-20 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Accès refusé</h2>
      <p className="text-gray-900 mb-6">{error}</p>
      <Link href="/dashboard/parent/enfants" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium">
        <ArrowLeft className="w-4 h-4" /> Retour à mes enfants
      </Link>
    </div>
  );

  const devoirsUrgents = devoirs.filter(d => d.statut !== "soumis");
  const devoirsRendus = devoirs.filter(d => d.statut === "soumis");

  const TABS: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "apercu", label: "Aperçu", icon: BarChart2 },
    { id: "devoirs", label: "Devoirs", icon: ClipboardList, badge: devoirsUrgents.length },
    { id: "notes", label: "Notes", icon: Award },
    { id: "examens", label: "Évaluations", icon: FileText },
    { id: "cours", label: "Cours", icon: BookOpen },
    { id: "bulletin", label: "Bulletin", icon: GraduationCap },
    { id: "finances", label: "Finances", icon: CreditCard },
  ];

  const frais = enfantDetails?.details_frais;
  const pctPaye = frais && frais.total > 0 ? Math.round((frais.paye / frais.total) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-900">
        <Link href="/dashboard/parent/enfants" className="hover:text-blue-600 transition flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Mes Enfants
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-semibold">{profil?.prenom} {profil?.nom}</span>
      </div>

      {/* Header enfant */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur overflow-hidden flex items-center justify-center shrink-0 border-2 border-white/30">
            {profil?.photo_url ? (
              <img src={profil.photo_url} alt={profil.prenom} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-white/80" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{profil?.prenom} {profil?.nom}</h1>
            <p className="text-white/80 mt-1">{profil?.classe_nom} · {profil?.classe_niveau}</p>
            <p className="text-white/60 text-sm mt-1">Matricule : {profil?.matricule}</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-3xl font-extrabold">{moyenneGenerale > 0 ? moyenneGenerale : "—"}</div>
            <div className="text-white/70 text-sm">Moyenne générale</div>
            {moyenneGenerale > 0 && <div className="mt-1"><MentionBadge moy={moyenneGenerale} /></div>}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-5">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{devoirs.length}</div>
            <div className="text-white/70 text-xs mt-0.5">Devoirs</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-300">{devoirsUrgents.length}</div>
            <div className="text-white/70 text-xs mt-0.5">À rendre</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold">{matieres.length}</div>
            <div className="text-white/70 text-xs mt-0.5">Matières</div>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-300">{pctPaye}%</div>
            <div className="text-white/70 text-xs mt-0.5">Payé</div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b bg-gray-50 px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => loadTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-white rounded-t-lg"
                    : "border-transparent text-gray-900 hover:text-gray-700"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {loadingTab === activeTab ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* ═══ APERÇU ═══ */}
              {activeTab === "apercu" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-orange-500" /> Devoirs à rendre
                      {devoirsUrgents.length > 0 && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{devoirsUrgents.length}</span>}
                    </h3>
                    {devoirsUrgents.length === 0 ? (
                      <div className="text-center py-6 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                        <p className="text-green-700 font-medium">Tous les devoirs sont rendus !</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {devoirsUrgents.slice(0, 3).map(d => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{d.titre}</p>
                              <p className="text-xs text-gray-900 mt-0.5">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(d.date_limite).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                {" · "}{d.enseignant}
                              </p>
                            </div>
                            <StatutDevoir statut={d.statut} jours={d.joursRestants} />
                          </div>
                        ))}
                        {devoirsUrgents.length > 3 && (
                          <button onClick={() => loadTab("devoirs")} className="text-sm text-blue-600 hover:underline">
                            Voir {devoirsUrgents.length - 3} autres devoirs →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" /> Notes par matière
                    </h3>
                    {matieres.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-gray-900 text-sm">Aucune note disponible pour le moment</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matieres.map(m => (
                          <div key={m.matiere} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{m.matiere}</p>
                                <p className="text-xs text-gray-900 mt-0.5">{m.enseignant}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-lg font-extrabold ${m.moyenne >= 10 ? "text-green-600" : "text-red-600"}`}>{m.moyenne.toFixed(2)}</span>
                                <p className="text-xs text-gray-900">/20</p>
                              </div>
                            </div>
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${m.moyenne >= 14 ? "bg-green-500" : m.moyenne >= 10 ? "bg-blue-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min((m.moyenne / 20) * 100, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ DEVOIRS ═══ */}
              {activeTab === "devoirs" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">{devoirs.length} devoir{devoirs.length > 1 ? "s" : ""}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">{devoirsUrgents.length} à faire</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{devoirsRendus.length} rendus</span>
                    </div>
                  </div>
                  {devoirs.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium">Aucun devoir assigné</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {devoirs.map(d => (
                        <div key={d.id} className={`p-4 rounded-xl border ${d.statut === "soumis" ? "bg-green-50 border-green-100" : d.statut === "en_retard" ? "bg-red-50 border-red-100" : "bg-white border-gray-100"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-800">{d.titre}</p>
                                <StatutDevoir statut={d.statut} jours={d.joursRestants} />
                                {d.note_soumission !== null && d.note_soumission !== undefined && (
                                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Note : {d.note_soumission}/20</span>
                                )}
                              </div>
                              {d.description && <p className="text-sm text-gray-900 mt-1 line-clamp-2">{d.description}</p>}
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-900">
                                <span><Calendar className="w-3 h-3 inline mr-1" />Limite : {new Date(d.date_limite).toLocaleDateString("fr-FR")}</span>
                                <span>Prof : {d.enseignant}</span>
                              </div>
                              {d.commentaire_soumission && (
                                <p className="text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2 mt-2">💬 {d.commentaire_soumission}</p>
                              )}
                            </div>
                            {d.fichier_url && (
                              <a href={d.fichier_url} target="_blank" rel="noopener noreferrer"
                                className="shrink-0 flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                                <Download className="w-3 h-3" /> Fichier
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ NOTES ═══ */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Notes & Moyennes</h3>
                    {moyenneGenerale > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-2xl text-blue-700">{moyenneGenerale}</span>
                        <span className="text-gray-900">/20</span>
                        <MentionBadge moy={moyenneGenerale} />
                      </div>
                    )}
                  </div>
                  {matieres.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium">Aucune note disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matieres.map(m => (
                        <div key={m.matiere} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                          <button onClick={() => setExpandedMatiere(expandedMatiere === m.matiere ? null : m.matiere)}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition text-left">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${m.moyenne >= 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {m.moyenne.toFixed(1)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{m.matiere}</p>
                                <p className="text-xs text-gray-900">{m.enseignant} · {m.notes.length} note{m.notes.length > 1 ? "s" : ""}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <MentionBadge moy={m.moyenne} />
                              {expandedMatiere === m.matiere ? <ChevronUp className="w-4 h-4 text-gray-900" /> : <ChevronDown className="w-4 h-4 text-gray-900" />}
                            </div>
                          </button>
                          {expandedMatiere === m.matiere && (
                            <div className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                              {m.notes.map((n, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-3">
                                  <div>
                                    <span className="text-xs font-medium capitalize bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{n.type_note}</span>
                                    <span className="text-xs text-gray-900 ml-2">{new Date(n.date_saisie).toLocaleDateString("fr-FR")}</span>
                                    {n.commentaire && <p className="text-xs text-gray-900 mt-0.5 italic">{n.commentaire}</p>}
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-bold text-lg ${n.valeur >= 10 ? "text-green-600" : "text-red-600"}`}>{n.valeur}</span>
                                    <span className="text-xs text-gray-900">/20</span>
                                    <p className="text-xs text-gray-900">coeff. {n.coefficient}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ EXAMENS ═══ */}
              {activeTab === "examens" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Évaluations assignées</h3>
                  {examens.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium">Aucune évaluation disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {examens.map(ex => (
                        <div key={ex.id} className={`p-4 rounded-xl border ${ex.deja_passe ? "bg-green-50 border-green-100" : "bg-white border-gray-100"}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-800">{ex.titre}</p>
                                {ex.deja_passe
                                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Passé</span>
                                  : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> À passer</span>
                                }
                              </div>
                              <p className="text-xs text-gray-900 mt-1">{ex.matiere} · {ex.enseignant}</p>
                              {ex.date_debut && <p className="text-xs text-gray-900 mt-0.5"><Calendar className="w-3 h-3 inline mr-1" />{new Date(ex.date_debut).toLocaleDateString("fr-FR")}</p>}
                              <div className="flex gap-3 mt-2 text-xs text-gray-900">
                                {ex.nb_questions > 0 && <span>{ex.nb_questions} question{ex.nb_questions > 1 ? "s" : ""}</span>}
                                {ex.total_points > 0 && <span>/ {ex.total_points} pts</span>}
                              </div>
                            </div>
                            {ex.fichier_url && (
                              <a href={ex.fichier_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition shrink-0">
                                <Download className="w-3 h-3" /> Sujet
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ COURS ═══ */}
              {activeTab === "cours" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-lg">Cours & Leçons</h3>
                  {cours.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium">Aucun cours disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cours.map((c, ci) => (
                        <div key={ci} className="border border-gray-100 rounded-xl overflow-hidden">
                          <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                            <p className="font-bold text-gray-800">{c.matiere}</p>
                            <p className="text-xs text-gray-900 mt-0.5">{c.enseignant} · {c.lecons.length} leçon{c.lecons.length > 1 ? "s" : ""}</p>
                          </div>
                          <div className="divide-y divide-gray-50">
                            {c.lecons.map(l => (
                              <div key={l.id} className="p-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-sm">{l.titre}</p>
                                  {l.description && <p className="text-xs text-gray-900 mt-0.5 line-clamp-2">{l.description}</p>}
                                  <p className="text-xs text-gray-900 mt-1"><Calendar className="w-3 h-3 inline mr-1" />{new Date(l.date_publication).toLocaleDateString("fr-FR")}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  {l.fichier_url && (
                                    <a href={l.fichier_url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-lg hover:bg-blue-200 transition">
                                      <Download className="w-3 h-3" /> PDF
                                    </a>
                                  )}
                                  {l.video_url && (
                                    <a href={l.video_url} target="_blank" rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-200 transition">
                                      <PlayCircle className="w-3 h-3" /> Vidéo
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ BULLETIN ═══ */}
              {activeTab === "bulletin" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-bold text-gray-800 text-lg">Bulletin de Notes</h3>
                    {bulletin && (
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <span className="text-3xl font-extrabold text-blue-700">{bulletin.moyenneGenerale}</span>
                          <span className="text-gray-900">/20</span>
                        </div>
                        <MentionBadge moy={bulletin.moyenneGenerale} />
                      </div>
                    )}
                  </div>
                  {!bulletin || bulletin.lignes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium">Bulletin non disponible</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">Matière</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">Coeff.</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">Notes</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">Moyenne</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wide">Appréciation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bulletin.lignes.map((l, i) => (
                            <tr key={i} className="hover:bg-blue-50/30 transition">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-800">{l.matiere}</p>
                                <p className="text-xs text-gray-900">{l.enseignant}</p>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">{l.coefficient}</td>
                              <td className="px-4 py-3 text-center text-gray-900 text-xs">{l.nbNotes}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`font-extrabold text-lg ${l.moyenne >= 10 ? "text-green-600" : "text-red-600"}`}>{l.moyenne}</span>
                                <span className="text-gray-900 text-xs">/20</span>
                              </td>
                              <td className="px-4 py-3 text-center"><MentionBadge moy={l.moyenne} /></td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 font-bold">Moyenne Générale</td>
                            <td className="px-4 py-3 text-center font-extrabold text-xl">{bulletin.moyenneGenerale}/20</td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-white/20 border border-white/30 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                {bulletin.mentionGenerale}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ FINANCES ═══ */}
              {activeTab === "finances" && (
                <div className="space-y-5">
                  <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" /> Situation financière
                  </h3>
                  {!frais ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium">Aucune donnée financière</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Barre de progression */}
                      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold text-gray-700">Progression du paiement</span>
                          <span className={`text-sm font-bold px-3 py-1 rounded-full ${pctPaye >= 100 ? "bg-green-100 text-green-700" : pctPaye >= 50 ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                            {pctPaye}% payé
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${pctPaye >= 100 ? "bg-green-500" : pctPaye >= 50 ? "bg-blue-500" : "bg-orange-500"}`}
                            style={{ width: `${Math.min(pctPaye, 100)}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-900">Total</p>
                            <p className="font-bold text-gray-800 text-sm">{Number(frais.total).toLocaleString()} GNF</p>
                          </div>
                          <div className="text-center border-x border-gray-100">
                            <p className="text-xs text-gray-900">Payé</p>
                            <p className="font-bold text-green-600 text-sm">{Number(frais.paye).toLocaleString()} GNF</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-900">Restant</p>
                            <p className={`font-bold text-sm ${frais.reste === 0 ? "text-green-600" : "text-red-600"}`}>
                              {Number(frais.reste).toLocaleString()} GNF
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Détail par catégorie */}
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Scolarité", value: frais.scolarite, icon: GraduationCap, color: "blue" },
                          { label: "Inscription", value: frais.inscription, icon: FileText, color: "indigo" },
                          { label: "Cantine", value: frais.cantine, icon: Utensils, color: "orange" },
                          { label: "Transport", value: frais.transport, icon: Bus, color: "purple" },
                          { label: "Librairie", value: frais.librairie, icon: BookOpen, color: "green" },
                        ].filter(item => item.value > 0).map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl bg-${item.color}-100 flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 text-${item.color}-600`} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-900">{item.label}</p>
                                <p className="font-bold text-gray-800 text-sm">{Number(item.value).toLocaleString()} GNF</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {frais.reste === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                          <p className="text-green-700 font-semibold">Tous les frais ont été réglés pour cet enfant ✓</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}