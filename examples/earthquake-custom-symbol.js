import KML from '../src/ol/format/KML.js';
import Map from '../src/ol/Map.js';
import Polygon from '../src/ol/geom/Polygon.js';
import Stamen from '../src/ol/source/Stamen.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Icon, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {toContext} from '../src/ol/render.js';

const symbol = [
  [0, 0],
  [4, 2],
  [6, 0],
  [10, 5],
  [6, 3],
  [4, 5],
  [0, 0],
];
let scale;
const scaleFunction = function (coordinate) {
  return [coordinate[0] * scale, coordinate[1] * scale];
};

const styleCache = {};
const styleFunction = function (feature) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  const name = feature.get('name');
  const magnitude = parseFloat(name.substr(2));
  const size = parseInt(10 + 40 * (magnitude - 5), 10);
  scale = size / 10;
  let style = styleCache[size];
  if (!style) {
    const canvas = document.createElement('canvas');
    const vectorContext = toContext(canvas.getContext('2d'), {
      size: [size, size],
      pixelRatio: 1,
    });
    vectorContext.setStyle(
      new Style({
        fill: new Fill({color: 'rgba(255, 153, 0, 0.4)'}),
        stroke: new Stroke({color: 'rgba(255, 204, 0, 0.2)', width: 2}),
      })
    );
    vectorContext.drawGeometry(new Polygon([symbol.map(scaleFunction)]));
    style = new Style({
      image: new Icon({
        img: canvas,
        imgSize: [size, size],
        rotation: 1.2,
      }),
    });
    styleCache[size] = style;
  }
  return style;
};

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
  style: styleFunction,
});

const raster = new TileLayer({
  source: new Stamen({
    layer: 'toner',
  }),
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
