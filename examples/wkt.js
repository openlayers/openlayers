import Map from 'ol/Map';
import View from 'ol/View';
import WKT from 'ol/format/WKT';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';

const raster = new TileLayer({
  source: new OSM()
});

const wkt = 'POLYGON((10.689 -25.092, 34.595 ' +
    '-20.170, 38.814 -35.639, 13.502 ' +
    '-39.155, 10.689 -25.092))';

const format = new WKT();

const feature = format.readFeature(wkt, {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
});

const vector = new VectorLayer({
  source: new VectorSource({
    features: [feature]
  })
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [2952104.0199, -3277504.823],
    zoom: 4
  })
});
