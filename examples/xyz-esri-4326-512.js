import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import TileLayer from '../src/ol/layer/Tile.js';
import XYZ from '../src/ol/source/XYZ.js';

// The tile size supported by the ArcGIS tile service.
const tileSize = 512;

const urlTemplate = 'https://services.arcgisonline.com/arcgis/rest/services/' +
    'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: 'Copyright:© 2013 ESRI, i-cubed, GeoEye',
        maxZoom: 16,
        projection: 'EPSG:4326',
        tileSize: tileSize,
        tileUrlFunction: function(tileCoord) {
          return urlTemplate.replace('{z}', (tileCoord[0] - 1).toString())
            .replace('{x}', tileCoord[1].toString())
            .replace('{y}', tileCoord[2].toString());
        },
        wrapX: true
      })
    })
  ],
  view: new View({
    center: [0, 0],
    projection: 'EPSG:4326',
    zoom: 2,
    minZoom: 2
  })
});
