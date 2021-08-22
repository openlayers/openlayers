import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Stroke, Style, Text} from '../src/ol/style.js';

// https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
function stringDivider(str, width, spaceReplacer) {
  if (str.length > width) {
    let p = width;
    while (p > 0 && str[p] != ' ' && str[p] != '-') {
      p--;
    }
    if (p > 0) {
      let left;
      if (str.substring(p, p + 1) == '-') {
        left = str.substring(0, p + 1);
      } else {
        left = str.substring(0, p);
      }
      const right = str.substring(p + 1);
      return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
    }
  }
  return str;
}

var myGeoJSON = { "type": "FeatureCollection",
  "features":
    [

      {"type":"Feature","id":"BIH","properties":{"name":"Bosnia and Herzegovina"},"geometry":{"type":"Polygon","coordinates":[[[19.005486,44.860234],[19.36803,44.863],[19.11761,44.42307],[19.59976,44.03847],[19.454,43.5681],[19.21852,43.52384],[19.03165,43.43253],[18.70648,43.20011],[18.56,42.65],[17.674922,43.028563],[17.297373,43.446341],[16.916156,43.667722],[16.456443,44.04124],[16.23966,44.351143],[15.750026,44.818712],[15.959367,45.233777],[16.318157,45.004127],[16.534939,45.211608],[17.002146,45.233777],[17.861783,45.06774],[18.553214,45.08159],[19.005486,44.860234]]]}}

    ]
};

var geojson_format = new GeoJSON({
  defaultDataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857'
});

let txtlyr = new VectorLayer({
  //declutter: true,
  zIndex: 10,
  source: new VectorSource({
    //format: geojson_format,
    //features: geojson_format.readFeatures(myGeoJSON)
    format: new GeoJSON(),
    url: 'https://raw.githubusercontent.com/openlayers/ol3/6838fdd4c94fe80f1a3c98ca92f84cf1454e232a/examples/data/geojson/countries.geojson'
  }),
  updateWhileAnimating: true,
  updateWhileInteracting: true,
  style: function(feature, res){

    var sst = new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 1,
      }),
      text: new Text({
        font: 'bold 1em Roboto,sans-serif',
        fill: new Fill({
          //color: '#000',
          color: 'rgba(0,0,0,1)'
        }),
        stroke: new Stroke({
          //color: '#fff',
          color: 'rgba(255,255,255,0.5)',
          width: 3,
        }),
      }),
    });

    sst.getText().setText(stringDivider(feature.get('name'), 16, '\n'));
    return sst;
  }
});

const map = new Map({
  target: 'map',
  view: new View({
    center: [2148466.17,5524437.62],
    zoom: 4,
  }),
});

map.addLayer(txtlyr);
