import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import {Circle} from 'ol/geom';
import {circular} from 'ol/geom/Polygon';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Style, Stroke, Fill} from 'ol/style';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';

var circleFeature = new Feature({
  geometry: new Circle(
    [945751.80, 7154116.68],  // coordinates in EPSG:3857
    1500  // units of the layer, in this case "fake" Pseudo Mercator meters
    ),
});

// the metric circle is created in EPSG:4326
var metricCircleFeature = new Feature({
  geometry: new circular(
    [8.495833, 53.915222],  // same location as lon lat
    1500,  // meters
    128  // vertices of the resulting circle
    ).transform('EPSG:4326', 'EPSG:3857')
});

circleFeature.setStyle(
  new Style({
    stroke: new Stroke({
      color: 'red',
      width: 3,
    }),
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.2)',
    }),
  })
);

metricCircleFeature.setStyle(
  new Style({
    stroke: new Stroke({
      color: 'blue',
      width: 3,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 255, 0.2)',
    }),
  })
);

new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
      visible: true,
    }),
    new VectorLayer({
      source: new VectorSource({
        features: [
          circleFeature,
          metricCircleFeature
        ],
      }),
    }) ],
  target: 'map',
  view: new View({
    center: [945753, 7154121],
    zoom: 13,
  }),
});
