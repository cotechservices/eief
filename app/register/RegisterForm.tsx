// app/register/RegisterForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User, Mail, Lock, Phone, Calendar, MapPin, Upload, CheckCircle,
  ArrowRight, ArrowLeft, GraduationCap, Plus, Trash2, Users, Eye, EyeOff,
  Loader2, Heart, ShoppingCart, Bus, Utensils, X, Minus
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

interface Fourniture {
  id: number;
  nom: string;
  prix_unitaire: number;
  quantite_stock: number;
  selectedQty: number;
}

interface TransportOption {
  id: number;
  nom: string;
  prix: number;
  selected: boolean;
  horaireMatin?: string;
  horaireSoir?: string;
  immatriculation?: string;
  chauffeur?: string;
  capacite?: number;
  inscrits?: number;
}

interface CantineOption {
  id: number;
  nom: string;
  prix: number;
  prix_annuel: number;
  selected: boolean;
  date?: string;
  plat?: string;
  accompagnement?: string;
  dessert?: string;
  regime_special?: boolean;
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const niveauParam = searchParams.get("niveau");
  const { data: session, status } = useSession();
  const isParentLoggedIn = status === "authenticated" && (session?.user as any)?.role === "PARENT";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [totalInscription, setTotalInscription] = useState(0);

  // Informations PÈRE
  const [pereInfo, setPereInfo] = useState({
    nom: "",
    prenom: "",
    phone: "",
    profession: "",
  });

  // Informations MÈRE
  const [mereInfo, setMereInfo] = useState({
    nom: "",
    prenom: "",
    phone: "",
    profession: "",
  });

  // Email partagé + adresse commune + mot de passe
  const [compteInfo, setCompteInfo] = useState({
    email: "",
    adresse: "",
    password: "",
    confirmPassword: "",
  });

  const [enfants, setEnfants] = useState<Enfant[]>([
    {
      id: crypto.randomUUID(),
      nom: "",
      prenom: "",
      dateNaissance: "",
      lieuNaissance: "",
      sexe: "",
      niveau: niveauParam || "",
      classe: "",
      acteNaissance: null,
      photo: null,
      bulletin: null,
    }
  ]);

  const [activeEnfantIndex, setActiveEnfantIndex] = useState(0);

  // Fournitures
  const [supplies, setSupplies] = useState<Fourniture[]>([]);
  const [totalFournitures, setTotalFournitures] = useState(0);
  const [loadingSupplies, setLoadingSupplies] = useState(false);
  const [suppliesError, setSuppliesError] = useState<string | null>(null);

  // Transport
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [totalTransport, setTotalTransport] = useState(0);
  const [loadingTransport, setLoadingTransport] = useState(false);

  // Cantine
  const [cantineOptions, setCantineOptions] = useState<CantineOption[]>([]);
  const [totalCantine, setTotalCantine] = useState(0);
  const [loadingCantine, setLoadingCantine] = useState(false);

  // Boutons d'action pour les étapes facultatives
  const [skipSupplies, setSkipSupplies] = useState(false);
  const [skipTransport, setSkipTransport] = useState(false);
  const [skipCantine, setSkipCantine] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  // Recalcul du total inscription
  useEffect(() => {
    let total = 0;
    enfants.forEach(enfant => {
      if (enfant.classe) {
        const matchedClass = classes.find(c => c.nom === enfant.classe);
        if (matchedClass && (matchedClass as any).frais_inscription) {
          total += (matchedClass as any).frais_inscription;
        }
      }
    });
    setTotalInscription(total);
  }, [enfants, classes]);

  // Mettre à jour totalFournitures quand supplies change
  useEffect(() => {
    const total = supplies.reduce((sum, item) => sum + (item.prix_unitaire * item.selectedQty), 0);
    setTotalFournitures(total);
  }, [supplies]);

  // Charger les fournitures
  useEffect(() => {
    if (step === 5 && !skipSupplies) {
      if (supplies.length === 0 && !loadingSupplies && !suppliesError) {
        fetchSupplies();
      }
      if (transportOptions.length === 0) {
        fetchTransportOptions();
      }
      if (cantineOptions.length === 0) {
        fetchCantineOptions();
      }
    }
  }, [step, skipSupplies]);

