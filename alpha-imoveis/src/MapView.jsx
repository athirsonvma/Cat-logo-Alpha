import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGoogleMaps, DARK_MAP_STYLE } from './maps.js';

export function GoogleMapView({ markers, height = 300, zoom = 12, onMarkerClick }) {
  const mapRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let mapMarkers = [];
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setError('Mapa não configurado (falta a chave do Google Maps).'); return; }

    const validMarkers = (markers || []).filter(m => m.lat && m.lng);
    if (validMarkers.length === 0) { setError('Nenhum imóvel com localização cadastrada ainda.'); return; }

    loadGoogleMaps(apiKey).then(google => {
      if (cancelled || !mapRef.current) return;
      setError('');
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: validMarkers[0].lat, lng: validMarkers[0].lng },
        zoom, disableDefaultUI: true, zoomControl: true, styles: DARK_MAP_STYLE,
      });
      const bounds = new google.maps.LatLngBounds();
      validMarkers.forEach(m => {
        const marker = new google.maps.Marker({
          position: { lat: m.lat, lng: m.lng }, map, title: m.label,
        });
        if (onMarkerClick) marker.addListener('click', () => onMarkerClick(m.id));
        bounds.extend(marker.getPosition());
        mapMarkers.push(marker);
      });
      if (validMarkers.length > 1) map.fitBounds(bounds);
    }).catch(() => { if (!cancelled) setError('Não foi possível carregar o mapa.'); });

    return () => { cancelled = true; mapMarkers.forEach(m => m.setMap(null)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers)]);

  if (error) {
    return (
      <div className="map-placeholder" style={{ height }}>
        <MapPin size={20} />
        <span>{error}</span>
      </div>
    );
  }
  return <div ref={mapRef} className="map-container" style={{ height }} />;
}
