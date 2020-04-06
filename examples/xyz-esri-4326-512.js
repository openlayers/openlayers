import Map from '../src/ol/Map.js';
import TileLayer from '../src/ol/layer/Tile.js';
import View from '../src/ol/View.js';
import XYZ from '../src/ol/source/XYZ.js';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new XYZ({
        attributions: 'Copyright:© 2013 ESRI, i-cubed, GeoEye',
        url:
          'https://services.arcgisonline.com/arcgis/rest/services/' +
          'ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 15,
        projection: 'EPSG:4326',
        tileSize: 512, // the tile size supported by the ArcGIS tile service
        maxResolution: 180 / 512, // Esri's tile grid fits 180 degrees on one 512 px tile
        wrapX: true,
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    projection: 'EPSG:4326',
    zoom: 2,
    minZoom: 2,
  }),
});
