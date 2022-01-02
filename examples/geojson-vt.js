import GeoJSON from '../src/ol/format/GeoJSON.js';
import Map from '../src/ol/Map.js';
import Projection from '../src/ol/proj/Projection.js';
import VectorTileLayer from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import {Fill, Style} from '../src/ol/style.js';

// Converts geojson-vt data to GeoJSON
const replacer = function (key, value) {
  if (!value || !value.geometry) {
    return value;
  }

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
      'coordinates': geometry,
    },
    'properties': value.tags,
  };
};

const style = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
});

const layer = new VectorTileLayer({
  background: '#1a2b39',
  style: function (feature) {
    const color = feature.get('COLOR') || '#eeeeee';
    style.getFill().setColor(color);
    return style;
  },
});

const map = new Map({
  layers: [layer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const url = 'https://openlayers.org/data/vector/ecoregions.json';
fetch(url)
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    const tileIndex = geojsonvt(json, {
      extent: 4096,
      debug: 1,
    });
    const format = new GeoJSON({
      // Data returned from geojson-vt is in tile pixel units
      dataProjection: new Projection({
        code: 'TILE_PIXELS',
        units: 'tile-pixels',
        extent: [0, 0, 4096, 4096],
      }),
    });
    const vectorSource = new VectorTileSource({
      tileUrlFunction: function (tileCoord) {
        // Use the tile coordinate as a pseudo URL for caching purposes
        return JSON.stringify(tileCoord);
      },
      tileLoadFunction: function (tile, url) {
        const tileCoord = JSON.parse(url);
        const data = tileIndex.getTile(
          tileCoord[0],
          tileCoord[1],
          tileCoord[2]
        );
        const geojson = JSON.stringify(
          {
            type: 'FeatureCollection',
            features: data ? data.features : [],
          },
          replacer
        );
        const features = format.readFeatures(geojson, {
          extent: vectorSource.getTileGrid().getTileCoordExtent(tileCoord),
          featureProjection: map.getView().getProjection(),
        });
        tile.setFeatures(features);
      },
    });
    layer.setSource(vectorSource);
  });
