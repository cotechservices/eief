"use client";

import { useState, useEffect } from "react";
import { 
  Inbox, Send, Edit, Search, CheckCircle, Clock, Users, X, Paperclip, Check
} from "lucide-react";

interface Message {
  id: number;
  sujet: string;
  contenu: string;
  est_lu: boolean;
  date_envoi: string;
  expediteur_nom?: string;
  expediteur_email?: string;
  destinataire_nom?: string;
  destinataire_email?: string;
}

interface Utilisateur {
  id: number;
  prenom: string;
  nom: string;
  role: string;
  email: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const [formData, setFormData] = useState({
    destinataire_id: "",
    sujet: "",
    contenu: ""
  });

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?folder=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUtilisateurs = async () => {
    try {
      const res = await fetch('/api/utilisateurs');
      if (res.ok) {
        const data = await res.json();
        setUtilisateurs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  useEffect(() => {
    fetchUtilisateurs();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinataire_id: parseInt(formData.destinataire_id),
          sujet: formData.sujet,
          contenu: formData.contenu
        })
      });
      
      if (res.ok) {
        setShowMessageModal(false);
        setFormData({ destinataire_id: "", sujet: "", contenu: "" });
        if (activeTab === "sent") fetchMessages();
      } else {
        alert("Erreur lors de l'envoi");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setMessages(messages.map(m => m.id === id ? { ...m, est_lu: true } : m));
    } catch (e) {
      console.error(e);
    }
  };

  const openMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.est_lu && activeTab === "inbox") {
      markAsRead(msg.id);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 rounded-xl overflow-hidden shadow-sm text-black">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <button 
            onClick={() => { setSelectedMessage(null); setShowMessageModal(true); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Edit className="w-4 h-4" /> Nouveau message
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button 
            onClick={() => { setActiveTab("inbox"); setSelectedMessage(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${activeTab === "inbox" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800 hover:bg-gray-50"}`}
          >
            <Inbox className="w-4 h-4" /> Boîte de réception
          </button>
          <button 
            onClick={() => { setActiveTab("sent"); setSelectedMessage(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${activeTab === "sent" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800 hover:bg-gray-50"}`}
          >
            <Send className="w-4 h-4" /> Messages envoyés
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedMessage ? (
          <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b flex items-center gap-4">
              <button onClick={() => setSelectedMessage(null)} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">{selectedMessage.sujet}</h2>
            </div>
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">
                  {activeTab === "inbox" ? selectedMessage.expediteur_nom : `À: ${selectedMessage.destinataire_nom}`}
                </p>
                <p className="text-sm text-gray-500">
                  {activeTab === "inbox" ? selectedMessage.expediteur_email : selectedMessage.destinataire_email}
                </p>
              </div>
              <p className="text-sm text-gray-500">{new Date(selectedMessage.date_envoi).toLocaleString()}</p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto whitespace-pre-wrap text-gray-700">
              {selectedMessage.contenu}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <h2 className="text-lg font-bold capitalize text-black">{activeTab === "inbox" ? "Boîte de réception" : "Messages envoyés"}</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
                <input type="text" placeholder="Rechercher..." className="pl-9 pr-4 py-2 border border-gray-300 text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-800">Aucun message.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      onClick={() => openMessage(msg)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4 transition ${!msg.est_lu && activeTab === "inbox" ? "bg-blue-50/30" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className={`truncate text-sm ${!msg.est_lu && activeTab === "inbox" ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {activeTab === "inbox" ? msg.expediteur_nom : `À: ${msg.destinataire_nom}`}
                          </p>
                          <p className={`text-xs whitespace-nowrap ml-4 ${!msg.est_lu && activeTab === "inbox" ? "font-bold text-blue-600" : "text-gray-500"}`}>
                            {new Date(msg.date_envoi).toLocaleDateString()}
                          </p>
                        </div>
                        <p className={`text-sm truncate ${!msg.est_lu && activeTab === "inbox" ? "font-bold text-gray-800" : "text-gray-600"}`}>{msg.sujet}</p>
                        <p className="text-sm text-gray-900 truncate">{msg.contenu}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Nouveau Message */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Nouveau message</h2>
              <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="flex-1 flex flex-col p-6 overflow-hidden gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-900 w-24">À :</label>
                <select 
                  value={formData.destinataire_id} 
                  onChange={e => setFormData({...formData, destinataire_id: e.target.value})}
                  className="flex-1 px-3 py-2 border-b border-gray-200 text-gray-900 focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionner un destinataire...</option>
                  {utilisateurs.map(u => (
                    <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-900 w-24">Sujet :</label>
                <input 
                  type="text" 
                  value={formData.sujet}
                  onChange={e => setFormData({...formData, sujet: e.target.value})}
                  className="flex-1 px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex-1 relative mt-2">
                <textarea 
                  value={formData.contenu}
                  onChange={e => setFormData({...formData, contenu: e.target.value})}
                  className="w-full h-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Écrivez votre message ici..."
                  required
                />
              </div>
              <div className="pt-4 flex justify-between items-center">
                <button type="button" className="text-gray-900 hover:text-blue-600 p-2"><Paperclip className="w-5 h-5" /></button>
                <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-xl hover:bg-blue-800 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}