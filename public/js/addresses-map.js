// public/js/addresses-map.js
// Map initialization and management for addresses

const addresses = [
  { name: 'вул. Перемоги, 32', lat: 50.2616744659701, lng: 28.65277517582748 },
  { name: 'вул. В. Бердичівська, 47', lat: 50.24970515107149, lng: 28.67541861842445 },
  { name: 'вул. В. Бердичівська, 59', lat: 50.24922745210505, lng: 28.677847218419572 },
  { name: 'вул. Бориса Тена, 143', lat: 50.26389938138799, lng: 28.700756793298257 },
  { name: 'вул. Перемоги, 52', lat: 50.264652760428994, lng: 28.649536118056474 },
  { name: 'вул. Князів Острозьких, 61', lat: 50.25962984758344, lng: 28.676616948043296 }
];

let map = null;
let googleMap = null;
let markers = [];
let googleMarkers = [];

function initMap() {
  // Initialize Leaflet map centered on Zhytomyr
  map = L.map('addressesMap').setView([50.2639, 28.6598], 14);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Add markers for each address
  addresses.forEach((address, index) => {
    const marker = L.circleMarker([address.lat, address.lng], {
      radius: 8,
      fillColor: '#007bff',
      color: '#0056b3',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);

    // Add popup
    marker.bindPopup(`<strong>${address.name}</strong>`, { closeButton: true });

    // Store reference
    marker.addressIndex = index;
    markers.push(marker);

    // Click handler
    marker.on('click', function() {
      highlightAddress(index);
    });
  });

  // Add click handlers to address links
  document.querySelectorAll('.address-link').forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      highlightAddress(index);
    });
  });
}

function highlightAddress(index) {
  if (index < 0 || index >= addresses.length) return;

  const address = addresses[index];

  // Reset all Leaflet markers
  markers.forEach((marker, i) => {
    if (i === index) {
      marker.setStyle({
        fillColor: '#28a745',
        color: '#1e7e34',
        weight: 3,
        radius: 10,
        fillOpacity: 1
      });
      marker.openPopup();
    } else {
      marker.setStyle({
        fillColor: '#007bff',
        color: '#0056b3',
        weight: 2,
        radius: 8,
        fillOpacity: 0.8
      });
      marker.closePopup();
    }
  });

  // Reset all Google markers
  googleMarkers.forEach((marker, i) => {
    if (i === index) {
      marker.setIcon(google.maps.marker.PinElement({
        background: '#28a745',
        borderColor: '#1e7e34',
        glyphColor: '#fff'
      }).element);
    } else {
      marker.setIcon(google.maps.marker.PinElement({
        background: '#007bff',
        borderColor: '#0056b3',
        glyphColor: '#fff'
      }).element);
    }
  });

  // Zoom Leaflet map
  if (map) {
    map.flyTo([address.lat, address.lng], 16, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }

  // Zoom Google map
  if (googleMap) {
    googleMap.panTo({ lat: address.lat, lng: address.lng });
    googleMap.setZoom(16);
  }

  // Highlight address link
  document.querySelectorAll('.address-link').forEach((link, i) => {
    if (i === index) {
      link.style.color = '#28a745';
      link.style.fontWeight = 'bold';
    } else {
      link.style.color = '';
      link.style.fontWeight = '';
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('addressesMap')) {
    // Load Leaflet library
    const leafletLink = document.createElement('link');
    leafletLink.rel = 'stylesheet';
    leafletLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(leafletLink);

    const leafletScript = document.createElement('script');
    leafletScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    leafletScript.onload = initMap;
    document.head.appendChild(leafletScript);
  }

  // Load Google Maps API
  if (document.getElementById('googleMap')) {
    const googleScript = document.createElement('script');
    googleScript.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDswZJZLobfCmkt6OS-g_PezzQPc-h1QrA';
    googleScript.onload = initGoogleMap;
    document.head.appendChild(googleScript);
  }
});

function initGoogleMap() {
  const center = { lat: 50.2639, lng: 28.6598 };
  
  googleMap = new google.maps.Map(document.getElementById('googleMap'), {
    zoom: 14,
    center: center
  });

  // Add markers for each address
  addresses.forEach((address, index) => {
    const marker = new google.maps.Marker({
      position: { lat: address.lat, lng: address.lng },
      map: googleMap,
      title: address.name
    });

    // Add click handler
    marker.addListener('click', () => {
      highlightAddress(index);
    });

    googleMarkers.push(marker);
  });
}
