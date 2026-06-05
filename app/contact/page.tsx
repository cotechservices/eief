// app/contact/page.tsx
"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Send, ChevronRight } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    sujet: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici, vous pouvez ajouter la logique d'envoi du formulaire
    alert("Message envoyé ! Nous vous répondrons dans les plus brefs délais.");
    setFormData({ nom: "", email: "", sujet: "", message: "" });
  };

  const infos = [
    { icon: MapPin, title: "Adresse", text: "Conakry, Guinée, CU Coyah Sanoyah", link: null },
    { icon: Phone, title: "Téléphone", text: "+224 628 84 84 37", link: "tel:+224628848437" },
    { icon: Mail, title: "Email", text: "mohamedkc237@gmail.com", link: "mailto:mohamedkc237@gmail.com" },
    { icon: Clock, title: "Horaires", text: "Lun-Ven: 8h00 - 17h00 | Sam: 8h00 - 12h00", link: null },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <div className="relative h-[400px] mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        {/* Image de fond */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/img/contact.png"
            alt="École Internationale des Enfants Futur"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Contenu du Hero */}
        <div className="relative z-20 h-full flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Contactez-nous</h1>
              <p className="text-xl max-w-2xl">
                Nous sommes à votre écoute. N'hésitez pas à nous contacter.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="#mission"
                  className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                >
                  Découvrir notre mission
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Formulaire de contact */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-900 mb-2">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 text-black border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 text-black py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre mail"
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-2">Sujet *</label>
                <input
                  type="text"
                  required
                  value={formData.sujet}
                  onChange={(e) => setFormData({ ...formData, sujet: e.target.value })}
                  className="w-full px-4 text-black py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Motif"
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-2">Message *</label>
                <textarea
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 text-black py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Votre message"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                Envoyer <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Informations de contact */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations</h2>
            <div className="space-y-6">
              {infos.map((info, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <info.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{info.title}</h3>
                    {info.link ? (
                      <a href={info.link} className="text-gray-900 hover:text-blue-600">
                        {info.text}
                      </a>
                    ) : (
                      <p className="text-gray-900">{info.text}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Carte Google Maps */}
            <div className="mt-8">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.0!2d-13.0!3d9.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOjI3JzMwLjAiTiA4OjU3JzQwLjAiVw!5e0!3m2!1sfr!2sgn!4v1"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                className="rounded-lg shadow-md"
                title="Carte de l'école"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}