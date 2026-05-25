// app/dashboard/parent/messages/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  Archive, 
  Trash2, 
  Eye, 
  Reply, 
  Search, 
  Plus, 
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Paperclip,
  Smile
} from "lucide-react";

interface Message {
  id: number;
  expediteur: string;
  expediteurRole: string;
  expediteurAvatar: string;
  destinataire: string;
  sujet: string;
  contenu: string;
  date: string;
  lu: boolean;
  type: "recu" | "envoye";
  pieceJointe?: boolean;
}

interface Conversation {
  id: number;
  correspondant: string;
  correspondantRole: string;
  correspondantAvatar: string;
  dernierMessage: string;
  date: string;
  nonLu: number;
}

export default function ParentMessagesPage() {
  const [activeTab, setActiveTab] = useState("recus");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyMode, setReplyMode] = useState(false);

  // Conversations (pour la vue boîte de réception)
  const conversations: Conversation[] = [
    { id: 1, correspondant: "M. Camara", correspondantRole: "Enseignant Mathématiques", correspondantAvatar: "/avatars/teacher1.jpg", dernierMessage: "Bonjour, votre enfant a bien progressé ce trimestre...", date: "2025-05-24T10:30:00", nonLu: 2 },
    { id: 2, correspondant: "Mme Barry", correspondantRole: "Enseignant Français", correspondantAvatar: "/avatars/teacher2.jpg", dernierMessage: "N'oubliez pas la réunion parents-professeurs...", date: "2025-05-23T15:45:00", nonLu: 0 },
    { id: 3, correspondant: "Administration", correspondantRole: "Secrétariat", correspondantAvatar: "/avatars/admin.jpg", dernierMessage: "Les inscriptions sont ouvertes jusqu'au 30 juin...", date: "2025-05-22T09:00:00", nonLu: 0 },
    { id: 4, correspondant: "M. Konaté", correspondantRole: "Surveillant", correspondantAvatar: "/avatars/surveillant.jpg", dernierMessage: "Absence signalée pour votre enfant aujourd'hui...", date: "2025-05-21T08:15:00", nonLu: 0 },
  ];

  // Messages détaillés
  const messages: Message[] = [
    { id: 1, expediteur: "M. Camara", expediteurRole: "Enseignant Mathématiques", expediteurAvatar: "/avatars/teacher1.jpg", destinataire: "Mme Diallo", sujet: "Progression de votre enfant", contenu: "Bonjour Mme Diallo,\n\nJe souhaitais vous informer que votre enfant Ibrahim a fait d'excellents progrès en mathématiques ce trimestre. Sa moyenne est passée de 12 à 15/20. Félicitations à lui !\n\nN'hésitez pas à me contacter si vous avez des questions.\n\nCordialement,\nM. Camara", date: "2025-05-24T10:30:00", lu: false, type: "recu", pieceJointe: false },
    { id: 2, expediteur: "Mme Diallo", expediteurRole: "Parent", expediteurAvatar: "/avatars/parent.jpg", destinataire: "M. Camara", sujet: "Re: Progression de votre enfant", contenu: "Bonjour M. Camara,\n\nMerci beaucoup pour ces bonnes nouvelles ! Nous sommes très fiers d'Ibrahim.\n\nPouvez-vous nous conseiller des exercices supplémentaires pour l'aider à progresser davantage ?\n\nBien cordialement,\nMme Diallo", date: "2025-05-24T14:20:00", lu: true, type: "envoye", pieceJointe: false },
    { id: 3, expediteur: "Mme Barry", expediteurRole: "Enseignant Français", expediteurAvatar: "/avatars/teacher2.jpg", destinataire: "Mme Diallo", sujet: "Réunion parents-professeurs", contenu: "Madame,\n\nJe vous rappelle que la réunion parents-professeurs aura lieu le samedi 10 juin 2025 à 9h.\n\nAu programme :\n- Bilan du trimestre\n- Présentation des projets à venir\n- Échanges individuels\n\nMerci de confirmer votre présence.\n\nCordialement,\nMme Barry", date: "2025-05-23T15:45:00", lu: true, type: "recu", pieceJointe: true },
    { id: 4, expediteur: "Administration", expediteurRole: "Secrétariat", expediteurAvatar: "/avatars/admin.jpg", destinataire: "Mme Diallo", sujet: "Inscriptions 2025-2026", contenu: "Madame,\n\nLes inscriptions pour la nouvelle année scolaire sont désormais ouvertes.\n\nVeuillez vous rapprocher du secrétariat avant le 30 juin 2025 pour finaliser l'inscription de vos enfants.\n\nDocuments requis :\n- Extrait de naissance\n- Photos d'identité\n- Bulletin des 2 dernières années\n\nCordialement,\nLe secrétariat", date: "2025-05-22T09:00:00", lu: true, type: "recu", pieceJointe: false },
    { id: 5, expediteur: "Mme Diallo", expediteurRole: "Parent", expediteurAvatar: "/avatars/parent.jpg", destinataire: "Administration", sujet: "Question sur les frais", contenu: "Bonjour,\n\nJe souhaiterais connaître le montant total des frais de scolarité pour l'année 2025-2026 pour mes trois enfants.\n\nDans l'attente de votre retour,\n\nMme Diallo", date: "2025-05-21T11:00:00", lu: true, type: "envoye", pieceJointe: false },
  ];

  const [composeData, setComposeData] = useState({
    destinataire: "",
    sujet: "",
    contenu: ""
  });

  const filteredMessages = activeTab === "recus" 
    ? messages.filter(m => m.type === "recu")
    : messages.filter(m => m.type === "envoye");

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `il y a ${diff} secondes`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} heures`;
    return `il y a ${Math.floor(diff / 86400)} jours`;
  };

  const handleSendMessage = () => {
    console.log("Message envoyé:", composeData);
    setShowCompose(false);
    setComposeData({ destinataire: "", sujet: "", contenu: "" });
  };

  const handleReply = (message: Message) => {
    setReplyMode(true);
    setSelectedMessage(message);
    setComposeData({
      destinataire: message.expediteur,
      sujet: `Re: ${message.sujet}`,
      contenu: ""
    });
    setShowCompose(true);
  };

  const unreadCount = messages.filter(m => m.type === "recu" && !m.lu).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          <p className="text-gray-500">Communication avec l'école et les enseignants</p>
        </div>
        <button 
          onClick={() => { setShowCompose(true); setReplyMode(false); setSelectedMessage(null); setComposeData({ destinataire: "", sujet: "", contenu: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau message
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Messages reçus</p><p className="text-2xl font-bold text-blue-600">{messages.filter(m => m.type === "recu").length}</p></div>
            <MessageSquare className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Non lus</p><p className="text-2xl font-bold text-red-600">{unreadCount}</p></div>
            <AlertCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Messages envoyés</p><p className="text-2xl font-bold text-green-600">{messages.filter(m => m.type === "envoye").length}</p></div>
            <Send className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-500 text-sm">Réponse moyenne</p><p className="text-2xl font-bold text-purple-600">2.5h</p></div>
            <Clock className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b">
          <div className="flex gap-6 px-6">
            <button 
              onClick={() => setActiveTab("recus")}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === "recus" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Inbox className="w-4 h-4" />
              Reçus
              {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
            <button 
              onClick={() => setActiveTab("envoye")}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === "envoye" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Send className="w-4 h-4" />
              Envoyés
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Liste des messages */}
        <div className="divide-y">
          {filteredMessages.filter(m => m.sujet.toLowerCase().includes(searchTerm.toLowerCase()) || m.contenu.toLowerCase().includes(searchTerm.toLowerCase())).map((message) => (
            <div key={message.id} className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => setSelectedMessage(message)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{activeTab === "recus" ? message.expediteur : message.destinataire}</p>
                      <p className="text-xs text-gray-500">{activeTab === "recus" ? message.expediteurRole : "Parent"}</p>
                    </div>
                    <p className="text-xs text-gray-400">{getTimeAgo(message.date)}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1">{message.sujet}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{message.contenu}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {!message.lu && activeTab === "recus" && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Non lu</span>}
                    {message.pieceJointe && <span className="text-xs text-gray-400 flex items-center gap-1"><Paperclip className="w-3 h-3" /> Pièce jointe</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Visualisation message */}
      {selectedMessage && !showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{selectedMessage.sujet}</h2>
              <button onClick={() => setSelectedMessage(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="font-medium text-gray-800">{selectedMessage.expediteur}</p>
                  <p className="text-sm text-gray-500">{selectedMessage.expediteurRole}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(selectedMessage.date).toLocaleString()}</p>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{selectedMessage.contenu}</p>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => handleReply(selectedMessage)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Reply className="w-4 h-4" /> Répondre
              </button>
              <button onClick={() => setSelectedMessage(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau message / Réponse */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{replyMode ? "Répondre" : "Nouveau message"}</h2>
              <button onClick={() => { setShowCompose(false); setReplyMode(false); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Destinataire *</label>
                <select
                  value={composeData.destinatario}
                  onChange={(e) => setComposeData({ ...composeData, destinataire: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un destinataire</option>
                  <option value="M. Camara">M. Camara (Enseignant Mathématiques)</option>
                  <option value="Mme Barry">Mme Barry (Enseignant Français)</option>
                  <option value="Administration">Administration</option>
                  <option value="M. Konaté">M. Konaté (Surveillant)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sujet *</label>
                <input
                  type="text"
                  value={composeData.sujet}
                  onChange={(e) => setComposeData({ ...composeData, sujet: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sujet de votre message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message *</label>
                <textarea
                  rows={8}
                  value={composeData.contenu}
                  onChange={(e) => setComposeData({ ...composeData, contenu: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre message..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="text-gray-500 hover:text-gray-700 p-2 border rounded-lg"><Paperclip className="w-4 h-4" /> Joindre un fichier</button>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowCompose(false); setReplyMode(false); }} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handleSendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Send className="w-4 h-4" /> Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}