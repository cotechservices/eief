// app/dashboard/admin/parametres/page.tsx
"use client";

import { useState } from "react";
import { 
  Save, 
  Settings, 
  Mail, 
  Bell, 
  Shield, 
  School,
  Calendar,
  CreditCard,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trash2,
  Plus  
} from "lucide-react";

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // États des formulaires
  const [generalSettings, setGeneralSettings] = useState({
    nomEcole: "École Internationale des Enfants Futur",
    slogan: "L'excellence au service de l'avenir",
    email: "contact@eief.edu.gn",
    telephone: "+224 622 123 456",
    adresse: "Conakry, Guinée",
    logo: "/img/logo.jpg",
    anneeScolaire: "2025-2026",
    devise: "GNF"
  });

  const [anneeScolaire, setAnneeScolaire] = useState({
    actuelle: "2025-2026",
    debut: "2025-10-01",
    fin: "2026-06-30",
    prochaine: "2026-2027"
  });

  const [notifications, setNotifications] = useState({
    emailNouvelInscrit: true,
    emailPaiementRecu: true,
    emailAbsence: true,
    emailRappelPaiement: true,
    smsAlerte: false,
    notificationPush: true
  });

  const [securite, setSecurite] = useState({
    deuxFacteurs: false,
    expirationSession: 60,
    tentativesMax: 5,
    ipRestriction: false
  });

  const [frais, setFrais] = useState([
    { id: 1, type: "Inscription", montant: 300000, periodicite: "annuel" },
    { id: 2, type: "Mensualité", montant: 150000, periodicite: "mensuel" },
    { id: 3, type: "Cantine", montant: 100000, periodicite: "mensuel" },
    { id: 4, type: "Transport", montant: 80000, periodicite: "mensuel" }
  ]);

  // Fonction pour gérer les changements de frais
  const handleFraisChange = (id: number, newMontant: number) => {
    setFrais(frais.map(f => f.id === id ? { ...f, montant: newMontant } : f));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: "general", name: "Général", icon: Settings },
    { id: "ecole", name: "École", icon: School },
    { id: "annee", name: "Année scolaire", icon: Calendar },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "securite", name: "Sécurité", icon: Shield },
    { id: "frais", name: "Frais", icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
          <p className="text-gray-500">Configuration générale de l'application</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* Message de succès */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Paramètres enregistrés avec succès !
        </div>
      )}

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-3 border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Onglet Général */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Informations générales</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de l'école</label>
                <input type="text" value={generalSettings.nomEcole} onChange={(e) => setGeneralSettings({...generalSettings, nomEcole: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slogan</label>
                <input type="text" value={generalSettings.slogan} onChange={(e) => setGeneralSettings({...generalSettings, slogan: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email principal</label>
                <input type="email" value={generalSettings.email} onChange={(e) => setGeneralSettings({...generalSettings, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input type="tel" value={generalSettings.telephone} onChange={(e) => setGeneralSettings({...generalSettings, telephone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input type="text" value={generalSettings.adresse} onChange={(e) => setGeneralSettings({...generalSettings, adresse: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Onglet École */}
        {activeTab === "ecole" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Configuration de l'école</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Logo de l'école</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <School className="w-10 h-10 text-gray-400" />
                  </div>
                  <button className="px-3 py-2 border rounded-lg hover:bg-gray-50">Changer le logo</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Devise</label>
                <select value={generalSettings.devise} onChange={(e) => setGeneralSettings({...generalSettings, devise: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="GNF">Franc Guinéen (GNF)</option>
                  <option value="USD">Dollar US (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Année scolaire */}
        {activeTab === "annee" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Année scolaire</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Année actuelle</label>
                <select value={anneeScolaire.actuelle} onChange={(e) => setAnneeScolaire({...anneeScolaire, actuelle: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option>2024-2025</option>
                  <option>2025-2026</option>
                  <option>2026-2027</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de début</label>
                <input type="date" value={anneeScolaire.debut} onChange={(e) => setAnneeScolaire({...anneeScolaire, debut: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date de fin</label>
                <input type="date" value={anneeScolaire.fin} onChange={(e) => setAnneeScolaire({...anneeScolaire, fin: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prochaine année</label>
                <input type="text" value={anneeScolaire.prochaine} onChange={(e) => setAnneeScolaire({...anneeScolaire, prochaine: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                ⚠️ Le passage à la nouvelle année scolaire archivera automatiquement les données de l'année précédente.
              </p>
            </div>
          </div>
        )}

        {/* Onglet Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Configuration des notifications</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div><p className="font-medium">Email - Nouvel inscrit</p><p className="text-sm text-gray-500">Envoyer un email lors d'une nouvelle inscription</p></div>
                <button onClick={() => setNotifications({...notifications, emailNouvelInscrit: !notifications.emailNouvelInscrit})} className={`w-12 h-6 rounded-full transition ${notifications.emailNouvelInscrit ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition transform ${notifications.emailNouvelInscrit ? "translate-x-6" : "translate-x-1"}`}></div>
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div><p className="font-medium">Email - Paiement reçu</p><p className="text-sm text-gray-500">Confirmation de paiement aux parents</p></div>
                <button onClick={() => setNotifications({...notifications, emailPaiementRecu: !notifications.emailPaiementRecu})} className={`w-12 h-6 rounded-full transition ${notifications.emailPaiementRecu ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition transform ${notifications.emailPaiementRecu ? "translate-x-6" : "translate-x-1"}`}></div>
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div><p className="font-medium">Email - Absence signalée</p><p className="text-sm text-gray-500">Notifier les parents en cas d'absence</p></div>
                <button onClick={() => setNotifications({...notifications, emailAbsence: !notifications.emailAbsence})} className={`w-12 h-6 rounded-full transition ${notifications.emailAbsence ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition transform ${notifications.emailAbsence ? "translate-x-6" : "translate-x-1"}`}></div>
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div><p className="font-medium">SMS - Alertes</p><p className="text-sm text-gray-500">Envoyer des SMS pour les alertes urgentes</p></div>
                <button onClick={() => setNotifications({...notifications, smsAlerte: !notifications.smsAlerte})} className={`w-12 h-6 rounded-full transition ${notifications.smsAlerte ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition transform ${notifications.smsAlerte ? "translate-x-6" : "translate-x-1"}`}></div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Sécurité */}
        {activeTab === "securite" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Sécurité</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Expiration session (minutes)</label>
                <input type="number" value={securite.expirationSession} onChange={(e) => setSecurite({...securite, expirationSession: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tentatives de connexion max</label>
                <input type="number" value={securite.tentativesMax} onChange={(e) => setSecurite({...securite, tentativesMax: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="col-span-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <div><p className="font-medium">Authentification à deux facteurs (2FA)</p><p className="text-sm text-gray-500">Renforce la sécurité des comptes admin</p></div>
                  <button onClick={() => setSecurite({...securite, deuxFacteurs: !securite.deuxFacteurs})} className={`w-12 h-6 rounded-full transition ${securite.deuxFacteurs ? "bg-blue-600" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition transform ${securite.deuxFacteurs ? "translate-x-6" : "translate-x-1"}`}></div>
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">🔐 Mot de passe administrateur</p>
              <button className="mt-2 px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">Changer le mot de passe</button>
            </div>
          </div>
        )}

        {/* Onglet Frais - UNE SEULE FOIS CORRIGÉE */}
        {activeTab === "frais" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold border-b pb-2">Frais scolaires</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Type</th>
                    <th className="px-4 py-2 text-left text-sm">Montant (GNF)</th>
                    <th className="px-4 py-2 text-left text-sm">Périodicité</th>
                    <th className="px-4 py-2 text-left text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {frais.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="px-4 py-2">{f.type}</td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={f.montant} 
                          onChange={(e) => handleFraisChange(f.id, parseInt(e.target.value))}
                          className="w-32 px-2 py-1 border rounded" 
                        />
                      </td>
                      <td className="px-4 py-2 capitalize">{f.periodicite}</td>
                      <td className="px-4 py-2">
                        <button 
                          onClick={() => setFrais(frais.filter(item => item.id !== f.id))}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={() => {
                const newId = Math.max(...frais.map(f => f.id), 0) + 1;
                setFrais([...frais, { id: newId, type: "Nouveau frais", montant: 0, periodicite: "mensuel" }]);
              }}
              className="text-blue-600 text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Ajouter un frais
            </button>
          </div>
        )}
      </div>

      {/* Actions supplémentaires */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold">Sauvegarde</h3>
          <p className="text-sm text-gray-500 mb-3">Exporter la base de données</p>
          <button className="text-sm text-blue-600">Exporter →</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <RefreshCw className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold">Cache</h3>
          <p className="text-sm text-gray-500 mb-3">Vider le cache de l'application</p>
          <button className="text-sm text-blue-600">Vider le cache →</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="font-semibold">Données de test</h3>
          <p className="text-sm text-gray-500 mb-3">Supprimer les données fictives</p>
          <button className="text-sm text-blue-600">Nettoyer →</button>
        </div>
      </div>
    </div>
  );
}