// app/dashboard/parent/messages/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  Inbox,
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
  Loader2
} from "lucide-react";

interface Message {
  id: number;
  sujet: string;
  contenu: string;
  date: string;
  lu: boolean;
  type: "recu" | "envoye";
  expediteur: string;
  expediteurRole: string;
  destinataire: string;
}

interface Destinataire {
  id: number;
  nom: string;
  role: string;
  poste: string;
}

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [destinataires, setDestinataires] = useState<Destinataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recus");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyMode, setReplyMode] = useState(false);
  const [sending, setSending] = useState(false);

  const [composeData, setComposeData] = useState({
    destinataire_id: "",
    sujet: "",
    contenu: ""
  });

  useEffect(() => {
    fetchMessages();
    fetchDestinataires();
  }, [activeTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/parent/messages?type=${activeTab}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinataires = async () => {
    try {
      const response = await fetch("/api/parent/destinataires");
      const data = await response.json();
      setDestinataires(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch("/api/parent/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setMessages(messages.map(m => m.id === id ? { ...m, lu: true } : m));
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!composeData.destinataire_id || !composeData.sujet || !composeData.contenu) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/parent/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeData)
      });

      if (response.ok) {
        alert("Message envoyé avec succès !");
        setShowCompose(false);
        setReplyMode(false);
        setComposeData({ destinataire_id: "", sujet: "", contenu: "" });
        if (activeTab === "envoye") fetchMessages();
      } else {
        alert("Erreur lors de l'envoi");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleReply = (message: Message) => {
    setReplyMode(true);
    setSelectedMessage(message);
    setComposeData({
      destinataire_id: "",
      sujet: `Re: ${message.sujet}`,
      contenu: ""
    });
    setShowCompose(true);
  };

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.lu && message.type === "recu") {
      markAsRead(message.id);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `il y a ${diff} secondes`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} heures`;
    return `il y a ${Math.floor(diff / 86400)} jours`;
  };

  const unreadCount = messages.filter(m => m.type === "recu" && !m.lu).length;

  const filteredMessages = messages.filter(m =>
    m.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.contenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.expediteur.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-900">Communication avec l'école et les enseignants</p>
        </div>
        <button
          onClick={() => { setShowCompose(true); setReplyMode(false); setSelectedMessage(null); setComposeData({ destinataire_id: "", sujet: "", contenu: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau message
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Messages reçus</p><p className="text-2xl font-bold text-blue-600">{messages.filter(m => m.type === "recu").length}</p></div>
            <Inbox className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Non lus</p><p className="text-2xl font-bold text-red-600">{unreadCount}</p></div>
            <AlertCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div><p className="text-gray-900 text-sm">Messages envoyés</p><p className="text-2xl font-bold text-green-600">{messages.filter(m => m.type === "envoye").length}</p></div>
            <Send className="w-8 h-8 text-green-200" />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b">
          <div className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab("recus")}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${activeTab === "recus" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-900 hover:text-gray-900"
                }`}
            >
              <Inbox className="w-4 h-4" />
              Reçus
              {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab("envoye")}
              className={`py-3 flex items-center gap-2 border-b-2 transition ${activeTab === "envoye" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-900 hover:text-gray-900"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-" />
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
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-900">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-900" />
            <p>Aucun message trouvé</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMessages.map((message) => (
              <div key={message.id} className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer" onClick={() => handleOpenMessage(message)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{activeTab === "recus" ? message.expediteur : message.destinataire}</p>
                        <p className="text-xs text-gray-900">{activeTab === "recus" ? message.expediteurRole : "Parent"}</p>
                      </div>
                      <p className="text-xs text-">{getTimeAgo(message.date)}</p>
                    </div>
                    <p className={`text-sm mt-1 ${!message.lu && activeTab === "recus" ? "font-bold text-gray-900" : "text-gray-900"}`}>{message.sujet}</p>
                    <p className="text-sm text-gray-900 line-clamp-2 mt-1">{message.contenu}</p>
                    {!message.lu && activeTab === "recus" && (
                      <div className="mt-2">
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Non lu</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Visualisation message */}
      {selectedMessage && !showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{selectedMessage.sujet}</h2>
              <button onClick={() => setSelectedMessage(null)} className="text- hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="font-medium text-gray-900">{selectedMessage.expediteur}</p>
                  <p className="text-sm text-gray-900">{selectedMessage.expediteurRole}</p>
                  <p className="text-xs text- mt-1">{new Date(selectedMessage.date).toLocaleString()}</p>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-900 whitespace-pre-line">{selectedMessage.contenu}</p>
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
              <h2 className="text-xl font-bold text-gray-900">{replyMode ? "Répondre" : "Nouveau message"}</h2>
              <button onClick={() => { setShowCompose(false); setReplyMode(false); }} className="text- hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Destinataire *</label>
                <select
                  value={composeData.destinataire_id}
                  onChange={(e) => setComposeData({ ...composeData, destinataire_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner un destinataire</option>
                  {destinataires.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom} ({d.role === "ENSEIGNANT" ? "Enseignant" : d.role})</option>
                  ))}
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
                  required
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
                  required
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowCompose(false); setReplyMode(false); }} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Annuler</button>
              <button onClick={handleSendMessage} disabled={sending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}