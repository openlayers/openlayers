import Graticule from 'ol/layer/Graticule';
import Map from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import Projection from 'ol/proj/Projection';
import VectorSource from 'ol/source/Vector';
import {register} from 'ol/proj/proj4';
import proj4 from 'proj4';


proj4.defs('ESRI:53009', '+proj=moll +lon_0=0 +x_0=0 +y_0=0 +a=6371000 ' +
    '+b=6371000 +units=m +no_defs');
register(proj4);

// Configure the Sphere Mollweide projection object with an extent,
// and a world extent. These are required for the Graticule.
const sphereMollweideProjection = new Projection({
  code: 'ESRI:53009',
  extent: [-9009954.605703328, -9009954.605703328,
    9009954.605703328, 9009954.605703328],
  worldExtent: [-179, -89.99, 179, 89.99]
});

const map = new Map({
  keyboardEventTarget: document,
  layers: [
    new VectorLayer({
      source: new VectorSource({
        url: 'data/geojson/countries-110m.geojson',
        format: new GeoJSON()
      })
    }),
    new Graticule()
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    projection: sphereMollweideProjection,
    zoom: 0
  })
});
