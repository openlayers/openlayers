import Map from 'ol/Map';
import View from 'ol/View';
import {getCenter} from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import BingMaps from 'ol/source/BingMaps';
import VectorSource from 'ol/source/Vector';
import {Fill, Style, Text} from 'ol/style';

const style = new Style({
  text: new Text({
    font: 'bold 11px "Open Sans", "Arial Unicode MS", "sans-serif"',
    placement: 'line',
    fill: new Fill({
      color: 'white'
    })
  })
});

const viewExtent = [1817379, 6139595, 1827851, 6143616];
const map = new Map({
  layers: [new TileLayer({
    source: new BingMaps({
      key: 'As1HiMj1PvLPlqc_gtM7AqZfBL8ZL3VrjaS3zIb22Uvb9WKhuJObROC-qUpa81U5',
      imagerySet: 'Aerial'
    })
  }), new VectorLayer({
    declutter: true,
    source: new VectorSource({
      format: new GeoJSON(),
      url: 'data/geojson/vienna-streets.geojson'
    }),
    style: function(feature) {
      style.getText().setText(feature.get('name'));
      return style;
    }
  })],
  target: 'map',
  view: new View({
    extent: viewExtent,
    center: getCenter(viewExtent),
    zoom: 17,
    minZoom: 14
  })
});
