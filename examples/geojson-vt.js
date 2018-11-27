import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import OSM from '../src/ol/source/OSM.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {Tile as TileLayer, VectorTile as VectorTileLayer} from '../src/ol/layer.js';
import Projection from '../src/ol/proj/Projection.js';


const replacer = function(key, value) {
  if (value.geometry) {
    let type;
    const rawType = value.type;
    let geometry = value.geometry;

    if (rawType === 1) {
      type = 'MultiPoint';
      if (geometry.length == 1) {
        type = 'Point';
        geometry = geometry[0];
      }
    } else if (rawType === 2) {
      type = 'MultiLineString';
      if (geometry.length == 1) {
        type = 'LineString';
        geometry = geometry[0];
      }
    } else if (rawType === 3) {
      type = 'Polygon';
      if (geometry.length > 1) {
        type = 'MultiPolygon';
        geometry = [geometry];
      }
    }

    return {
      'type': 'Feature',
      'geometry': {
        'type': type,
        'coordinates': geometry
      },
      'properties': value.tags
    };
  } else {
    return value;
  }
};

const tilePixels = new Projection({
  code: 'TILE_PIXELS',
  units: 'tile-pixels'
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

const url = 'data/geojson/countries.geojson';
fetch(url).then(function(response) {
  return response.json();
}).then(function(json) {
  const tileIndex = geojsonvt(json, {
    extent: 4096,
    debug: 1
  });
  const vectorSource = new VectorTileSource({
    format: new GeoJSON(),
    tileLoadFunction: function(tile) {
      const format = tile.getFormat();
      const tileCoord = tile.getTileCoord();
      const data = tileIndex.getTile(tileCoord[0], tileCoord[1], tileCoord[2]);

      const features = format.readFeatures(
        JSON.stringify({
          type: 'FeatureCollection',
          features: data ? data.features : []
        }, replacer));
      tile.setLoader(function() {
        tile.setFeatures(features);
        tile.setProjection(tilePixels);
      });
    },
    url: 'data:' // arbitrary url, we don't use it in the tileLoadFunction
  });
  const vectorLayer = new VectorTileLayer({
    source: vectorSource
  });
  map.addLayer(vectorLayer);
});
