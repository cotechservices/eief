// app/register/RegisterForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  User, Mail, Lock, Phone, Calendar, MapPin, Upload, CheckCircle,
  ArrowRight, ArrowLeft, GraduationCap, Plus, Trash2, Users, Eye, EyeOff,
  Loader2
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
  
  // Informations parent - pré-remplies si déjà connecté
  const [parentInfo, setParentInfo] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    profession: "",
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

  // Charger les classes depuis la base de données
  useEffect(() => {
    fetchClasses();
  }, []);

  // Pré-remplir les informations du parent si connecté
  useEffect(() => {
    if (isParentLoggedIn && session?.user) {
      setParentInfo({
        nom: (session.user as any).nom || "",
        prenom: (session.user as any).prenom || "",
        email: session.user.email || "",
        phone: (session.user as any).telephone || "",
        profession: "",
        adresse: (session.user as any).adresse || "",
        password: "",
        confirmPassword: "",
      });
      // Passer directement à l'étape 2 si le parent est connecté
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

  const handleParentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setParentInfo(prev => ({ ...prev, [name]: value }));
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
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
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

      // Remplacer la partie d'envoi des données
      const response = await fetch("/api/preinscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: isParentLoggedIn ? null : {
            nom: parentInfo.nom,
            prenom: parentInfo.prenom,
            email: parentInfo.email,
            phone: parentInfo.phone,
            profession: parentInfo.profession,
            adresse: parentInfo.adresse,
            password: parentInfo.password,
          },
          parentId: isParentLoggedIn ? (session?.user as any).parentId || (session?.user as any).id : null,
          enfants: enfantsAvecUrls,
        }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("preinscription", JSON.stringify({
          parentName: isParentLoggedIn ? `${(session?.user as any).prenom} ${(session?.user as any).nom}` : `${parentInfo.prenom} ${parentInfo.nom}`,
          enfantsCount: enfants.length,
          preinscriptions: data.preinscriptions
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
      return parentInfo.nom && parentInfo.prenom && parentInfo.email && parentInfo.phone;
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
      return isParentLoggedIn || (parentInfo.password && parentInfo.password === parentInfo.confirmPassword && parentInfo.password.length >= 6);
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
      {/* Progress Steps - Masquer l'étape 1 si parent déjà connecté */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {(isParentLoggedIn ? [2, 3, 4] : [1, 2, 3, 4]).map((s) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className="text-xs mt-1 text-gray-600 hidden md:block">
                {s === 1 && "Parent"}
                {s === 2 && "Enfant(s)"}
                {s === 3 && "Documents"}
                {s === 4 && "Validation"}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-1 bg-gray-300 rounded-full w-full"></div>
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: isParentLoggedIn ? `${((step - 2) / 2) * 100}%` : `${((step - 1) / 3) * 100}%` }}
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

        {/* Message pour parent connecté */}
        {isParentLoggedIn && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Vous êtes connecté en tant que parent. Vos informations seront utilisées automatiquement.
            </p>
          </div>
        )}

        {/* Étape 1 - Informations Parent (uniquement si non connecté) */}
        {!isParentLoggedIn && step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Informations du parent/tuteur</h2>
            </div>
            <p className="text-gray-600">Veuillez remplir vos informations personnelles</p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Nom *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="nom"
                    value={parentInfo.nom}
                    onChange={handleParentChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Prénom *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="prenom"
                    value={parentInfo.prenom}
                    onChange={handleParentChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Votre prénom"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={parentInfo.email}
                    onChange={handleParentChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Téléphone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={parentInfo.phone}
                    onChange={handleParentChange}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="+224 628 84 84 37"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Adresse</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="adresse"
                  value={parentInfo.adresse}
                  onChange={handleParentChange}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Votre adresse complète"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Profession</label>
              <input
                type="text"
                name="profession"
                value={parentInfo.profession}
                onChange={handleParentChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Votre profession"
              />
            </div>
          </div>
        )}

        {/* Étape 2 - Informations Enfant(s) */}
        {((!isParentLoggedIn && step === 2) || (isParentLoggedIn && step === 2)) && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Mes enfants</h2>
              </div>
              <button
                type="button"
                onClick={addEnfant}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-4 h-4" />
                Ajouter un enfant
              </button>
            </div>
            <p className="text-gray-600">Vous pouvez inscrire plusieurs enfants</p>
            <div className="flex flex-wrap gap-2 border-b">
              {enfants.map((enfant, idx) => (
                <div
                  key={enfant.id}
                  onClick={() => setActiveEnfantIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition cursor-pointer ${
                    activeEnfantIndex === idx
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>
                    {enfant.nom || enfant.prenom ? `${enfant.prenom || ""} ${enfant.nom || ""}` : `Enfant ${idx + 1}`}
                  </span>
                  {enfants.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEnfant(idx);
                      }}
                      className="ml-2 hover:text-red-500"
                      aria-label="Supprimer l'enfant"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {enfants.map((enfant, idx) => (
              <div key={enfant.id} className={activeEnfantIndex === idx ? "block" : "hidden"}>
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-800">Enfant {idx + 1}</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Nom de l'enfant *</label>
                    <input
                      type="text"
                      value={enfant.nom}
                      onChange={(e) => handleEnfantChange(idx, 'nom', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Nom"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Prénom de l'enfant *</label>
                    <input
                      type="text"
                      value={enfant.prenom}
                      onChange={(e) => handleEnfantChange(idx, 'prenom', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Prénom"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Date de naissance *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={enfant.dateNaissance}
                        onChange={(e) => handleEnfantChange(idx, 'dateNaissance', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Lieu de naissance</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={enfant.lieuNaissance}
                        onChange={(e) => handleEnfantChange(idx, 'lieuNaissance', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="Ville de naissance"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Sexe *</label>
                    <select
                      value={enfant.sexe}
                      onChange={(e) => handleEnfantChange(idx, 'sexe', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Niveau *</label>
                    <select
                      value={enfant.niveau}
                      onChange={(e) => handleEnfantChange(idx, 'niveau', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Sélectionner un niveau</option>
                      {niveauxOptions.map((niveau) => (
                        <option key={niveau} value={niveau}>
                          {niveau}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {enfant.niveau && (
                  <div className="mt-4">
                    <label className="block text-gray-700 mb-2">Classe *</label>
                    <select
                      value={enfant.classe}
                      onChange={(e) => handleEnfantChange(idx, 'classe', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Sélectionner une classe</option>
                      {getClassesForNiveau(enfant.niveau).map((classe) => (
                        <option key={classe.id} value={classe.nom}>
                          {classe.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Étape 3 - Documents */}
        {((!isParentLoggedIn && step === 3) || (isParentLoggedIn && step === 3)) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Documents requis</h2>
            </div>
            <p className="text-gray-600">Veuillez télécharger les documents pour chaque enfant</p>

            {enfants.map((enfant, idx) => (
              <div key={enfant.id} className="border rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-4">
                  {enfant.prenom || "Enfant"} {enfant.nom || ""} - Documents
                </h3>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="block text-gray-700 font-medium mb-2">Extrait d'acte de naissance *</label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      id={`acte_${idx}`}
                      onChange={(e) => handleFileChange(idx, 'acteNaissance', e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`acte_${idx}`)?.click()}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      Choisir un fichier
                    </button>
                    {enfant.acteNaissance && (
                      <p className="text-sm text-green-600 mt-2">✓ {enfant.acteNaissance.name}</p>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="block text-gray-700 font-medium mb-2">Photo d'identité *</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      className="hidden"
                      id={`photo_${idx}`}
                      onChange={(e) => handleFileChange(idx, 'photo', e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`photo_${idx}`)?.click()}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      Choisir un fichier
                    </button>
                    {enfant.photo && (
                      <p className="text-sm text-green-600 mt-2">✓ {enfant.photo.name}</p>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="block text-gray-700 font-medium mb-2">Bulletin (optionnel)</label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      id={`bulletin_${idx}`}
                      onChange={(e) => handleFileChange(idx, 'bulletin', e.target.files?.[0] || null)}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`bulletin_${idx}`)?.click()}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                    >
                      Choisir un fichier
                    </button>
                    {enfant.bulletin && (
                      <p className="text-sm text-green-600 mt-2">✓ {enfant.bulletin.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Étape 4 - Validation */}
        {((!isParentLoggedIn && step === 4) || (isParentLoggedIn && step === 4)) && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Confirmation</h2>
            </div>
            
            {!isParentLoggedIn && (
              <>
                <p className="text-gray-600">Créez un mot de passe pour accéder à la plateforme</p>
                <div>
                  <label className="block text-gray-700 mb-2">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={parentInfo.password}
                      onChange={handleParentChange}
                      className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Minimum 6 caractères"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Confirmer le mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={parentInfo.confirmPassword}
                      onChange={handleParentChange}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Retapez votre mot de passe"
                      required
                    />
                  </div>
                  {parentInfo.password !== parentInfo.confirmPassword && parentInfo.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>
              </>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                📌 Récapitulatif : Vous allez inscrire <strong>{enfants.length}</strong> enfant(s).<br />
                Après validation, vous recevrez un email de confirmation pour chaque enfant.
              </p>
            </div>
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t text-black">
          {step > (isParentLoggedIn ? 2 : 1) && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 px-6 py-2 border border-gray-400 rounded-lg hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
          {((!isParentLoggedIn && step < 4) || (isParentLoggedIn && step < 4)) && (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ml-auto ${
                isStepValid()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Suivant
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {((!isParentLoggedIn && step === 4) || (isParentLoggedIn && step === 4)) && (
            <button
              type="submit"
              disabled={!isStepValid() || loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition ml-auto ${
                isStepValid() && !loading
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
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