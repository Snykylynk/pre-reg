import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Add CSS for pulsating animation
const pulsatingStyle = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(2);
      opacity: 0.5;
    }
    100% {
      transform: scale(3);
      opacity: 0;
    }
  }
  .pulsating-marker {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
  }
  .leaflet-marker-icon.pulsating-marker {
    margin-left: -10px !important;
    margin-top: -10px !important;
  }
  .pulsating-marker .pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background-color: rgba(255, 215, 0, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
  }
  .pulsating-marker .pulse-ring:nth-child(2) {
    animation-delay: 0.5s;
  }
  .pulsating-marker .pulse-ring:nth-child(3) {
    animation-delay: 1s;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = pulsatingStyle
  if (!document.head.querySelector('style[data-pulsating-marker]')) {
    styleElement.setAttribute('data-pulsating-marker', 'true')
    document.head.appendChild(styleElement)
  }
}

export default function MapBackground() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map centered on Sandton
    // Coordinates: Sandton, South Africa
    const sandtonLat = -26.1076
    const sandtonLng = 28.0567

    const map = L.map(mapRef.current, {
      center: [sandtonLat, sandtonLng],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    })

    // Add dark OpenStreetMap tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Fit bounds to include all specified areas
    // Pretoria, Centurion, Waterfall, Sandton, Randburg, Bryanston
    // Coordinates for all areas:
    // Pretoria: -25.7479, 28.2293 (northernmost, easternmost)
    // Centurion: -25.8606, 28.1894
    // Waterfall: -26.0167, 28.0833
    // Sandton: -26.1076, 28.0567 (southernmost)
    // Randburg: -26.0936, 28.0014 (westernmost)
    // Bryanston: -26.0500, 28.0167
    const bounds = L.latLngBounds(
      [-26.1076, 28.0014], // Southwest (Sandton south, Randburg west)
      [-25.7479, 28.2293]  // Northeast (Pretoria north, Pretoria east)
    )
    
    // Adjust to ensure all areas are visible with padding
    map.fitBounds(bounds, {
      padding: [100, 100],
    })

    // Wait for map to finish loading and bounds to be applied before adding markers
    map.whenReady(() => {
      // Add a small delay to ensure bounds are fully applied
      setTimeout(() => {
        // Add pulsating markers for each location
        const places = [
          { name: 'Pretoria', lat: -25.7479, lng: 28.2293 },
          { name: 'Centurion', lat: -25.8606, lng: 28.1894 },
          { name: 'Waterfall', lat: -26.0167, lng: 28.0833 },
          { name: 'SANDTON', lat: -26.1076, lng: 28.0567 },
          { name: 'Randburg', lat: -26.0936, lng: 28.0014 },
          { name: 'Bryanston', lat: -26.0500, lng: 28.0167 },
        ]

        places.forEach((place) => {
          // Create pulsating marker icon
          const markerIcon = L.divIcon({
            className: 'pulsating-marker',
            html: `
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          // Add marker
          L.marker([place.lat, place.lng], { icon: markerIcon }).addTo(map)
        })
      }, 100)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 w-full h-full z-0"
      style={{ filter: 'brightness(0.7)' }}
    />
  )
}