  // Fonction fetchSupplies corrigée - Utilise la route publique /api/public/librairie
  const fetchSupplies = async () => {
    try {
      setLoadingSupplies(true);
      setSuppliesError(null);

      // Utiliser la même route que la page librairie
      const response = await fetch('/api/public/librairie');

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      // La route retourne directement un tableau avec les champs: id, nom, description, prix, stock, categorie, image_url
      if (Array.isArray(data) && data.length > 0) {
        const items = data.map((item: any) => ({
          id: item.id,
          nom: item.nom || "Fourniture sans nom",
          prix_unitaire: item.prix || 0,  // Le champ s'appelle 'prix' dans la BD
          quantite_stock: item.stock || 0, // Le champ s'appelle 'stock' dans la BD
          selectedQty: 0,
        }));
        setSupplies(items);
      } else {
        setSuppliesError("Aucune fourniture disponible pour le moment.");
        setSupplies([]);
      }
    } catch (e) {
      console.error("Erreur lors du chargement des fournitures", e);
      setSuppliesError("Impossible de charger les fournitures. Veuillez réessayer.");
      setSupplies([]);
    } finally {
      setLoadingSupplies(false);
    }
  };

  const fetchTransportOptions = async () => {
    try {
      setLoadingTransport(true);
      const res = await fetch("/api/public/transport");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const items = data.map((item: any) => ({
          id: item.id,
          nom: item.nom || "Transport scolaire",
          prix: Number(item.prix) || 0,
          selected: false,
          horaireMatin: item.horaire_matin || "07:30",
          horaireSoir: item.horaire_soir || "16:30",
          immatriculation: item.immatriculation || null,
          chauffeur: item.chauffeur || null,
          capacite: item.capacite || 0,
          inscrits: item.inscrits || 0
        }));
        setTransportOptions(items);
      } else {
        setTransportOptions([]);
      }
    } catch (e) {
      console.error("Erreur chargement transport", e);
      setTransportOptions([]);
    } finally {
      setLoadingTransport(false);
    }
  };

  const fetchCantineOptions = async () => {
    try {
      setLoadingCantine(true);
      const res = await fetch("/api/public/cantine");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const items = data.map((item: any) => ({
          id: item.id,
          nom: item.plat || "Menu du jour",
          prix: Number(item.prix) || 0,        // Prix journalier
          prix_annuel: Number(item.prix_annuel) || 0, // Prix annuel
          selected: false,
          date: item.date,
          plat: item.plat,
          accompagnement: item.accompagnement,
          dessert: item.dessert,
          regime_special: item.regime_special || false
        }));
        setCantineOptions(items);
      } else {
        setCantineOptions([]);
      }
    } catch (e) {
      console.error("Erreur chargement cantine", e);
      setCantineOptions([]);
    } finally {
      setLoadingCantine(false);
    }
  };

  // Pré-remplir les informations du parent si connecté
  useEffect(() => {
    if (isParentLoggedIn && session?.user) {
      setCompteInfo(prev => ({
        ...prev,
        email: session.user?.email || "",
        adresse: (session.user as any).adresse || "",
      }));
      setPereInfo(prev => ({
        ...prev,
        nom: (session.user as any).nom || "",
        prenom: (session.user as any).prenom || "",
        phone: (session.user as any).telephone || "",
      }));
      setStep(2);
    }
  }, [isParentLoggedIn, session]);

  const fetchClasses = async () => {
    try {
      const classesRes = await fetch("/api/public/classes");
      const classesData = await classesRes.json();
      setClasses(classesData);
    } catch (error) {
      console.error("Erreur chargement classes:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const getClassesForNiveau = (niveauNom: string) => {
    return classes.filter(c => c.niveau === niveauNom);
  };

  const getNiveauxOptions = () => {
    const niveauxUniques = [...new Set(classes.map(c => c.niveau))];
    return niveauxUniques;
  };

  const handlePereChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPereInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleMereChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMereInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleCompteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompteInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleEnfantChange = (index: number, field: keyof Enfant, value: any) => {
    const newEnfants = [...enfants];
    newEnfants[index] = { ...newEnfants[index], [field]: value };

    if (field === 'niveau') {
      newEnfants[index].classe = "";
    }

    setEnfants(newEnfants);
  };

  const handleFileChange = (index: number, field: 'acteNaissance' | 'photo' | 'bulletin', file: File | null) => {
    const newEnfants = [...enfants];
    newEnfants[index][field] = file;
    setEnfants(newEnfants);
  };

  const handleSupplyChange = (index: number, delta: number) => {
    setSupplies(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        return {
          ...item,
          selectedQty: Math.max(
            0,
            Math.min(
              item.selectedQty + delta,
              item.quantite_stock
            )
          ),
        };
      })
    );
  };

  const toggleTransport = (index: number) => {
    const newOptions = [...transportOptions];
    newOptions[index].selected = !newOptions[index].selected;
    setTransportOptions(newOptions);
    const total = newOptions.filter(o => o.selected).reduce((sum, o) => sum + o.prix, 0);
    setTotalTransport(total);
  };

  const toggleCantine = (index: number) => {
    const newOptions = [...cantineOptions];
    newOptions[index].selected = !newOptions[index].selected;
    setCantineOptions(newOptions);
    // Utiliser prix_annuel au lieu de prix
    const total = newOptions.filter(o => o.selected).reduce((sum, o) => sum + (o.prix_annuel || 0), 0);
    setTotalCantine(total);
  };

  const uploadFile = async (file: File, enfantId: string, type: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("enfantId", enfantId);
    formData.append("type", type);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        return data.url;
      }
      return null;
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

  const nextStep = () => {
    if (step === 4) {
      setStep(5);
      window.scrollTo(0, 0);
      return;
    }
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (step === 5) {
      setStep(4);
      window.scrollTo(0, 0);
      return;
    }
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const getTotalGeneral = () => {
    let total = totalInscription;
    if (!skipSupplies) total += totalFournitures;
    if (!skipTransport) total += totalTransport;
    if (!skipCantine) total += totalCantine;
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const filesToUpload = enfants.filter(e => e.acteNaissance || e.photo || e.bulletin).length;
      let uploadedCount = 0;

      const enfantsAvecUrls = await Promise.all(
        enfants.map(async (enfant) => {
          let acteUrl = null;
          let photoUrl = null;
          let bulletinUrl = null;

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

      const requestBody: any = {
        parentId: isParentLoggedIn ? (session?.user as any).parentId || (session?.user as any).id : null,
        parent: isParentLoggedIn ? null : {
          pereNom: pereInfo.nom,
          perePrenom: pereInfo.prenom,
          perePhone: pereInfo.phone,
          pereProfession: pereInfo.profession,
          mereNom: mereInfo.nom,
          merePrenom: mereInfo.prenom,
          merePhone: mereInfo.phone,
          mereProfession: mereInfo.profession,
          email: compteInfo.email,
          adresse: compteInfo.adresse,
          password: compteInfo.password,
        },
        enfants: enfantsAvecUrls,
      };

      if (!skipSupplies) {
        requestBody.fournitures_commande = supplies
          .filter((s) => s.selectedQty > 0)
          .map((s) => ({
            id: s.id,
            nom: s.nom,
            prix_unitaire: s.prix_unitaire,
            quantite: s.selectedQty,
          }));
        requestBody.montant_fournitures = totalFournitures;
      }

      if (!skipTransport) {
        requestBody.transport = transportOptions
          .filter(t => t.selected)
          .map(t => ({ id: t.id, nom: t.nom, prix: t.prix }));
        requestBody.montant_transport = totalTransport;
      }

      if (!skipCantine) {
        requestBody.cantine = cantineOptions
          .filter(c => c.selected)
          .map(c => ({ id: c.id, nom: c.nom, prix: c.prix }));
        requestBody.montant_cantine = totalCantine;
      }

      requestBody.montant_inscription = totalInscription;
      requestBody.montant_total = getTotalGeneral();

      const response = await fetch("/api/preinscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("preinscription", JSON.stringify({
          parentName: isParentLoggedIn
            ? `${(session?.user as any).prenom} ${(session?.user as any).nom}`
            : `${pereInfo.prenom} ${pereInfo.nom} & ${mereInfo.prenom} ${mereInfo.nom}`,
          enfantsCount: enfants.length,
          preinscriptions: data.preinscriptions,
        }));
        router.push("/register-success");
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const isStepValid = () => {
    if (step === 1) {
      const pereValide = pereInfo.nom && pereInfo.prenom && pereInfo.phone;
      const emailValide = compteInfo.email;
      const mereValide = !mereInfo.nom && !mereInfo.prenom
        ? true
        : mereInfo.nom && mereInfo.prenom && mereInfo.phone;
      return pereValide && emailValide && mereValide;
    }
    if (step === 2) {
      return enfants.every(enfant =>
        enfant.nom && enfant.prenom && enfant.dateNaissance && enfant.niveau && enfant.classe
      );
    }
    if (step === 3) {
      return enfants.every(enfant => enfant.acteNaissance && enfant.photo);
    }
    if (step === 4) {
      return isParentLoggedIn || (compteInfo.password && compteInfo.password === compteInfo.confirmPassword && compteInfo.password.length >= 6);
    }
    return true;
  };

  const niveauxOptions = getNiveauxOptions();

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {(isParentLoggedIn ? [2, 3, 4, 5] : [1, 2, 3, 4, 5]).map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-900"}`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className="text-xs mt-1 text-gray-900 hidden md:block">
                {s === 1 && "Parents"}
                {s === 2 && "Enfant(s)"}
                {s === 3 && "Documents"}
                {s === 4 && "Validation"}
                {s === 5 && "Services"}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-1 bg-gray-300 rounded-full w-full"></div>
          <div
            className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: isParentLoggedIn ? `${((step - 2) / 3) * 100}%` : `${((step - 1) / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        {loading && uploadProgress.total > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">
              Upload des documents... {uploadProgress.current}/{uploadProgress.total}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {isParentLoggedIn && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Vous êtes connecté en tant que parent. Vos informations seront utilisées automatiquement.
            </p>
          </div>
        )}

        {/* Étape 1 - Parents */}
        {!isParentLoggedIn && step === 1 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Informations des parents</h2>
                <p className="text-gray-500 text-sm">Renseignez les informations du père et de la mère</p>
              </div>
            </div>

            {/* Père */}
            <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-blue-900">Informations du Père <span className="text-red-500">*</span></h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Nom *</label><input type="text" name="nom" value={pereInfo.nom} onChange={handlePereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Nom du père" required /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Prénom *</label><input type="text" name="prenom" value={pereInfo.prenom} onChange={handlePereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Prénom du père" required /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Téléphone du père *</label><input type="tel" name="phone" value={pereInfo.phone} onChange={handlePereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="+224 6XX XX XX XX" required /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Profession du père</label><input type="text" name="profession" value={pereInfo.profession} onChange={handlePereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Ex: Ingénieur, Médecin..." /></div>
              </div>
            </div>

            {/* Mère */}
            <div className="border border-pink-200 rounded-xl p-5 bg-pink-50/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-pink-900">Informations de la Mère <span className="text-gray-400 text-sm font-normal">(optionnel)</span></h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Nom</label><input type="text" name="nom" value={mereInfo.nom} onChange={handleMereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-black" placeholder="Nom de la mère" /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Prénom</label><input type="text" name="prenom" value={mereInfo.prenom} onChange={handleMereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-black" placeholder="Prénom de la mère" /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Téléphone de la mère</label><input type="tel" name="phone" value={mereInfo.phone} onChange={handleMereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-black" placeholder="+224 6XX XX XX XX" /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Profession de la mère</label><input type="text" name="profession" value={mereInfo.profession} onChange={handleMereChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-black" placeholder="Ex: Enseignante, Commerçante..." /></div>
              </div>
            </div>

            {/* Email et adresse */}
            <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/40">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informations communes</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                Cet email sera utilisé par les deux parents pour se connecter à la plateforme.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Email familial *</label><input type="email" name="email" value={compteInfo.email} onChange={handleCompteChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="famille@email.com" required /></div>
                <div><label className="block text-gray-700 mb-2 text-sm font-medium">Adresse familiale</label><input type="text" name="adresse" value={compteInfo.adresse} onChange={handleCompteChange} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Votre adresse complète" /></div>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2 - Enfants */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3"><GraduationCap className="w-8 h-8 text-blue-600" /><h2 className="text-2xl font-bold text-gray-900">Mes enfants</h2></div>
              <button type="button" onClick={addEnfant} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"><Plus className="w-4 h-4" /> Ajouter un enfant</button>
            </div>
            <p className="text-gray-900">Vous pouvez inscrire plusieurs enfants</p>
            <div className="flex flex-wrap gap-2 border-b">
              {enfants.map((enfant, idx) => (
                <div key={enfant.id} onClick={() => setActiveEnfantIndex(idx)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition cursor-pointer ${activeEnfantIndex === idx ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}`}>
                  <User className="w-4 h-4" /><span>{enfant.nom || enfant.prenom ? `${enfant.prenom || ""} ${enfant.nom || ""}` : `Enfant ${idx + 1}`}</span>
                  {enfants.length > 1 && (<button type="button" onClick={(e) => { e.stopPropagation(); removeEnfant(idx); }} className="ml-2 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>)}
                </div>
              ))}
            </div>
            {enfants.map((enfant, idx) => (
              <div key={enfant.id} className={activeEnfantIndex === idx ? "block" : "hidden"}>
                <div className="bg-blue-50 p-4 rounded-lg mb-6"><h3 className="font-semibold text-blue-800">Enfant {idx + 1}</h3></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-gray-900 mb-2">Nom *</label><input type="text" value={enfant.nom} onChange={(e) => handleEnfantChange(idx, 'nom', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Nom" required /></div>
                  <div><label className="block text-gray-900 mb-2">Prénom *</label><input type="text" value={enfant.prenom} onChange={(e) => handleEnfantChange(idx, 'prenom', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Prénom" required /></div>
                  <div><label className="block text-gray-900 mb-2">Date de naissance *</label><input type="date" value={enfant.dateNaissance} onChange={(e) => handleEnfantChange(idx, 'dateNaissance', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" required /></div>
                  <div><label className="block text-gray-900 mb-2">Lieu de naissance</label><input type="text" value={enfant.lieuNaissance} onChange={(e) => handleEnfantChange(idx, 'lieuNaissance', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Ville" /></div>
                  <div><label className="block text-gray-900 mb-2">Sexe *</label><select value={enfant.sexe} onChange={(e) => handleEnfantChange(idx, 'sexe', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" required><option value="">Sélectionner</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
                  <div><label className="block text-gray-900 mb-2">Niveau *</label><select value={enfant.niveau} onChange={(e) => handleEnfantChange(idx, 'niveau', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" required><option value="">Sélectionner un niveau</option>{niveauxOptions.map((niveau) => (<option key={niveau} value={niveau}>{niveau}</option>))}</select></div>
                  {enfant.niveau && (<div className="mt-4"><label className="block text-gray-900 mb-2">Classe *</label><select value={enfant.classe} onChange={(e) => handleEnfantChange(idx, 'classe', e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" required><option value="">Sélectionner une classe</option>{getClassesForNiveau(enfant.niveau).map((classe) => (<option key={classe.id} value={classe.nom}>{classe.nom}</option>))}</select></div>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Étape 3 - Documents */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3"><Upload className="w-8 h-8 text-blue-600" /><h2 className="text-2xl font-bold text-gray-900">Documents requis</h2></div>
            <p className="text-gray-900">Veuillez télécharger les documents pour chaque enfant</p>
            {enfants.map((enfant, idx) => (
              <div key={enfant.id} className="border rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-4">{enfant.prenom || "Enfant"} {enfant.nom || ""} - Documents</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-900 mx-auto mb-2" /><label className="block text-gray-900 font-medium mb-2">Extrait d'acte de naissance *</label>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={`acte_${idx}`} onChange={(e) => handleFileChange(idx, 'acteNaissance', e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => document.getElementById(`acte_${idx}`)?.click()} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Choisir un fichier</button>
                    {enfant.acteNaissance && <p className="text-sm text-green-600 mt-2">✓ {enfant.acteNaissance.name}</p>}
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-900 mx-auto mb-2" /><label className="block text-gray-900 font-medium mb-2">Photo d'identité *</label>
                    <input type="file" accept=".jpg,.jpeg,.png" className="hidden" id={`photo_${idx}`} onChange={(e) => handleFileChange(idx, 'photo', e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => document.getElementById(`photo_${idx}`)?.click()} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Choisir un fichier</button>
                    {enfant.photo && <p className="text-sm text-green-600 mt-2">✓ {enfant.photo.name}</p>}
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-900 mx-auto mb-2" /><label className="block text-gray-900 font-medium mb-2">Bulletin (optionnel)</label>
                    <input type="file" accept=".pdf" className="hidden" id={`bulletin_${idx}`} onChange={(e) => handleFileChange(idx, 'bulletin', e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => document.getElementById(`bulletin_${idx}`)?.click()} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 transition">Choisir un fichier</button>
                    {enfant.bulletin && <p className="text-sm text-green-600 mt-2">✓ {enfant.bulletin.name}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Étape 4 - Validation / Mot de passe */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3"><Lock className="w-8 h-8 text-blue-600" /><h2 className="text-2xl font-bold text-gray-900">Confirmation</h2></div>
            {!isParentLoggedIn && (
              <>
                <p className="text-gray-900">Créez un mot de passe pour accéder à la plateforme</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><p className="text-xs font-semibold text-blue-700 mb-1">Père</p><p className="text-sm text-gray-800 font-medium">{pereInfo.prenom} {pereInfo.nom}</p><p className="text-xs text-gray-500">{pereInfo.phone}</p>{pereInfo.profession && <p className="text-xs text-gray-500">{pereInfo.profession}</p>}</div>
                  {(mereInfo.nom || mereInfo.prenom) && (<div className="bg-pink-50 border border-pink-200 rounded-lg p-3"><p className="text-xs font-semibold text-pink-700 mb-1">Mère</p><p className="text-sm text-gray-800 font-medium">{mereInfo.prenom} {mereInfo.nom}</p><p className="text-xs text-gray-500">{mereInfo.phone}</p>{mereInfo.profession && <p className="text-xs text-gray-500">{mereInfo.profession}</p>}</div>)}
                </div>
                <p className="text-sm text-gray-500"> Email commun : <strong>{compteInfo.email}</strong></p>
                <div><label className="block text-gray-900 mb-2">Mot de passe *</label><input type={showPassword ? "text" : "password"} name="password" value={compteInfo.password} onChange={handleCompteChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Minimum 6 caractères" required /></div>
                <div><label className="block text-gray-900 mb-2">Confirmer le mot de passe *</label><input type={showPassword ? "text" : "password"} name="confirmPassword" value={compteInfo.confirmPassword} onChange={handleCompteChange} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black" placeholder="Retapez votre mot de passe" required /></div>
                {compteInfo.password !== compteInfo.confirmPassword && compteInfo.confirmPassword && <p className="text-red-500 text-sm">Les mots de passe ne correspondent pas</p>}
              </>
            )}
            <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-800">Récapitulatif : Vous allez inscrire <strong>{enfants.length}</strong> enfant(s). Après validation, vous recevrez un email de confirmation pour chaque enfant.</p></div>
          </div>
        )}

        {/* Étape 5 - Services (Fournitures, Transport, Cantine) */}
        {step === 5 && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Services optionnels</h2>
                <p className="text-gray-500 text-sm">Vous pouvez choisir les services supplémentaires pour vos enfants</p>
              </div>
            </div>

            {/* Fournitures scolaires */}
            <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/30">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Fournitures scolaires</h3>
                  {!skipSupplies && totalFournitures > 0 && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {totalFournitures.toLocaleString()} GNF
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSkipSupplies(!skipSupplies); //  Toggle l'état
                    if (skipSupplies) {
                      // Réactiver - recharger les fournitures si nécessaire
                      if (supplies.length === 0 && !loadingSupplies) {
                        fetchSupplies();
                      }
                    } else {
                      // Désactiver - vider la sélection
                      setSupplies(supplies.map(s => ({ ...s, selectedQty: 0 })));
                    }
                  }}
                  className={`text-sm font-medium transition ${skipSupplies
                      ? "text-blue-600 hover:text-blue-800"
                      : "text-red-600 hover:text-red-800"
                    }`}
                >
                  {skipSupplies ? " Ajouter des fournitures" : "❌ Ignorer les fournitures"}
                </button>
              </div>

              {!skipSupplies ? (
                <>
                  {loadingSupplies ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-600">Chargement des fournitures...</span>
                    </div>
                  ) : suppliesError ? (
                    <div className="bg-yellow-50 p-4 rounded-lg text-center text-yellow-700">
                      <p>{suppliesError}</p>
                      <button
                        type="button"
                        onClick={fetchSupplies}
                        className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Réessayer
                      </button>
                    </div>
                  ) : supplies.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                      <p>Aucune fourniture disponible pour le moment.</p>
                      <p className="text-sm mt-1">Vous pourrez en acheter ultérieurement.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">Choisissez les fournitures pour vos enfants</p>
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {supplies.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border hover:shadow-md transition">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.nom}</p>
                              <p className="text-sm text-gray-800">{item.prix_unitaire.toLocaleString()} GNF</p>
                              <p className="text-xs text-gray-500">Stock: {item.quantite_stock}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSupplyChange(idx, -1);
                                }}
                                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                                disabled={item.selectedQty === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium text-lg">{item.selectedQty}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSupplyChange(idx, 1);
                                }}
                                className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
                                disabled={item.selectedQty >= item.quantite_stock}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {supplies.filter(s => s.selectedQty > 0).length > 0 && (
                        <div className="mt-4 text-right font-semibold text-blue-700">
                          Total fournitures : {totalFournitures.toLocaleString()} GNF
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  <p className="text-sm">✅ Vous avez choisi de ne pas commander de fournitures scolaires.</p>
                  <p className="text-xs mt-1">Vous pourrez en acheter ultérieurement.</p>
                </div>
              )}
            </div>

            {/* Transport scolaire - même correction */}
            <div className="border border-green-200 rounded-xl p-5 bg-green-50/30">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">Transport scolaire</h3>
                  {!skipTransport && totalTransport > 0 && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {totalTransport.toLocaleString()} GNF
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSkipTransport(!skipTransport); // Toggle l'état
                    if (skipTransport) {
                      // Réactiver
                      if (transportOptions.length === 0) fetchTransportOptions();
                    } else {
                      // Désactiver
                      setTransportOptions(transportOptions.map(t => ({ ...t, selected: false })));
                      setTotalTransport(0);
                    }
                  }}
                  className={`text-sm font-medium transition ${skipTransport
                      ? "text-green-600 hover:text-green-800"
                      : "text-red-600 hover:text-red-800"
                    }`}
                >
                  {skipTransport ? "Ajouter le transport" : "❌ Ignorer le transport"}
                </button>
              </div>

              {!skipTransport ? (
                <>
                  {loadingTransport ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                      <span className="ml-2 text-gray-600">Chargement des options de transport...</span>
                    </div>
                  ) : transportOptions.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                      <p>Aucune option de transport disponible pour le moment.</p>
                      <p className="text-sm mt-1">Vous pourrez vous inscrire plus tard.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">Sélectionnez le transport pour vos enfants</p>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {transportOptions.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border hover:shadow-md transition">
                            <div>
                              <p className="font-medium text-gray-800">{item.nom}</p>
                              {item.prix > 0 ? (
                                <p className="text-sm text-gray-500">{item.prix.toLocaleString()} GNF</p>
                              ) : (
                                <p className="text-sm text-gray-400">Prix non défini</p>
                              )}
                              {item.horaireMatin && item.horaireSoir && (
                                <p className="text-xs text-gray-500">
                                  Horaire : {item.horaireMatin} - {item.horaireSoir}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTransport(idx)}
                              disabled={item.prix <= 0}
                              className={`px-4 py-2 rounded-lg transition ${item.selected
                                  ? "bg-green-600 text-white hover:bg-green-700"
                                  : item.prix > 0
                                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                              {item.selected ? "✓ Sélectionné" : item.prix > 0 ? "Ajouter" : "Indisponible"}
                            </button>
                          </div>
                        ))}
                      </div>
                      {transportOptions.filter(t => t.selected).length > 0 && (
                        <div className="mt-4 text-right font-semibold text-green-700">
                          Total transport : {totalTransport.toLocaleString()} GNF
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  <p className="text-sm">✅ Vous avez choisi de ne pas utiliser le transport scolaire.</p>
                  <p className="text-xs mt-1">Vous pourrez vous inscrire plus tard.</p>
                </div>
              )}
            </div>

            {/* Cantine scolaire - même correction */}
            <div className="border border-orange-200 rounded-xl p-5 bg-orange-50/30">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-900">Cantine scolaire</h3>
                  {!skipCantine && totalCantine > 0 && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {totalCantine.toLocaleString()} GNF
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSkipCantine(!skipCantine); // Toggle l'état
                    if (skipCantine) {
                      // Réactiver
                      if (cantineOptions.length === 0) fetchCantineOptions();
                    } else {
                      // Désactiver
                      setCantineOptions(cantineOptions.map(c => ({ ...c, selected: false })));
                      setTotalCantine(0);
                    }
                  }}
                  className={`text-sm font-medium transition ${skipCantine
                      ? "text-orange-600 hover:text-orange-800"
                      : "text-red-600 hover:text-red-800"
                    }`}
                >
                  {skipCantine ? " Ajouter la cantine" : "❌ Ignorer la cantine"}
                </button>
              </div>

              {!skipCantine ? (
                <>
                  {loadingCantine ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                      <span className="ml-2 text-gray-600">Chargement des menus...</span>
                    </div>
                  ) : cantineOptions.length === 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                      <p>Aucun menu disponible pour le moment.</p>
                      <p className="text-sm mt-1">Vous pourrez vous inscrire plus tard.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-4">Sélectionnez la cantine pour vos enfants</p>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cantineOptions.map((item, idx) => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border hover:shadow-md transition">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.nom}</p>
                              {item.prix_annuel > 0 ? (
                                <p className="text-sm text-orange-600 font-semibold">{item.prix_annuel.toLocaleString()} GNF</p>
                              ) : (
                                <p className="text-sm text-gray-400">Prix non défini</p>
                              )}
                              {item.plat && (
                                <p className="text-xs text-gray-500">{item.plat}</p>
                              )}
                              {item.accompagnement && (
                                <p className="text-xs text-gray-400">+ {item.accompagnement}</p>
                              )}
                              {item.dessert && (
                                <p className="text-xs text-gray-400">{item.dessert}</p>
                              )}
                              {item.regime_special && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Régime spécial</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCantine(idx)}
                              disabled={item.prix_annuel <= 0}
                              className={`px-4 py-2 rounded-lg transition ${item.selected
                                  ? "bg-orange-600 text-white hover:bg-orange-700"
                                  : item.prix_annuel > 0
                                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                            >
                              {item.selected ? "✓ Sélectionné" : item.prix_annuel > 0 ? "Ajouter" : "Indisponible"}
                            </button>
                          </div>
                        ))}
                      </div>
                      {cantineOptions.filter(c => c.selected).length > 0 && (
                        <div className="mt-4 text-right font-semibold text-orange-700">
                          Total cantine (annuel) : {totalCantine.toLocaleString()} GNF
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  <p className="text-sm">✅ Vous avez choisi de ne pas utiliser la cantine scolaire.</p>
                  <p className="text-xs mt-1">Vous pourrez vous inscrire plus tard.</p>
                </div>
              )}
            </div>

            {/* Récapitulatif des services - inchangé mais corrigé */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">📊 Récapitulatif des coûts</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-900">Inscription scolaire</span>
                  <span className="font-semibold text-black">{totalInscription.toLocaleString()} GNF</span>
                </div>
                {!skipSupplies && totalFournitures > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-900">Fournitures</span>
                    <span className="font-semibold text-blue-700">{totalFournitures.toLocaleString()} GNF</span>
                  </div>
                )}
                {!skipTransport && totalTransport > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-900">Transport</span>
                    <span className="font-semibold text-green-700">{totalTransport.toLocaleString()} GNF</span>
                  </div>
                )}
                {!skipCantine && totalCantine > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-900">Cantine</span>
                    <span className="font-semibold text-orange-700">{totalCantine.toLocaleString()} GNF</span>
                  </div>
                )}
                <div className="border-t text-black pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-black text-lg">{getTotalGeneral().toLocaleString()} GNF</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t text-black">
          {step > (isParentLoggedIn ? 2 : 1) && (
            <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 border border-gray-900 rounded-lg hover:bg-gray-50 transition">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
          )}
          {step < 5 && (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ml-auto ${isStepValid() ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-900 cursor-not-allowed"}`}
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {step === 5 && (
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ml-auto ${!loading ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-300 text-gray-900 cursor-not-allowed"}`}
            >
              {loading ? (uploadProgress.total > 0 ? `Upload... ${uploadProgress.current}/${uploadProgress.total}` : "Envoi en cours...") : "Envoyer ma pré-inscription"}
              <GraduationCap className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
