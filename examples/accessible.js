import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import OSM from '../src/ol/source/OSM.js';

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
    minZoom: 0,
    maxZoom: 28,
    constrainResolution: true
  }),
});

// Disable default mousewheel zoom behavior
map.getInteractions().forEach(function(interaction) {
  if (interaction.getKeys().includes('zoomByDelta')) {
    interaction.setActive(false);
  }
});

function setMapZoom(view, newZoom) {
  const minZoom = view.getMinZoom() || 0;
  const maxZoom = view.getMaxZoom() || 28;
  newZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
  
  if (newZoom !== view.getZoom()) {
    view.setZoom(newZoom);
  }
}

// Custom mousewheel zoom handler
map.on('wheel', function(evt) {
  evt.preventDefault();
  const view = map.getView();
  const delta = evt.originalEvent.deltaY > 0 ? -1 : 1;
  const currentZoom = view.getZoom();
  setMapZoom(view, Math.round(currentZoom + delta));
});

document.getElementById('zoom-out').onclick = function () {
  const view = map.getView();
  setMapZoom(view, view.getZoom() - 1);
};

document.getElementById('zoom-in').onclick = function () {
  const view = map.getView();
  setMapZoom(view, view.getZoom() + 1);
};

// Handle mousewheel/trackpad zoom
map.getView().on('change:resolution', function() {
  // Force discrete zoom levels
  const view = map.getView();
  const zoom = Math.round(view.getZoom());
  if (zoom !== view.getZoom()) {
    view.setZoom(zoom);
  }
});
