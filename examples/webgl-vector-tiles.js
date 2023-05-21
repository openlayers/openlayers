import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import VectorTile from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import WebGLVectorTileLayerRenderer from '../src/ol/renderer/webgl/VectorTileLayer.js';
import {Fill, Icon, Stroke, Style, Text} from '../src/ol/style.js';
import {asArray} from '../src/ol/color.js';
import {packColor, parseLiteralStyle} from '../src/ol/webgl/styleparser.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

const result = parseLiteralStyle({
  'fill-color': ['get', 'fillColor'],
  'stroke-color': ['get', 'strokeColor'],
  'stroke-width': ['get', 'strokeWidth'],
  symbol: {
    symbolType: 'circle',
    size: 8,
    color: '#777',
  },
});

class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      style: {
        fill: {
          fragment: result.builder.getFillFragmentShader(),
          vertex: result.builder.getFillVertexShader(),
        },
        stroke: {
          fragment: result.builder.getStrokeFragmentShader(),
          vertex: result.builder.getStrokeVertexShader(),
        },
        symbol: {
          fragment: result.builder.getSymbolFragmentShader(),
          vertex: result.builder.getSymbolVertexShader(),
        },
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
              return style?.getStroke()?.getWidth() || 0;
            },
          },
        },
      },
    });
  }
}

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
      style: createMapboxStreetsV6Style(Style, Fill, Stroke, Icon, Text),
    }),
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
