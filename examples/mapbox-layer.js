import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import Layer from '../src/ol/layer/Layer';
import {toLonLat} from '../src/ol/proj';
import {Stroke, Style} from '../src/ol/style.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';

const style = new Style({
  stroke: new Stroke({
    color: '#319FD3',
    width: 2
  })
});

const vectorLayer = new VectorLayer({
  source: new VectorSource({
    url: 'data/geojson/countries.geojson',
    format: new GeoJSON()
  }),
  style: style
});

const map = new Map({
  target: 'map',
  view: new View({
    center: [-10997148, 4569099],
    zoom: 4,
    minZoom: 1,
    extent: [-Infinity, -20048966.10, Infinity, 20048966.10],
    smoothExtentConstraint: false,
    smoothResolutionConstraint: false
  })
});


// init Mapbox object

const view = map.getView();
const center = toLonLat(view.getCenter(), view.getProjection());
const key = 'ER67WIiPdCQvhgsUjoWK';

const mbMap = new mapboxgl.Map({
  style: 'https://maps.tilehosting.com/styles/bright/style.json?key=' + key,
  attributionControl: false,
  boxZoom: false,
  center,
  container: map.getTargetElement(),
  doubleClickZoom: false,
  dragPan: false,
  dragRotate: false,
  interactive: false,
  keyboard: false,
  pitchWithRotate: false,
  scrollZoom: false,
  touchZoomRotate: false,
  zoom: view.getZoom() - 1
});


// init OL layers

const mbLayer = new Layer({
  container: map.getTarget(),
  render: function(frameState) {
    const canvas = mbMap.getCanvas();
    const view = map.getView();

    const visible = mbLayer.getVisible();
    canvas.style.display = visible ? 'block' : 'none';

    const opacity = mbLayer.getOpacity();
    canvas.style.opacity = opacity;

    // adjust view parameters in mapbox
    const rotation = frameState.viewState.rotation;
    if (rotation) {
      mbMap.rotateTo(-rotation * 180 / Math.PI, {
        animate: false
      });
    }
    const center = toLonLat(view.getCenter(), view.getProjection());
    const zoom = view.getZoom() - 1;
    mbMap.jumpTo({
      center: center,
      zoom: zoom,
      animate: false
    });

    // cancel the scheduled update & trigger synchronous redraw
    // see https://github.com/mapbox/mapbox-gl-js/issues/7893#issue-408992184
    // NOTE: THIS MIGHT BREAK WHEN UPDATING MAPBOX
    if (mbMap._frame) {
      mbMap._frame.cancel();
      mbMap._frame = null;
    }
    mbMap._render();

    return canvas;
  }
});

map.addLayer(mbLayer);
map.addLayer(vectorLayer);
