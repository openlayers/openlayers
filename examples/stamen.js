import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat} from 'ol/proj';
import Stamen from 'ol/source/Stamen';


const map = new Map({
  layers: [
    new TileLayer({
      source: new Stamen({
        layer: 'watercolor'
      })
    }),
    new TileLayer({
      source: new Stamen({
        layer: 'terrain-labels'
      })
    })
  ],
  target: 'map',
  view: new View({
    center: fromLonLat([-122.416667, 37.783333]),
    zoom: 12
  })
});
