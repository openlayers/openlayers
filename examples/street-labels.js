import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getCenter} from '../src/ol/extent.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import ImageTile from '../src/ol/source/ImageTile.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Style from '../src/ol/style/Style.js';
import Text from '../src/ol/style/Text.js';

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
      source: new ImageTile({
        attributions: attributions,
        url:
          'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=' + key,
        tileSize: 512,
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
