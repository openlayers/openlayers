import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Style} from '../src/ol/style.js';
import {getBottomLeft, getHeight, getWidth} from '../src/ol/extent.js';
import {toContext} from '../src/ol/render.js';

const polygonFill = new Fill();
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
    context.globalCompositeOperation = 'destination-out';
    const renderContext = toContext(context, {
      pixelRatio: 1,
    });
    renderContext.setFillStrokeStyle(polygonFill);
    renderContext.drawGeometry(geometry);
    const bottomLeft = getBottomLeft(extent);
    // Fill transparent country with the flag image
    context.globalCompositeOperation = 'destination-over';
    const left = bottomLeft[0];
    const bottom = bottomLeft[1];
    context.drawImage(flag, 2, 12, 60, 40, left, bottom, width, height);
  },
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url:
      'https://openlayersbook.github.io/openlayers_book_samples/assets/data/countries.geojson',
    format: new GeoJSON(),
  }),
  style: style,
});

// Fill the canvas blue as clip mask for flag images
vectorLayer.on('prerender', function (event) {
  const context = event.context;
  context.globalCompositeOperation = 'source-over';
  context.fillStyle = 'rgb(152,293,253)';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
});

// Load country flags and set them as `flag` attribute on the country feature
vectorLayer.getSource().on('addfeature', function (event) {
  const feature = event.feature;
  const img = new Image();
  img.onload = function () {
    feature.set('flag', img);
  };
  img.src =
    'https://www.countryflags.io/' +
    feature.get('iso_a2').toLowerCase() +
    '/flat/64.png';
});

new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
  }),
});
