// app/dashboard/enseignant/messages/page.tsx
"use client";

import { useState } from "react";
import { MessageSquare, Send, Inbox, Reply, Trash2, Eye, Plus, Search } from "lucide-react";
import Link from "next/link";

export default function EnseignantMessagesPage() {
  const [activeTab, setActiveTab] = useState("recus");
  const [showCompose, setShowCompose] = useState(false);

  const messages = [
    { id: 1, expediteur: "Mme Diallo", destinataire: "M. Camara", sujet: "Question sur devoir", message: "Mon enfant n'a pas compris l'exercice 3...", date: "2025-05-24", lu: false, type: "recu" },
    { id: 2, expediteur: "M. Camara", destinataire: "Mme Diallo", sujet: "Réunion parents", message: "La réunion aura lieu le...", date: "2025-05-23", lu: true, type: "envoye" },
    { id: 3, expediteur: "M. Konaté", destinataire: "M. Camara", sujet: "Absence", message: "Mon enfant est malade aujourd'hui...", date: "2025-05-22", lu: false, type: "recu" },
  ];

  const filteredMessages = messages.filter(m => activeTab === "recus" ? m.type === "recu" : m.type === "envoye");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold">Messages</h1><p className="text-gray-500">Communication avec les parents</p></div>
      <button onClick={() => setShowCompose(!showCompose)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Nouveau message</button></div>

      {showCompose && (<div className="bg-white rounded-xl shadow-sm p-6"><h3 className="text-lg font-semibold mb-4">Nouveau message</h3><div className="space-y-4"><div><label className="block text-sm mb-1">Destinataire</label><select className="w-full px-3 py-2 border rounded-lg"><option>Mme Diallo (Parent 5ème A)</option><option>M. Konaté (Parent 4ème A)</option></select></div>
      <div><label className="block text-sm mb-1">Sujet</label><input type="text" className="w-full px-3 py-2 border rounded-lg" /></div><div><label className="block text-sm mb-1">Message</label><textarea rows={5} className="w-full px-3 py-2 border rounded-lg"></textarea></div>
      <div className="flex justify-end gap-3"><button onClick={() => setShowCompose(false)} className="px-4 py-2 border rounded-lg">Annuler</button><button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Send className="w-4 h-4" />Envoyer</button></div></div></div>)}

      <div className="bg-white rounded-xl shadow-sm"><div className="border-b"><div className="flex gap-6 px-6"><button onClick={() => setActiveTab("recus")} className={`py-3 flex items-center gap-2 border-b-2 ${activeTab === "recus" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}><Inbox className="w-4 h-4" />Reçus</button>
      <button onClick={() => setActiveTab("envoye")} className={`py-3 flex items-center gap-2 border-b-2 ${activeTab === "envoye" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}><Send className="w-4 h-4" />Envoyés</button></div></div>
      <div className="divide-y">{filteredMessages.map((m) => (<div key={m.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center"><div><div className="flex items-center gap-2"><p className="font-medium">{activeTab === "recus" ? m.expediteur : m.destinataire}</p>{!m.lu && activeTab === "recus" && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}</div><p className="text-sm font-medium">{m.sujet}</p><p className="text-sm text-gray-500 line-clamp-1">{m.message}</p><p className="text-xs text-gray-900 mt-1">{m.date}</p></div>
      <div className="flex gap-2"><button className="text-blue-600"><Eye className="w-4 h-4" /></button><button className="text-green-600"><Reply className="w-4 h-4" /></button><button className="text-red-600"><Trash2 className="w-4 h-4" /></button></div></div>))}</div></div>
    </div>
  );
}