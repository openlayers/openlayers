import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style} from '../src/ol/style.js';
import {getBottomLeft, getHeight, getWidth} from '../src/ol/extent.js';
import {toContext} from '../src/ol/render.js';

const fill = new Fill();
const stroke = new Stroke({
  color: 'rgba(255,255,255,0.8)',
  width: 2,
});
const style = new Style({
  renderer: function (pixelCoordinates, state) {
    const context = state.context;
    const geometry = state.geometry.clone();
    geometry.setCoordinates(pixelCoordinates);
    const extent = geometry.getExtent();
    const width = getWidth(extent);
    const height = getHeight(extent);
    const flag = state.feature.get('flag');
    if (!flag || height < 1 || width < 1) {
      return;
    }

    // Stitch out country shape from the blue canvas
    context.save();
    const renderContext = toContext(context, {
      pixelRatio: 1,
    });
    renderContext.setFillStrokeStyle(fill, stroke);
    renderContext.drawGeometry(geometry);
    context.clip();

    // Fill transparent country with the flag image
    const bottomLeft = getBottomLeft(extent);
    const left = bottomLeft[0];
    const bottom = bottomLeft[1];
    context.drawImage(flag, left, bottom, width, height);
    context.restore();
  },
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'https://openlayersbook.github.io/openlayers_book_samples/assets/data/countries.geojson',
    format: new GeoJSON(),
  }),
  style: style,
});

// Load country flags and set them as `flag` attribute on the country feature
vectorLayer.getSource().on('addfeature', function (event) {
  const feature = event.feature;
  const img = new Image();
  img.onload = function () {
    feature.set('flag', img);
  };
  img.src =
    'https://flagcdn.com/w320/' + feature.get('iso_a2').toLowerCase() + '.png';
});

new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
