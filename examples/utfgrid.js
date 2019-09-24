import Map from '../src/ol/Map.js';
import Overlay from '../src/ol/Overlay.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import UTFGrid from '../src/ol/source/UTFGrid.js';

const key = 'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2pzbmg0Nmk5MGF5NzQzbzRnbDNoeHJrbiJ9.7_-_gL8ur7ZtEiNwRfCy7Q';

const mapLayer = new TileLayer({
  source: new TileJSON({
    url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=' + key
  })
});


const gridSource = new UTFGrid({
  url: 'https://api.tiles.mapbox.com/v4/mapbox.geography-class.json?secure&access_token=' + key
});

const gridLayer = new TileLayer({source: gridSource});

const view = new View({
  center: [0, 0],
  zoom: 1
});

const mapElement = document.getElementById('map');
const map = new Map({
  layers: [mapLayer, gridLayer],
  target: mapElement,
  view: view
});

const infoElement = document.getElementById('country-info');
const flagElement = document.getElementById('country-flag');
const nameElement = document.getElementById('country-name');

const infoOverlay = new Overlay({
  element: infoElement,
  offset: [15, 15],
  stopEvent: false
});
map.addOverlay(infoOverlay);

const displayCountryInfo = function(coordinate) {
  const viewResolution = /** @type {number} */ (view.getResolution());
  gridSource.forDataAtCoordinateAndResolution(coordinate, viewResolution,
    function(data) {
      // If you want to use the template from the TileJSON,
      //  load the mustache.js library separately and call
      //  info.innerHTML = Mustache.render(gridSource.getTemplate(), data);
      mapElement.style.cursor = data ? 'pointer' : '';
      if (data) {
        flagElement.src = 'data:image/png;base64,' + data['flag_png'];
        nameElement.innerHTML = data['admin'];
      }
      infoOverlay.setPosition(data ? coordinate : undefined);
    });
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const coordinate = map.getEventCoordinate(evt.originalEvent);
  displayCountryInfo(coordinate);
});

map.on('click', function(evt) {
  displayCountryInfo(evt.coordinate);
});
