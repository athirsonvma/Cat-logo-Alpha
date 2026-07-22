let loadPromise = null;

export function loadGoogleMaps(apiKey) {
  if (window.google && window.google.maps) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

// Estilo escuro discreto (dourado/grafite) pra combinar com o resto do app.
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#17181b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#17181b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8c8e93' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2b2f' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2b2f' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#6e7075' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#34363b' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0e10' }] },
];
