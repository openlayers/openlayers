import GeoJSON from '../src/ol/format/GeoJSON.js';
import Layer from '../src/ol/layer/Layer.js';
import Map from '../src/ol/Map.js';
import Source from '../src/ol/source/Source.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Stroke, Style} from '../src/ol/style.js';
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

    const div = document.createElement("div");
    div.className = "ol-layer"
    div.style = "position: absolute; width: 100%; height: 100%;"
    div.appendChild(canvas);

    return div;
  },
  source: new Source({
    attributions: [
      '<a href="https://www.maptiler.com/copyright/" target="_blank">© MapTiler</a>',
      '<a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    ],
  }),
});

const style = new Style({
  stroke: new Stroke({
    color: '#319FD3',
    width: 2,
  }),
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON(),
  }),
  style: style,
});

const map = new Map({
  target: 'map',
  view: new View({
    center: fromLonLat(center),
    zoom: 4,
  }),
  layers: [mbLayer, vectorLayer],
});
