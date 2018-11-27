import Map from 'ol/Map';
import View from 'ol/View';
import KML from 'ol/format/KML';
import {Heatmap as HeatmapLayer, Tile as TileLayer} from 'ol/layer';
import Stamen from 'ol/source/Stamen';
import VectorSource from 'ol/source/Vector';

const blur = document.getElementById('blur');
const radius = document.getElementById('radius');

const vector = new HeatmapLayer({
  source: new VectorSource({
    url: 'data/kml/2012_Earthquakes_Mag5.kml',
    format: new KML({
      extractStyles: false
    })
  }),
  blur: parseInt(blur.value, 10),
  radius: parseInt(radius.value, 10)
});

vector.getSource().on('addfeature', function(event) {
  // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
  // standards-violating <magnitude> tag in each Placemark.  We extract it from
  // the Placemark's name instead.
  const name = event.feature.get('name');
  const magnitude = parseFloat(name.substr(2));
  event.feature.set('weight', magnitude - 5);
});

const raster = new TileLayer({
  source: new Stamen({
    layer: 'toner'
  })
});

const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});


blur.addEventListener('input', function() {
  vector.setBlur(parseInt(blur.value, 10));
});

radius.addEventListener('input', function() {
  vector.setRadius(parseInt(radius.value, 10));
});
