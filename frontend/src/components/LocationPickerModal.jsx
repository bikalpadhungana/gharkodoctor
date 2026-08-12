import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { MapPin, Navigation, Search, Check, X, Loader2 } from 'lucide-react';

// Fix Leaflet default icon path bug in React bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const LocationPickerModal = ({ isOpen, onClose, onSelectLocation }) => {
  const { lang } = useAuth();
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const markerRef = useRef(null);

  // Initial center: Kathmandu (27.7172, 85.3240)
  const [coords, setCoords] = useState({ lat: 27.7172, lng: 85.3240 });
  const [addressDetails, setAddressDetails] = useState({
    address: 'काठमाडौं',
    ward: '',
    municipality: 'काठमाडौं (Kathmandu)'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure DOM element is ready
    const timer = setTimeout(() => {
      if (mapRef.current && !leafletInstance.current) {
        const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        const marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map);

        marker.on('dragend', function (e) {
          const newPos = e.target.getLatLng();
          setCoords({ lat: newPos.lat, lng: newPos.lng });
          reverseGeocode(newPos.lat, newPos.lng);
        });

        map.on('click', function (e) {
          marker.setLatLng(e.latlng);
          setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        leafletInstance.current = map;
        markerRef.current = marker;

        // Fetch initial reverse geocode
        reverseGeocode(coords.lat, coords.lng);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [isOpen]);

  const reverseGeocode = async (lat, lng) => {
    try {
      setLoadingGeo(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();

      if (data && data.address) {
        const addr = data.address;

        const street = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.village || data.display_name.split(',')[0];
        const municipalityName = addr.city || addr.town || addr.municipality || addr.county || 'काठमाडौं';

        // Extract Ward number if present in address text (e.g. "Ward 4")
        let extractedWard = '';
        const match = data.display_name.match(/ward\s*(\d+)/i) || data.display_name.match(/वडा\s*(\d+)/i);
        if (match) {
          extractedWard = match[1];
        }

        setAddressDetails({
          address: street || data.display_name,
          ward: extractedWard,
          municipality: municipalityName
        });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(lang === 'ne' ? 'तपाईंको ब्राउजरमा GPS सपोर्ट छैन' : 'Geolocation is not supported by your browser');
      return;
    }

    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        if (leafletInstance.current && markerRef.current) {
          leafletInstance.current.setView([latitude, longitude], 16);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setLoadingGeo(false);
        alert(lang === 'ne' ? 'स्थान प्राप्त गर्न सकिएन' : 'Could not fetch current location');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSearchLocation = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Nepal')}&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setCoords({ lat: latitude, lng: longitude });

        if (leafletInstance.current && markerRef.current) {
          leafletInstance.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
        }

        reverseGeocode(latitude, longitude);
      } else {
        alert(lang === 'ne' ? 'स्थान फेला परेन' : 'Location not found');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation({
      address: addressDetails.address,
      ward: addressDetails.ward,
      municipality: addressDetails.municipality,
      lat: coords.lat,
      lng: coords.lng
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {lang === 'ne' ? 'नक्सामा ठेगाना छान्नुहोस्' : 'Select Location on Map'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search & GPS Controls */}
        <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <form onSubmit={handleSearchLocation} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              placeholder={lang === 'ne' ? 'स्थान खोज्नुहोस् (उदा: बालुवाटार, पाटन)' : 'Search place (e.g. Baluwatar, Patan)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={searching} style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}>
              <Search size={16} />
            </button>
          </form>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="btn btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'white' }}
          >
            <Navigation size={14} color="var(--primary)" />
            <span>{lang === 'ne' ? '📍 मेरो वर्तमान GPS स्थान प्रयोग गर्नुहोस्' : '📍 Use My Current GPS Location'}</span>
          </button>
        </div>

        {/* Leaflet Map Canvas */}
        <div style={{ position: 'relative', height: '280px', width: '100%' }}>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

          {loadingGeo && (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1000, boxShadow: 'var(--shadow-sm)' }}>
              <Loader2 size={14} className="animate-spin" />
              <span>{lang === 'ne' ? 'ठेगाना खोजिँदैछ...' : 'Detecting address...'}</span>
            </div>
          )}
        </div>

        {/* Selected Address Preview & Confirmation */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>
              {lang === 'ne' ? 'छानिएको स्थान:' : 'Selected Location:'}
            </span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {addressDetails.address}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {addressDetails.municipality} {addressDetails.ward ? `| वडा नं ${addressDetails.ward}` : ''}
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{ padding: '12px', fontSize: '0.95rem', fontWeight: 800 }}
          >
            <Check size={18} />
            <span>{lang === 'ne' ? 'यो स्थान पुष्टि गर्नुहोस्' : 'Confirm Selected Location'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
