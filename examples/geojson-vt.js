import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import OSM from '../src/ol/source/OSM.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import {Tile as TileLayer, VectorTile as VectorTileLayer} from '../src/ol/layer.js';
import Projection from '../src/ol/proj/Projection.js';

// Converts geojson-vt data to GeoJSON
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
    format: new GeoJSON({
      // Data returned from geojson-vt is in tile pixel units
      dataProjection: new Projection({
        code: 'TILE_PIXELS',
        units: 'tile-pixels',
        extent: [0, 0, 4096, 4096]
      })
    }),
    tileUrlFunction: function(tileCoord) {
      const data = tileIndex.getTile(tileCoord[0], tileCoord[1], tileCoord[2]);
      const geojson = JSON.stringify({
        type: 'FeatureCollection',
        features: data ? data.features : []
      }, replacer);
      return 'data:application/json;charset=UTF-8,' + geojson;
    }
  });
  const vectorLayer = new VectorTileLayer({
    source: vectorSource
  });
  map.addLayer(vectorLayer);
});
