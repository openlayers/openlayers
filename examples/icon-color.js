import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {fromLonLat} from 'ol/proj';
import TileJSON from 'ol/source/TileJSON';
import VectorSource from 'ol/source/Vector';
import {Icon, Style} from 'ol/style';


const rome = new Feature({
  geometry: new Point(fromLonLat([12.5, 41.9]))
});

const london = new Feature({
  geometry: new Point(fromLonLat([-0.12755, 51.507222]))
});

const madrid = new Feature({
  geometry: new Point(fromLonLat([-3.683333, 40.4]))
});

rome.setStyle(new Style({
  image: new Icon(/** @type {module:ol/style/Icon~Options} */ ({
    color: '#8959A8',
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));

london.setStyle(new Style({
  image: new Icon(/** @type {module:ol/style/Icon~Options} */ ({
    color: '#4271AE',
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));

madrid.setStyle(new Style({
  image: new Icon(/** @type {module:ol/style/Icon~Options} */ ({
    color: [113, 140, 0],
    crossOrigin: 'anonymous',
    src: 'data/dot.png'
  }))
}));


const vectorSource = new VectorSource({
  features: [rome, london, madrid]
});

const vectorLayer = new VectorLayer({
  source: vectorSource
});

const rasterLayer = new TileLayer({
  source: new TileJSON({
    url: 'https://api.tiles.mapbox.com/v3/mapbox.geography-class.json?secure',
    crossOrigin: ''
  })
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([2.896372, 44.60240]),
    zoom: 3
  })
});
