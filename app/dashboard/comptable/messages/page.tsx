// app/dashboard/admin/messages/page.tsx
"use client";

import { useState } from "react";
import { MessageSquare, Send, Inbox, Archive, Trash2, Eye, Reply, Search, Plus, Users, Bell } from "lucide-react";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("recus");

  const messages = [
    { id: 1, expediteur: "Mme Diallo", destinataire: "Admin", sujet: "Question sur inscription", message: "Bonjour, je souhaite savoir si...", date: "2025-05-21", lu: false, type: "recu" },
    { id: 2, expediteur: "Admin", destinataire: "M. Camara", sujet: "Réunion parents", message: "La réunion aura lieu le...", date: "2025-05-20", lu: true, type: "envoye" },
    { id: 3, expediteur: "M. Konaté", destinataire: "Admin", sujet: "Absence enfant", message: "Mon enfant est malade...", date: "2025-05-19", lu: false, type: "recu" },
  ];

  const filteredMessages = messages.filter(m => activeTab === "recus" ? m.type === "recu" : m.type === "envoye");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Messages</h1><p className="text-gray-900">Communication avec les parents</p></div><button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Nouveau message</button></div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b"><div className="flex gap-6 px-6"><button onClick={() => setActiveTab("recus")} className={`py-3 flex items-center gap-2 border-b-2 transition ${activeTab === "recus" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-900"}`}><Inbox className="w-4 h-4" />Reçus <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">2</span></button><button onClick={() => setActiveTab("envoye")} className={`py-3 flex items-center gap-2 border-b-2 transition ${activeTab === "envoye" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-900"}`}><Send className="w-4 h-4" />Envoyés</button></div></div>

        <div className="divide-y">{filteredMessages.map((m) => (<div key={m.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center"><div><div className="flex items-center gap-2"><p className="font-medium">{activeTab === "recus" ? m.expediteur : m.destinataire}</p>{!m.lu && activeTab === "recus" && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}</div><p className="text-sm font-medium">{m.sujet}</p><p className="text-sm text-gray-900">{m.message.substring(0, 60)}...</p><p className="text-xs text-gray-900 mt-1">{m.date}</p></div><div className="flex gap-2"><button className="text-blue-600"><Eye className="w-4 h-4" /></button><button className="text-green-600"><Reply className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></div></div>))}</div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center"><p className="text-sm text-gray-900">{filteredMessages.length} messages</p><button className="text-blue-600 text-sm hover:underline">Voir tous</button></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200"><h3 className="font-semibold text-blue-800 flex items-center gap-2"><Bell className="w-5 h-5" />Messages non lus</h3><p className="text-blue-700 text-sm mb-4">Vous avez 2 messages non lus</p><button className="text-blue-800 text-sm font-medium">Lire maintenant →</button></div>
        <div className="bg-green-50 rounded-xl p-6 border border-green-200"><h3 className="font-semibold text-green-800 flex items-center gap-2"><Users className="w-5 h-5" />Envoyer à tous les parents</h3><p className="text-green-700 text-sm mb-4">Communiquer avec toutes les familles</p><button className="text-green-800 text-sm font-medium">Composer →</button></div>
      </div>
    </div>
  );
}