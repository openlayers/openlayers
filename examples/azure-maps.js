import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import {useGeographic} from 'ol/proj.js';
import ImageTile from 'ol/source/ImageTile.js';

useGeographic();

const someTilesetId = [
  'microsoft.imagery',
  'microsoft.base.road',
  'microsoft.base.darkgrey',
];

const baseUrl =
  'https://atlas.microsoft.com/map/tile?zoom={z}&x={x}&y={y}&tileSize=256&language=EN&&api-version=2.0';

let subscriptionKey, currentLayer, map;

document.getElementById('auth-form').addEventListener('submit', (event) => {
  event.preventDefault();
  subscriptionKey = document.getElementById('secret').value.trim();

  map = new Map({
    target: 'map',
    view: new View({
      center: [2.35, 48.85],
      zoom: 12,
    }),
  });
  document.getElementById('auth-interface').style.display = 'none';
  document.getElementById('map-container').style.display = 'block';

  // Add behavior to the tileset buttons
  document.querySelectorAll('.layer-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateLayer(Number(btn.value));
    });
  });

  updateLayer(0);
});

function updateLayer(index) {
  currentLayer = new TileLayer({
    source: new ImageTile({
      url: `${baseUrl}&subscription-key=${subscriptionKey}&tilesetId=${someTilesetId[index]}`,
      crossOrigin: 'anonymous',
      attributions: `© ${new Date().getFullYear()} TomTom, Microsoft`,
    }),
  });

  map.addLayer(currentLayer);

  // Remove previous layers after the map has rendered
  map.once('rendercomplete', () => {
    for (const layer of map.getLayers().getArray()) {
      if (layer === currentLayer) {
        break; // Skip the newly added layer
      }
      map.removeLayer(layer);
    }
  });

  // Update state of the tileset buttons
  document.querySelectorAll('.layer-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.value == index);
  });
}
