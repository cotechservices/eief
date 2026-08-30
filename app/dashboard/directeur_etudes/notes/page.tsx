"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2, FileText, GraduationCap, ChevronDown, ChevronUp, UserCheck, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotesDirecteurPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasse, setSelectedClasse] = useState("");

  const [eleves, setEleves] = useState<any[]>([]);
  const [enseignements, setEnseignements] = useState<any[]>([]);

  // Format: { "eleveId_enseignementId": { id?: number, valeur: string, note_sur: string, coefficient: string } }
  const [notesForm, setNotesForm] = useState<Record<string, any>>({});

  // Track expanded students
  const [expandedEleves, setExpandedEleves] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [globalNoteSur, setGlobalNoteSur] = useState("10");

  const handleGlobalNoteSurChange = (newVal: string) => {
    setGlobalNoteSur(newVal);
    setNotesForm(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = {
          ...updated[key],
          note_sur: newVal
        };
      });
      return updated;
    });
  };

  // 1. Fetch Classes on mount
  useEffect(() => {
    fetch("/api/directeur_etudes/notes?action=classes")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClasses(data);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Fetch Data when Class changes
  useEffect(() => {
    if (!selectedClasse) {
      setEleves([]);
      setEnseignements([]);
      setNotesForm({});
      setExpandedEleves({});
      setMessage({ type: "", text: "" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    fetch(`/api/directeur_etudes/notes/grid?classe_id=${selectedClasse}`)
      .then(res => res.json())
      .then(data => {
        if (data.eleves && data.enseignements && data.notes) {
          setEleves(data.eleves);
          setEnseignements(data.enseignements);

          // Pre-populate form map
          const newForm: Record<string, any> = {};

          // Set global note sur based on first database note if exists
          let resolvedGlobalNoteSur = globalNoteSur;
          if (data.notes && data.notes.length > 0) {
            resolvedGlobalNoteSur = String(data.notes[0].note_sur || "10");
            setGlobalNoteSur(resolvedGlobalNoteSur);
          }

          // First pass: initialize with defaults from enseignements
          data.eleves.forEach((eleve: any) => {
            data.enseignements.forEach((ens: any) => {
              const key = `${eleve.id}_${ens.enseignement_id}`;
              newForm[key] = {
                valeur: "",
                note_sur: resolvedGlobalNoteSur,
                coefficient: String(ens.default_coefficient || 1)
              };
            });
          });

          // Second pass: overlay existing database notes
          data.notes.forEach((note: any) => {
            const key = `${note.eleve_id}_${note.enseignement_id}`;
            newForm[key] = {
              id: note.id,
              valeur: note.valeur !== null ? String(note.valeur) : "",
              note_sur: note.note_sur ? String(note.note_sur) : resolvedGlobalNoteSur,
              coefficient: note.coefficient ? String(note.coefficient) : "1"
            };
          });

          setNotesForm(newForm);

          // Expand the first student by default
          if (data.eleves.length > 0) {
            setExpandedEleves({ [data.eleves[0].id]: true });
          }
        }
      })
      .catch(err => {
        console.error(err);
        setMessage({ type: "error", text: "Erreur de chargement des notes." });
      })
      .finally(() => setLoading(false));
  }, [selectedClasse]);

  const handleFieldChange = (eleveId: number, enseignementId: number, field: string, value: string) => {
    const key = `${eleveId}_${enseignementId}`;
    setNotesForm(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { note_sur: "10", coefficient: "1", valeur: "" }),
        [field]: value
      }
    }));
  };

  const getMention = (valeurStr: string, noteSurStr: string) => {
    const val = parseFloat(valeurStr);
    const sur = parseFloat(noteSurStr) || 10;
    if (isNaN(val) || val < 0) return "-";

    // Normalize to base 10 for mention calculation
    const val10 = sur === 20 ? val / 2 : val;

    if (val10 >= 8) return "TRES BIEN";
    if (val10 >= 7) return "BIEN";
    if (val10 >= 6) return "ASSEZ BIEN";
    if (val10 >= 5) return "PASSABLE";
    return "INSUFFISANT";
  };

  const calculateStudentAverages = (eleveId: number) => {
    let totalPoints = 0;
    let totalCoefficients = 0;

    enseignements.forEach(ens => {
      const key = `${eleveId}_${ens.enseignement_id}`;
      const form = notesForm[key] || {};
      const val = parseFloat(form.valeur);
      const coeff = parseFloat(form.coefficient) || 1;
      const sur = parseFloat(form.note_sur) || 10;

      if (!isNaN(val)) {
        // Normalize to base 10 for overall average
        const val10 = sur === 20 ? val / 2 : val;
        totalPoints += val10 * coeff;
        totalCoefficients += coeff;
      }
    });

    if (totalCoefficients === 0) return { moyenne: "-", totalPoints: 0, totalCoeff: 0 };
    const moyenne = (totalPoints / totalCoefficients).toFixed(2);
    return { moyenne, totalPoints: totalPoints.toFixed(1), totalCoeff: totalCoefficients };
  };

  const toggleExpand = (eleveId: number) => {
    setExpandedEleves(prev => ({
      ...prev,
      [eleveId]: !prev[eleveId]
    }));
  };

  const toggleAll = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    eleves.forEach(el => {
      next[el.id] = expand;
    });
    setExpandedEleves(next);
  };

  const saveStudentNotes = async (eleveId: number) => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    const notesToSave: any[] = [];
    enseignements.forEach(ens => {
      const key = `${eleveId}_${ens.enseignement_id}`;
      const formData = notesForm[key];
      if (formData && (formData.valeur !== "" || formData.id)) {
        notesToSave.push({
          id: formData.id,
          eleve_id: eleveId,
          enseignement_id: ens.enseignement_id,
          valeur: formData.valeur,
          note_sur: formData.note_sur,
          coefficient: formData.coefficient
        });
      }
    });

    try {
      const res = await fetch("/api/directeur_etudes/notes/grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesToSave }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Notes de l'élève enregistrées ! Redirection vers les bulletins..." });
        fetchNotesDataSilently();
        setTimeout(() => {
          router.push(`/dashboard/directeur_etudes/bulletins?classe_id=${selectedClasse}`);
        }, 1200);
      } else {
        setMessage({ type: "error", text: result.error || "Erreur d'enregistrement." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  const saveAllNotes = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    const notesToSave: any[] = [];
    Object.keys(notesForm).forEach(key => {
      const [eleve_id, enseignement_id] = key.split('_');
      const formData = notesForm[key];
      if (formData && (formData.valeur !== "" || formData.id)) {
        notesToSave.push({
          id: formData.id,
          eleve_id: parseInt(eleve_id),
          enseignement_id: parseInt(enseignement_id),
          valeur: formData.valeur,
          note_sur: formData.note_sur,
          coefficient: formData.coefficient
        });
      }
    });

    try {
      const res = await fetch("/api/directeur_etudes/notes/grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesToSave }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Toutes les notes sont enregistrées ! Redirection vers les bulletins..." });
        fetchNotesDataSilently();
        setTimeout(() => {
          router.push(`/dashboard/directeur_etudes/bulletins?classe_id=${selectedClasse}`);
        }, 1200);
      } else {
        setMessage({ type: "error", text: result.error || "Erreur d'enregistrement globale." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  const fetchNotesDataSilently = () => {
    fetch(`/api/directeur_etudes/notes/grid?classe_id=${selectedClasse}`)
      .then(res => res.json())
      .then(data => {
        if (data.notes) {
          setNotesForm(prev => {
            const updated = { ...prev };
            data.notes.forEach((note: any) => {
              const key = `${note.eleve_id}_${note.enseignement_id}`;
              updated[key] = {
                id: note.id,
                valeur: note.valeur !== null ? String(note.valeur) : "",
                note_sur: note.note_sur ? String(note.note_sur) : "10",
                coefficient: note.coefficient ? String(note.coefficient) : "1"
              };
            });
            return updated;
          });
        }
      })
      .catch(console.error);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Saisie des Notes (Format Bulletin Individuel)
        </h1>
        <p className="text-gray-900 mt-1">Saisissez les notes, barèmes et coefficients élève par élève pour l'ensemble d'une classe.</p>
      </div>

      {/* FILTRES & CONTROL */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="w-full md:w-1/3 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              Classe
            </label>
            <select
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Barème
            </label>
            <select
              value={globalNoteSur}
              onChange={(e) => handleGlobalNoteSurChange(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition font-semibold"
            >
              <option value="10">sur 10</option>
              <option value="20">sur 20</option>
            </select>
          </div>
        </div>

        {eleves.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => toggleAll(true)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Développer tout
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Réduire tout
            </button>
            <button
              onClick={saveAllNotes}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Tout enregistrer
            </button>
          </div>
        )}
      </div>

      {/* MESSAGE NOTIFICATION */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 font-semibold text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
          {message.text}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-gray-900">Chargement de la liste des élèves...</p>
        </div>
      )}

      {/* STUDENT CARDS (LIST) */}
      {!loading && eleves.length > 0 && (
        <div className="space-y-4">
          {eleves.map((eleve) => {
            const isExpanded = !!expandedEleves[eleve.id];
            const stats = calculateStudentAverages(eleve.id);

            return (
              <div
                key={eleve.id}
                className={`bg-white border rounded-2xl shadow-sm transition overflow-hidden ${isExpanded ? 'border-blue-200 ring-2 ring-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                  }`}
              >
                {/* CARD ACCORDION HEADER */}
                <div
                  onClick={() => toggleExpand(eleve.id)}
                  className="p-4 sm:p-5 flex items-center justify-between cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      {eleve.nom.charAt(0)}{eleve.prenom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{eleve.nom} {eleve.prenom}</h3>
                      <p className="text-xs text-gray-900 font-mono">{eleve.matricule}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-xs text-gray-900 block">Moyenne Générale</span>
                      <span className={`font-bold text-base ${stats.moyenne !== '-' && parseFloat(stats.moyenne) >= 5 ? 'text-green-600' : 'text-red-500'}`}>
                        {stats.moyenne !== '-' ? `${stats.moyenne}/10` : '-'}
                      </span>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-900" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-900" />
                      )}
                    </div>
                  </div>
                </div>

                {/* CARD ACCORDION CONTENT */}
                {isExpanded && (
                  <div className="p-5 border-t border-gray-100 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-100 font-bold uppercase text-xs text-gray-600">
                            <th className="border border-gray-200 p-2.5 text-left">MATIERES</th>
                            <th className="border border-gray-200 p-2.5 w-32 text-center">MOYENNE</th>
                            <th className="border border-gray-200 p-2.5 w-24 text-center">COEFFICIENT</th>
                            <th className="border border-gray-200 p-2.5 w-32 text-center">MOYENNE COEFF</th>
                            <th className="border border-gray-200 p-2.5 w-36 text-center">MENTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enseignements.map((ens) => {
                            const key = `${eleve.id}_${ens.enseignement_id}`;
                            const form = notesForm[key] || { valeur: "", note_sur: globalNoteSur, coefficient: "1" };
                            const calculatedMoyCoeff = (parseFloat(form.valeur) * parseFloat(form.coefficient)).toFixed(1);
                            const mention = getMention(form.valeur, form.note_sur);

                            return (
                              <tr key={ens.enseignement_id} className="hover:bg-gray-50/50">
                                <td className="border border-gray-200 p-2.5 font-semibold text-gray-800 uppercase">
                                  {ens.matiere_nom}
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max={form.note_sur || "10"}
                                    step="0.01"
                                    placeholder={`sur ${form.note_sur || "10"}`}
                                    value={form.valeur}
                                    onChange={(e) => handleFieldChange(eleve.id, ens.enseignement_id, "valeur", e.target.value)}
                                    className="w-full p-1.5 text-center font-bold border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                                  />
                                </td>
                                <td className="border border-gray-200 p-2">
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Coeff"
                                    value={form.coefficient}
                                    onChange={(e) => handleFieldChange(eleve.id, ens.enseignement_id, "coefficient", e.target.value)}
                                    className="w-full p-1.5 text-center font-semibold border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                  />
                                </td>
                                <td className="border border-gray-200 p-2.5 text-center font-bold text-gray-700">
                                  {!isNaN(parseFloat(calculatedMoyCoeff)) ? calculatedMoyCoeff.replace('.0', '') : "-"}
                                </td>
                                <td className={`border border-gray-200 p-2.5 text-center font-bold text-xs ${mention === 'TRES BIEN' || mention === 'BIEN' ? 'text-green-600' : 'text-gray-700'
                                  }`}>
                                  {mention}
                                </td>
                              </tr>
                            );
                          })}

                          {/* SUMMARY ROW */}
                          <tr className="bg-blue-50/50 font-bold">
                            <td className="border border-gray-200 p-2.5 text-blue-900 uppercase">TOTAL DES POINTS</td>
                            <td className="border border-gray-200 p-2.5"></td>
                            <td className="border border-gray-200 p-2.5 text-center text-blue-900">{stats.totalCoeff}</td>
                            <td className="border border-gray-200 p-2.5 text-center text-blue-900">{stats.totalPoints}</td>
                            <td className="border border-gray-200 p-2.5"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* CARD FOOTER WITH SAVE FOR THIS ELEVE */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => saveStudentNotes(eleve.id)}
                        disabled={saving}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Enregistrer cet élève
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}