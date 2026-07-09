import { getPendingSyncItems } from "@/lib/offline/db";

/**
 * Fonction utilitaire pour récupérer des données en incluant les modifications
 * hors ligne non synchronisées. Permet d'avoir une UI optimiste et consistante
 * après rechargement de la page hors ligne.
 * 
 * @param url L'URL de l'API à interroger
 * @param arrayKey La clé dans l'objet de réponse qui contient le tableau de données (ex: "menus", "trajets")
 *                 Si vide, on suppose que la réponse est elle-même un tableau.
 */
export async function fetchWithOffline(url: string, arrayKey?: string) {
  // Appel classique (qui peut retourner le cache du SW si hors ligne)
  const response = await fetch(url);
  let data = await response.json();

  // Si on a spécifié une clé, on extrait le tableau (sinon on prend data si c'est un array)
  let itemsArray: any[] = arrayKey ? data[arrayKey] || [] : (Array.isArray(data) ? data : []);

  // Récupérer les mutations en attente pour cette API
  // On utilise l'URL de base (sans query string) pour récupérer toutes les mutations correspondantes
  const baseUrl = url.split('?')[0];
  const pendingMutations = await getPendingSyncItems(baseUrl);

  // Appliquer les mutations
  pendingMutations.forEach(mutation => {
    try {
      const bodyData = mutation.body ? JSON.parse(mutation.body) : {};
      
      switch (mutation.method) {
        case "POST":
          // Cas spécial: Sauvegarde en masse (ex: présences)
          if (bodyData.presences && Array.isArray(bodyData.presences)) {
            // Remplacer entièrement le tableau ou mettre à jour les éléments existants
            // Pour simplifier, on prend la dernière sauvegarde en masse
            itemsArray = bodyData.presences;
            break;
          }

          // Ajout optimiste standard, avec un ID temporaire
          const tempId = bodyData.id || Date.now();
          const newItem = { ...bodyData, id: tempId };
          // On évite les doublons si l'item a déjà été ajouté en local
          if (!itemsArray.some(item => item.id === tempId)) {
            itemsArray.push(newItem);
          }
          break;
        case "PUT":
          // Mise à jour optimiste
          if (bodyData.id) {
            itemsArray = itemsArray.map(item => 
              item.id === bodyData.id ? { ...item, ...bodyData } : item
            );
          }
          break;
        case "DELETE":
          // Suppression optimiste
          // L'ID peut être dans l'URL (?id=xxx)
          const urlParams = new URLSearchParams(mutation.url.split('?')[1]);
          const deleteId = parseInt(urlParams.get('id') || "0");
          if (deleteId) {
            itemsArray = itemsArray.filter(item => item.id !== deleteId);
          }
          break;
      }
    } catch (e) {
      console.warn("Erreur lors de l'application de la mutation hors ligne", e);
    }
  });

  // Reconstruire l'objet de retour
  if (arrayKey) {
    return { ...data, [arrayKey]: itemsArray };
  } else {
    return itemsArray;
  }
}
