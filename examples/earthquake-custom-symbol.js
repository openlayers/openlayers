import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import {getBottomLeft, getTopRight} from '../src/ol/extent.js';
import KML from '../src/ol/format/KML.js';
import Polygon from '../src/ol/geom/Polygon.js';
import {DEVICE_PIXEL_RATIO} from '../src/ol/has.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import {toContext} from '../src/ol/render.js';
import StadiaMaps from '../src/ol/source/StadiaMaps.js';
import VectorSource from '../src/ol/source/Vector.js';
import Fill from '../src/ol/style/Fill.js';
import Icon from '../src/ol/style/Icon.js';
import Stroke from '../src/ol/style/Stroke.js';
import Style from '../src/ol/style/Style.js';

const getSymbolOutline = (function () {
  const path = [
    [0, 0],
    [4, 2],
    [6, 0],
    [10, 5],
    [6, 3],
    [4, 5],
    [0, 0],
  ];
  const symbolOutline = new Polygon([path]);
  symbolOutline.rotate(1.2, path[0]);
  return function (scale, offset) {
    const outline = symbolOutline.clone();
    outline.scale(scale, scale, path[0]);
    const origin = getBottomLeft(outline.getExtent());
    outline.translate(offset - origin[0], offset - origin[1]);
    return outline;
  };
})();

const styleCache = {};

const vector = new VectorLayer({
  source: new VectorSource({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false,
    }),
  }),
  style: function (feature) {
    const magnitude = feature.get('magnitude');
    let style = styleCache[magnitude];
    if (!style) {
      const scale = 1 + 4 * (magnitude - 5);
      const lineWidth = 2;
      const outline = getSymbolOutline(scale, Math.ceil(lineWidth / 2));
      const canvas = document.createElement('canvas');
      const vectorContext = toContext(canvas.getContext('2d'), {
        size: getTopRight(outline.getExtent()).map((n) =>
          Math.ceil(n + lineWidth / 2),
        ),
        pixelRatio: DEVICE_PIXEL_RATIO,
      });
      vectorContext.setStyle(
        new Style({
          fill: new Fill({color: 'rgba(255, 153, 0, 0.4)'}),
          stroke: new Stroke({
            color: 'rgba(255, 204, 0, 0.2)',
            width: 2,
          }),
        }),
      );
      vectorContext.drawGeometry(outline);
      style = new Style({
        image: new Icon({
          img: canvas,
          scale: 1 / DEVICE_PIXEL_RATIO,
        }),
      });
      styleCache[magnitude] = style;
    }
    return style;
  },
});
// 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
// standards-violating <magnitude> tag in each Placemark.  We extract it from
// the Placemark's name instead.
function parseMagnitudeFromName(name) {
  return parseFloat(name.substr(2));
}
vector.getSource().on('featuresloadend', function (evt) {
  evt.features.forEach((f) => {
    f.set('magnitude', parseMagnitudeFromName(f.get('name')), true);
  });
});

const raster = new TileLayer({
  source: new StadiaMaps({
    layer: 'stamen_toner',
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
