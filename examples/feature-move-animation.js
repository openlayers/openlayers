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
    const geoMarker = new Feature({
      type: 'geoMarker',
      geometry: new Point(route.getCoordinateAt(0)),
    });
    const startMarker = new Feature({
      type: 'icon',
      geometry: new Point(route.getCoordinateAt(0)),
    });
    const endMarker = new Feature({
      type: 'icon',
      geometry: new Point(route.getCoordinateAt(1)),
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

    let animating = false;

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature, geoMarker, startMarker, endMarker],
      }),
      style: function (feature) {
        // hide geoMarker if animation is active
        if (animating && feature.get('type') === 'geoMarker') {
          return null;
        }
        return styles[feature.get('type')];
      },
    });

    map.addLayer(vectorLayer);

    let speed, startTime;
    const speedInput = document.getElementById('speed');
    const startButton = document.getElementById('start-animation');

    function moveFeature(event) {
      const vectorContext = getVectorContext(event);
      const frameState = event.frameState;

      if (animating) {
        const elapsedTime = frameState.time - startTime;
        const distance = (speed * elapsedTime) / 1e6;

        if (distance >= 1) {
          stopAnimation(true);
          return;
        }

        const currentPoint = new Point(route.getCoordinateAt(distance));
        const feature = new Feature(currentPoint);
        vectorContext.drawFeature(feature, styles.geoMarker);
      }
      // tell OpenLayers to continue the postrender animation
      map.render();
    }

    function startAnimation() {
      if (animating) {
        stopAnimation(false);
      } else {
        animating = true;
        startTime = new Date().getTime();
        speed = speedInput.value;
        startButton.textContent = 'Cancel Animation';
        // hide geoMarker
        geoMarker.changed();
        // just in case you pan somewhere else
        map.getView().setCenter(center);
        vectorLayer.on('postrender', moveFeature);
        map.render();
      }
    }

    function stopAnimation(ended) {
      animating = false;
      startButton.textContent = 'Start Animation';

      // if animation cancelled set the marker at the beginning
      const coord = route.getCoordinateAt(ended ? 1 : 0);
      geoMarker.getGeometry().setCoordinates(coord);
      // remove listener
      vectorLayer.un('postrender', moveFeature);
    }

    startButton.addEventListener('click', startAnimation, false);
  });
});
