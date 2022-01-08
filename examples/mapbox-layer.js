import GeoJSON from '../src/ol/format/GeoJSON.js';
import HeatmapLayer from '../src/ol/layer/Heatmap.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import Source from '../src/ol/source/Source.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {fromLonLat, toLonLat} from '../src/ol/proj.js';

const center = [-98.8, 37.9];
const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';

const mbMap = new mapboxgl.Map({
  style: 'https://api.maptiler.com/maps/bright/style.json?key=' + key,
  attributionControl: false,
  boxZoom: false,
  center: center,
  container: 'map',
  doubleClickZoom: false,
  dragPan: false,
  dragRotate: false,
  interactive: false,
  keyboard: false,
  pitchWithRotate: false,
  scrollZoom: false,
  touchZoomRotate: false,
});

const mbLayer = new Layer({
  render: function (frameState) {
    const canvas = mbMap.getCanvas();
    const viewState = frameState.viewState;

    const visible = mbLayer.getVisible();
    canvas.style.display = visible ? 'block' : 'none';
    canvas.style.position = 'absolute';

    const opacity = mbLayer.getOpacity();
    canvas.style.opacity = opacity;

    // adjust view parameters in mapbox
    const rotation = viewState.rotation;
    mbMap.jumpTo({
      center: toLonLat(viewState.center),
      zoom: viewState.zoom - 1,
      bearing: (-rotation * 180) / Math.PI,
      animate: false,
    });

    // cancel the scheduled update & trigger synchronous redraw
    // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
    // NOTE: THIS MIGHT BREAK IF UPDATING THE MAPBOX VERSION
    if (mbMap._frame) {
      mbMap._frame.cancel();
      mbMap._frame = null;
    }
    mbMap._render();

    return canvas;
  },
  source: new Source({
    attributions: [
      '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a>',
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    ],
  }),
});

const cities = new HeatmapLayer({
  source: new VectorSource({
    url: 'data/geojson/world-cities.geojson',
    format: new GeoJSON(),
  }),
  weight: function (feature) {
    return feature.get('population') / 1e7;
  },
  radius: 15,
  blur: 15,
});

const map = new Map({
  target: 'map',
  view: new View({
    center: fromLonLat(center),
    zoom: 4,
  }),
  layers: [mbLayer, cities],
});
