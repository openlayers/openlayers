import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import Polyline from '../src/ol/format/Polyline.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';
import {
  Circle as CircleStyle,
  Fill,
  Icon,
  Stroke,
  Style,
} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {getVectorContext} from '../src/ol/render.js';

const key = 'get_your_own_D6rA4zTHduk6KOKTXzGB';
const attributions =
  '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';

const center = [-5639523.95, -3501274.52];
const map = new Map({
  target: document.getElementById('map'),
  view: new View({
    center: center,
    zoom: 10,
    minZoom: 2,
    maxZoom: 19,
  }),
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: attributions,
        url: 'https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=' + key,
        tileSize: 512,
      }),
    }),
  ],
});

// The polyline string is read from a JSON similiar to those returned
// by directions APIs such as Openrouteservice and Mapbox.
fetch('data/polyline/route.json').then(function (response) {
  response.json().then(function (result) {
    const polyline = result.routes[0].geometry;

    const route = new Polyline({
      factor: 1e6,
    }).readGeometry(polyline, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });

    const routeFeature = new Feature({
      type: 'route',
      geometry: route,
    });
    const startMarker = new Feature({
      type: 'icon',
      geometry: new Point(route.getFirstCoordinate()),
    });
    const endMarker = new Feature({
      type: 'icon',
      geometry: new Point(route.getLastCoordinate()),
    });
    const position = startMarker.getGeometry().clone();
    const geoMarker = new Feature({
      type: 'geoMarker',
      geometry: position,
    });

    const styles = {
      'route': new Style({
        stroke: new Stroke({
          width: 6,
          color: [237, 212, 0, 0.8],
        }),
      }),
      'icon': new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'data/icon.png',
        }),
      }),
      'geoMarker': new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({color: 'black'}),
          stroke: new Stroke({
            color: 'white',
            width: 2,
          }),
        }),
      }),
    };

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature, geoMarker, startMarker, endMarker],
      }),
      style: function (feature) {
        return styles[feature.get('type')];
      },
    });

    map.addLayer(vectorLayer);

    const speedInput = document.getElementById('speed');
    const startButton = document.getElementById('start-animation');
    let animating = false;
    let distance = 0;
    let lastTime;

    function moveFeature(event) {
      const speed = Number(speedInput.value);
      const time = event.frameState.time;
      const elapsedTime = time - lastTime;
      distance = (distance + (speed * elapsedTime) / 1e6) % 2;
      lastTime = time;

      const currentCoordinate = route.getCoordinateAt(
        distance > 1 ? 2 - distance : distance
      );
      position.setCoordinates(currentCoordinate);
      const vectorContext = getVectorContext(event);
      vectorContext.setStyle(styles.geoMarker);
      vectorContext.drawGeometry(position);
      // tell OpenLayers to continue the postrender animation
      map.render();
    }

    function startAnimation() {
      animating = true;
      lastTime = Date.now();
      startButton.textContent = 'Stop Animation';
      vectorLayer.on('postrender', moveFeature);
      // hide geoMarker and trigger map render through change event
      geoMarker.setGeometry(null);
    }

    function stopAnimation() {
      animating = false;
      startButton.textContent = 'Start Animation';

      // Keep marker at current animation position
      geoMarker.setGeometry(position);
      vectorLayer.un('postrender', moveFeature);
    }

    startButton.addEventListener('click', function () {
      if (animating) {
        stopAnimation();
      } else {
        startAnimation();
      }
    });
  });
});
