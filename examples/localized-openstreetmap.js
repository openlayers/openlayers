import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM, {ATTRIBUTION} from 'ol/source/OSM';


const openCycleMapLayer = new TileLayer({
  source: new OSM({
    attributions: [
      'All maps © <a href="https://www.opencyclemap.org/">OpenCycleMap</a>',
      ATTRIBUTION
    ],
    url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
        '?apikey=0e6fc415256d4fbb9b5166a718591d71'
  })
});

const openSeaMapLayer = new TileLayer({
  source: new OSM({
    attributions: [
      'All maps © <a href="http://www.openseamap.org/">OpenSeaMap</a>',
      ATTRIBUTION
    ],
    opaque: false,
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png'
  })
});


const map = new Map({
  layers: [
    openCycleMapLayer,
    openSeaMapLayer
  ],
  target: 'map',
  view: new View({
    maxZoom: 18,
    center: [-244780.24508882355, 5986452.183179816],
    zoom: 15
  })
});
