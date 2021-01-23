import GeoJSON from '../src/ol/format/GeoJSON.js';
import LinearRing from '../src/ol/geom/LinearRing.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from '../src/ol/geom.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat, getPointResolution} from '../src/ol/proj';
import {getCenter} from '../src/ol/extent';

const source = new VectorSource();
fetch('data/geojson/roads-seoul.geojson')
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    const format = new GeoJSON();
    const features = format.readFeatures(json, {
      featureProjection: 'EPSG:3857',
    });

    const parser = new jsts.io.OL3Parser();
    parser.inject(
      Point,
      LineString,
      LinearRing,
      Polygon,
      MultiPoint,
      MultiLineString,
      MultiPolygon
    );

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      // convert the OpenLayers geometry to a JSTS geometry
      const jstsGeom = parser.read(feature.getGeometry());

      // since JSTS operates with cartesian calculations and the
      // EPSG:3857 projection is highly distorted, an
      // approximation of meters vs. map units is calculated
      const resolutionAtFeature = getPointResolution(
        map.getView().getProjection(),
        1,
        getCenter(feature.getGeometry().getExtent())
      );

      // create a buffer of about 40 meters around each line
      const buffered = jstsGeom.buffer(40 / resolutionAtFeature);

      // convert back from JSTS and replace the geometry on the feature
      feature.setGeometry(parser.write(buffered));
    }

    source.addFeatures(features);
  });
const vectorLayer = new VectorLayer({
  source: source,
});

const rasterLayer = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([126.979293, 37.528787]),
    zoom: 15,
  }),
});
