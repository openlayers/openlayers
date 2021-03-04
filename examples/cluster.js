import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import View from '../src/ol/View.js';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,
} from '../src/ol/style.js';
import {Cluster, OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {boundingExtent} from '../src/ol/extent.js';

const distanceInput = document.getElementById('distance');
const minDistanceInput = document.getElementById('min-distance');

const count = 20000;
const features = new Array(count);
const e = 4500000;
for (let i = 0; i < count; ++i) {
  const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new Feature(new Point(coordinates));
}

const source = new VectorSource({
  features: features,
});

const clusterSource = new Cluster({
  distance: parseInt(distanceInput.value, 10),
  minDistance: parseInt(minDistanceInput.value, 10),
  source: source,
});

const styleCache = {};
const clusters = new VectorLayer({
  source: clusterSource,
  style: function (feature) {
    const size = feature.get('features').length;
    let style = styleCache[size];
    if (!style) {
      style = new Style({
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({
            color: '#fff',
          }),
          fill: new Fill({
            color: '#3399CC',
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff',
          }),
        }),
      });
      styleCache[size] = style;
    }
    return style;
  },
});

const raster = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [raster, clusters],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

distanceInput.addEventListener('input', function () {
  clusterSource.setDistance(parseInt(distanceInput.value, 10));
});

minDistanceInput.addEventListener('input', function () {
  clusterSource.setMinDistance(parseInt(minDistanceInput.value, 10));
});

map.on('click', (e) => {
  clusters.getFeatures(e.pixel).then((clickedFeatures) => {
    if (clickedFeatures.length) {
      // Get clustered Coordinates
      const features = clickedFeatures[0].get('features');
      if (features.length > 1) {
        const extent = boundingExtent(
          features.map((r) => r.getGeometry().getCoordinates())
        );
        map.getView().fit(extent, {duration: 1000, padding: [50, 50, 50, 50]});
      }
    }
  });
});
