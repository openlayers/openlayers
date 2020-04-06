import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {Fill, Style, Text} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {getCenter} from '../src/ol/extent.js';

const style = new Style({
  text: new Text({
    font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new Fill({
      color: 'white',
    }),
  }),
});

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const viewExtent = [1817379, 6139595, 1827851, 6143616];
const map = new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url:
          'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
        maxZoom: 20,
      }),
    }),
    new VectorLayer({
      declutter: true,
      source: new VectorSource({
        format: new GeoJSON(),
        url: 'data/geojson/vienna-streets.geojson',
      }),
      style: function (feature) {
        style.getText().setText(feature.get('name'));
        return style;
      },
    }),
  ],
  target: 'map',
  view: new View({
    extent: viewExtent,
    center: getCenter(viewExtent),
    zoom: 17,
    minZoom: 14,
  }),
});
