import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, RegularShape, Stroke, Style} from '../src/ol/style.js';
import {fromLonLat} from '../src/ol/proj.js';

const shaft = new RegularShape({
  points: 2,
  radius: 5,
  stroke: new Stroke({
    width: 2,
    color: 'black',
  }),
  rotateWithView: true,
});

const head = new RegularShape({
  points: 3,
  radius: 5,
  fill: new Fill({
    color: 'black',
  }),
  rotateWithView: true,
});

const styles = [new Style({image: shaft}), new Style({image: head})];

const source = new VectorSource({
  attributions:
    'Weather data by <a href="https://openweathermap.org/current">OpenWeather</a>',
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    new VectorLayer({
      source: source,
      style: function (feature) {
        const wind = feature.get('wind');
        // rotate arrow away from wind origin
        const angle = ((wind.deg - 180) * Math.PI) / 180;
        const scale = wind.speed / 10;
        shaft.setScale([1, scale]);
        shaft.setRotation(angle);
        head.setDisplacement([
          0,
          head.getRadius() / 2 + shaft.getRadius() * scale,
        ]);
        head.setRotation(angle);
        return styles;
      },
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

fetch('data/openweather/weather.json')
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    const features = [];
    data.list.forEach(function (report) {
      const feature = new Feature(
        new Point(fromLonLat([report.coord.lon, report.coord.lat]))
      );
      feature.setProperties(report);
      features.push(feature);
    });
    source.addFeatures(features);
    map.getView().fit(source.getExtent());
  });
