import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import {useGeographic} from 'ol/proj.js';
import ImageTile from 'ol/source/ImageTile.js';

useGeographic();

const sometilesetId = [
  'microsoft.imagery',
  'microsoft.base.road',
  'microsoft.base.darkgrey',
];

const baseurl = 'https://atlas.microsoft.com/map/tile?subscription-key=';
const mideurl = '&api-version=2.0&tilesetId=';
const endurl = '&zoom={z}&x={x}&y={y}&tileSize=256&language=EN';

let clientSecret = '';
let map = null;
let currentLayer = null;

document.getElementById('auth-form').addEventListener('submit', (event) => {
  event.preventDefault();
  clientSecret = document.getElementById('secret').value.trim();

  if (!clientSecret) {
    alert('Please enter a valid key');
    return;
  }

  document.getElementById('auth-interface').style.display = 'none';

  if (map) {
    map.setTarget(undefined);
    map = null;
  }

  map = new Map({
    target: 'map',
    view: new View({
      center: [2.35, 48.85],
      zoom: 12,
    }),
  });

  document.getElementById('map-container').style.display = 'block';
  updateLayer(0);
});

function updateLayer(index) {
  if (!map) {
    return;
  }

  const newLayer = new TileLayer({
    source: new ImageTile({
      url: baseurl + clientSecret + mideurl + sometilesetId[index] + endurl,
      crossOrigin: 'anonymous',
      attributions: `© ${new Date().getFullYear()} TomTom, Microsoft`,
    }),
    opacity: 0,
  });

  map.addLayer(newLayer);

  // Animation de fondu
  const animateFade = () => {
    const opacity = newLayer.getOpacity() + 0.05;
    newLayer.setOpacity(opacity);

    if (opacity < 1) {
      requestAnimationFrame(animateFade);
    } else {
      if (currentLayer) {
        map.removeLayer(currentLayer);
      }
      currentLayer = newLayer;
    }
  };

  requestAnimationFrame(animateFade);

  // Mettre à jour les boutons
  document.querySelectorAll('.layer-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.value == index);
  });
}

// Gestion des boutons
document.querySelectorAll('.layer-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (clientSecret) {
      updateLayer(parseInt(btn.value));
    }
  });
});
