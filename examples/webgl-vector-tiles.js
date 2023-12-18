import Map from '../src/ol/Map.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import VectorTile from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import WebGLVectorTileLayerRenderer from '../src/ol/renderer/webgl/VectorTileLayer.js';
import MVT from '../src/ol/format/MVT.js';
import {Fill, Icon, Stroke, Style, Text} from '../src/ol/style.js';
import {asArray} from '../src/ol/color.js';
import {log} from '../src/ol/console.js';
import {packColor, parseLiteralStyle} from '../src/ol/webgl/styleparser.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const result = parseLiteralStyle({
  'fill-color': ['get', 'fillColor'],
  'stroke-color': ['get', 'strokeColor'],
  'stroke-width': ['get', 'strokeWidth'],
  'circle-radius': 10,
  'circle-fill-color': '#777',
});

const style = function (feature) {
  return [
    new Style({
      fill: new Fill({
        color: '#eee',
      }),
      stroke: new Stroke({
        color: '#eee',
        width: 1,
      }),
    }),
  ];
};

class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      disableHitDetection: false,
      style: {
        builder: result.builder,
        attributes: {
          fillColor: {
            size: 2,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              const color = asArray(style?.getFill()?.getColor() || '#eee');
              return packColor(color);
            },
          },
          strokeColor: {
            size: 2,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              const color = asArray(style?.getStroke()?.getColor() || '#eee');
              return packColor(color);
            },
          },
          strokeWidth: {
            size: 1,
            callback: (feature) => {
              const style = this.getStyle()(feature, 1)[0];
              return style?.getStroke()?.getWidth() * 2 || 0;
            },
          },
        },
      },
    });
  }
}

const vectorSource = new VectorSource({
  useSpatialIndex: false,
  features: [],
});

const map = new Map({
  layers: [
    new WebGLVectorTileLayer({
      source: new VectorTileSource({
        attributions:
          '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> ' +
          '© <a href="https://www.openstreetmap.org/copyright">' +
          'OpenStreetMap contributors</a>',
        format: new MVT(),
        url:
          'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
          '{z}/{x}/{y}.vector.pbf?access_token=' +
          key,
      }),
      style,
      disableHitDetection: false,
    }),
    new VectorLayer({
      style: {
        'fill-color': 'grey',
        'stroke-color': 'green',
        'stroke-width': 3,
        'circle-fill-color': 'red',
        'circle-radius': 10,
      },
      source: vectorSource,
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

let activeFeature;

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const feature = map.forEachFeatureAtPixel(
    pixel,
    function (feature) {
      return feature;
    },
    {
      layerFilter(layer) {
        return layer instanceof WebGLVectorTileLayer;
      },
    }
  );
  if (feature) {
    if (activeFeature === feature) {
      // skip
    } else {
      log(feature);
      vectorSource.removeFeature(activeFeature);
      vectorSource.addFeature(feature);
      activeFeature = feature;
    }
  } else {
    if (activeFeature) {
      vectorSource.removeFeature(activeFeature);
      activeFeature = null;
    }
  }
});
