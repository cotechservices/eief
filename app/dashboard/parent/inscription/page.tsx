// app/dashboard/parent/inscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  UserPlus,
  User,
  Calendar,
  MapPin,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Clock,
  XCircle,
  CreditCard,
  Wallet,
  Smartphone,
  AlertTriangle,
  X,
  Eye
} from "lucide-react";

interface Enfant {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  sexe: string;
  niveau: string;
  classe: string;
  acteNaissance: File | null;
  photo: File | null;
  bulletin: File | null;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

interface Preinscription {
  id: number;
  numero_dossier: string;
  enfant_nom: string;
  enfant_prenom: string;
  date_naissance: string;
  niveau: string;
  classe: string;
  statut: "en_attente" | "valide" | "rejete";
  date_preinscription: string;
  frais_statut: string;
  frais_montant: number;
  photo_url: string | null;
}

interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export default function InscriptionParentPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [preinscriptions, setPreinscriptions] = useState<Preinscription[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [showForm, setShowForm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Paiement
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedPreinscription, setSelectedPreinscription] = useState<Preinscription | null>(null);
  const [modePaiement, setModePaiement] = useState("");
  const [reference, setReference] = useState("");
  const [paiementLoading, setPaiementLoading] = useState(false);

  // Annulation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [preinscriptionToCancel, setPreinscriptionToCancel] = useState<Preinscription | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [enfants, setEnfants] = useState<Enfant[]>([
    {
      id: crypto.randomUUID(),
      nom: "",
      prenom: "",
      dateNaissance: "",
      lieuNaissance: "",
      sexe: "",
      niveau: "",
      classe: "",
      acteNaissance: null,
      photo: null,
      bulletin: null,
    }
  ]);
  const [activeEnfantIndex, setActiveEnfantIndex] = useState(0);

  const addNotification = (type: Notification["type"], message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, preinscriptionsRes] = await Promise.all([
        fetch("/api/public/classes"),
        fetch("/api/parent/preinscriptions")
      ]);
      const classesData = await classesRes.json();
      const preinscriptionsData = await preinscriptionsRes.json();
      setClasses(classesData);
      setPreinscriptions(Array.isArray(preinscriptionsData) ? preinscriptionsData : []);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      addNotification("error", "Erreur lors du chargement des données");
    } finally {
      setLoadingData(false);
    }
  };

  const getClassesForNiveau = (niveauNom: string) => {
    return classes.filter(c => c.niveau === niveauNom);
  };

  const getNiveauxOptions = () => {
    return [...new Set(classes.map(c => c.niveau))];
  };

  const handleEnfantChange = (index: number, field: keyof Enfant, value: any) => {
    const newEnfants = [...enfants];
    newEnfants[index] = { ...newEnfants[index], [field]: value };
    if (field === "niveau") {
      newEnfants[index].classe = "";
    }
    setEnfants(newEnfants);
  };

  const handleFileChange = (index: number, field: "acteNaissance" | "photo" | "bulletin", file: File | null) => {
    const newEnfants = [...enfants];
    newEnfants[index][field] = file;
    setEnfants(newEnfants);
  };

  const uploadFile = async (file: File, enfantId: string, type: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("enfantId", enfantId);
    formData.append("type", type);
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      return data.success ? data.url : null;
    } catch (error) {
      console.error(`Erreur upload ${type}:`, error);
      return null;
    }
  };

  const addEnfant = () => {
    setEnfants([
      ...enfants,
      {
        id: crypto.randomUUID(),
        nom: "",
        prenom: "",
        dateNaissance: "",
        lieuNaissance: "",
        sexe: "",
        niveau: "",
        classe: "",
        acteNaissance: null,
        photo: null,
        bulletin: null,
      }
    ]);
    setActiveEnfantIndex(enfants.length);
  };

  const removeEnfant = (index: number) => {
    if (enfants.length === 1) return;
    const newEnfants = enfants.filter((_, i) => i !== index);
    setEnfants(newEnfants);
    if (activeEnfantIndex >= newEnfants.length) {
      setActiveEnfantIndex(newEnfants.length - 1);
    }
  };

  const nextStep = () => { setStep(step + 1); window.scrollTo(0, 0); };
  const prevStep = () => { setStep(step - 1); window.scrollTo(0, 0); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedCount = 0;
      const filesToUpload = enfants.filter(e => e.acteNaissance || e.photo || e.bulletin).length;

      const enfantsAvecUrls = await Promise.all(
        enfants.map(async (enfant) => {
          let acteUrl = null, photoUrl = null, bulletinUrl = null;

          if (enfant.acteNaissance) {
            acteUrl = await uploadFile(enfant.acteNaissance, enfant.id, "acte");
            uploadedCount++;
            setUploadProgress({ current: uploadedCount, total: filesToUpload });
          }
          if (enfant.photo) {
            photoUrl = await uploadFile(enfant.photo, enfant.id, "photo");
            uploadedCount++;
            setUploadProgress({ current: uploadedCount, total: filesToUpload });
          }
          if (enfant.bulletin) {
            bulletinUrl = await uploadFile(enfant.bulletin, enfant.id, "bulletin");
            uploadedCount++;
            setUploadProgress({ current: uploadedCount, total: filesToUpload });
          }

          return {
            nom: enfant.nom,
            prenom: enfant.prenom,
            dateNaissance: enfant.dateNaissance,
            lieuNaissance: enfant.lieuNaissance,
            sexe: enfant.sexe,
            niveau: enfant.niveau,
            classe: enfant.classe,
            acteNaissanceUrl: acteUrl,
            photoUrl: photoUrl,
            bulletinUrl: bulletinUrl,
          };
        })
      );

      const response = await fetch("/api/preinscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent: null,
          parentId: (session?.user as any)?.parentId || (session?.user as any)?.id,
          enfants: enfantsAvecUrls,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification("success", `Pré-inscription de ${enfants.length} enfant(s) envoyée avec succès !`);
        setShowForm(false);
        setStep(1);
        setEnfants([{
          id: crypto.randomUUID(), nom: "", prenom: "", dateNaissance: "", lieuNaissance: "",
          sexe: "", niveau: "", classe: "", acteNaissance: null, photo: null, bulletin: null,
        }]);
        setActiveEnfantIndex(0);
        fetchData();
      } else {
        addNotification("error", "Erreur: " + data.message);
      }
    } catch (error) {
      console.error("Erreur:", error);
      addNotification("error", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const handlePaiement = async () => {
    if (!selectedPreinscription || !modePaiement) return;
    setPaiementLoading(true);
    try {
      const response = await fetch("/api/parent/paiement-preinscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preinscriptionId: selectedPreinscription.id,
          modePaiement,
          reference: reference || null,
        }),
      });
      const data = await response.json();
      if (data.success) {
        addNotification("success", "Paiement effectué avec succès !");
        setShowPaiementModal(false);
        setSelectedPreinscription(null);
        setModePaiement("");
        setReference("");
        fetchData();
      } else {
        addNotification("error", data.error || "Erreur lors du paiement");
      }
    } catch (error) {
      addNotification("error", "Erreur lors du paiement");
    } finally {
      setPaiementLoading(false);
    }
  };

  const handleCancelPreinscription = async () => {
    if (!preinscriptionToCancel) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/parent/preinscriptions/${preinscriptionToCancel.id}`, { method: "DELETE" });
      if (response.ok) {
        addNotification("success", `Pré-inscription de ${preinscriptionToCancel.enfant_prenom} ${preinscriptionToCancel.enfant_nom} annulée`);
        setShowConfirmModal(false);
        setPreinscriptionToCancel(null);
        fetchData();
      } else {
        const data = await response.json();
        addNotification("error", data.error || "Erreur lors de l'annulation");
      }
    } catch (error) {
      addNotification("error", "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      return enfants.every(e => e.nom && e.prenom && e.dateNaissance && e.niveau && e.classe && e.sexe);
    }
    if (step === 2) {
      return enfants.every(e => e.acteNaissance && e.photo);
    }
    return true;
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_attente":
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>;
      case "valide":
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validée</span>;
      case "rejete":
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejetée</span>;
      default:
        return null;
    }
  };

  const getFraisBadge = (fraisStatut: string) => {
    if (fraisStatut === "paye") {
      return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Payé</span>;
    }
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Non payé</span>;
  };

  const niveauxOptions = getNiveauxOptions();

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-900">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Notifications Toast */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === "success" ? "bg-green-50 border-l-4 border-green-500 text-green-800"
              : notification.type === "error" ? "bg-red-50 border-l-4 border-red-500 text-red-800"
              : notification.type === "warning" ? "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800"
              : "bg-blue-50 border-l-4 border-blue-500 text-blue-800"
            }`}
          >
            <div className="flex-1">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {notification.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
            <button onClick={() => removeNotification(notification.id)} className="ml-4 text-gray-900 hover:text-gray-900 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-blue-600" />
            Inscription
          </h1>
          <p className="text-gray-900">Inscrire un enfant à l'école</p>
        </div>
        {!showForm && (
          <Link
            href="/register"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle inscription
          </Link>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Total</p>
              <p className="text-2xl font-bold text-blue-600">{preinscriptions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{preinscriptions.filter(p => p.statut === "en_attente").length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Validées</p>
              <p className="text-2xl font-bold text-green-600">{preinscriptions.filter(p => p.statut === "valide").length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 text-sm">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{preinscriptions.filter(p => p.statut === "rejete").length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Liste des pré-inscriptions existantes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Mes inscriptions
          </h2>
        </div>

        {preinscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-900">Aucune pré-inscription</p>
            <p className="text-sm text-gray-500 mt-1">Cliquez sur "Nouvelle inscription" pour commencer.</p>
          </div>
        ) : (
          <div className="divide-y">
            {preinscriptions.map((p) => (
              <div key={p.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="photo" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-black">{p.enfant_prenom} {p.enfant_nom}</h3>
                        <p className="text-sm text-gray-600">{p.classe} • Dossier: <span className="font-mono text-blue-600">{p.numero_dossier}</span></p>
                        <p className="text-xs text-gray-500 mt-1">Soumis le {new Date(p.date_preinscription).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatutBadge(p.statut)}
                        {getFraisBadge(p.frais_statut)}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {p.frais_statut !== "paye" && p.statut === "en_attente" && (
                        <>
                          <button onClick={() => { setSelectedPreinscription(p); setShowPaiementModal(true); }}
                            className="flex-1 bg-green-600 text-white text-sm py-1.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payer l'inscription 
                          </button>
                          <button onClick={() => { setPreinscriptionToCancel(p); setShowConfirmModal(true); }}
                            className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200 transition flex items-center gap-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {p.frais_statut === "paye" && p.statut === "en_attente" && (
                        <div className="flex-1 bg-yellow-100 text-yellow-700 text-sm py-1.5 rounded-lg text-center">En attente de validation</div>
                      )}
                      {p.statut === "valide" && (
                        <div className="flex-1 bg-green-100 text-green-700 text-sm py-1.5 rounded-lg text-center">✅ Inscription validée</div>
                      )}
                      {p.statut === "rejete" && (
                        <div className="flex-1 bg-red-100 text-red-700 text-sm py-1.5 rounded-lg text-center">❌ Pré-inscription rejetée</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Annulation */}
      {showConfirmModal && preinscriptionToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Annuler la pré-inscription</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-900 mb-2">Êtes-vous sûr de vouloir annuler cette pré-inscription ?</p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-4">
                {preinscriptionToCancel.enfant_prenom} {preinscriptionToCancel.enfant_nom} - {preinscriptionToCancel.classe}
              </p>
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Cette action est irréversible.
              </p>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowConfirmModal(false); setPreinscriptionToCancel(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition text-black" disabled={cancelling}>Annuler</button>
              <button onClick={handleCancelPreinscription} disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50">
                {cancelling ? <><Loader2 className="w-4 h-4 animate-spin" /> Annulation...</> : <><Trash2 className="w-4 h-4" /> Confirmer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      {showPaiementModal && selectedPreinscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-black">Paiement des frais</h2>
                <button onClick={() => { setShowPaiementModal(false); setSelectedPreinscription(null); setModePaiement(""); setReference(""); }}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-900 text-sm">{selectedPreinscription.enfant_prenom} {selectedPreinscription.enfant_nom} - {selectedPreinscription.classe}</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-900">Montant à payer</p>
                <p className="text-2xl font-bold text-blue-700">{(selectedPreinscription.frais_montant || 500000).toLocaleString()} GNF</p>
              </div>
              <div>
                <label className="block text-gray-900 mb-2">Mode de paiement *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setModePaiement("especes")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === "especes" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <Wallet className="w-6 h-6 text-green-900" /><span className="text-xs text-black">Espèces</span>
                  </button>
                  <button type="button" onClick={() => setModePaiement("orange_money")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === "orange_money" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <Smartphone className="w-6 h-6 text-orange-600" /><span className="text-xs text-black">Orange Money</span>
                  </button>
                  <button type="button" onClick={() => setModePaiement("carte")}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition ${modePaiement === "carte" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <CreditCard className="w-6 h-6 text-blue-700" /><span className="text-xs text-black">Carte</span>
                  </button>
                </div>
              </div>
              {modePaiement === "especes" && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700">Paiement en espèces à effectuer à la caisse de l'école.</p>
                </div>
              )}
              {(modePaiement === "orange_money" || modePaiement === "carte") && (
                <div>
                  <label className="block text-gray-900 mb-2">Numéro de transaction</label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                    placeholder={modePaiement === "orange_money" ? "Ex: #OM-123456789" : "Ex: VISA-****-1234"}
                    className="text-black w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <button onClick={handlePaiement} disabled={!modePaiement || paiementLoading}
                className={`w-full py-3 rounded-lg font-semibold transition ${!modePaiement || paiementLoading ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}>
                {paiementLoading ? "Traitement..." : "Confirmer le paiement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
