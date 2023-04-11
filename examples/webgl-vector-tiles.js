import MVT from '../src/ol/format/MVT.js';
import Map from '../src/ol/Map.js';
import VectorTile from '../src/ol/layer/VectorTile.js';
import VectorTileSource from '../src/ol/source/VectorTile.js';
import View from '../src/ol/View.js';
import WebGLVectorTileLayerRenderer from '../src/ol/renderer/webgl/VectorTileLayer.js';
import {Fill, Icon, Stroke, Style, Text} from '../src/ol/style.js';
import {asArray} from '../src/ol/color.js';
import {packColor} from '../src/ol/renderer/webgl/shaders.js';

const key =
  'pk.eyJ1IjoiYWhvY2V2YXIiLCJhIjoiY2t0cGdwMHVnMGdlbzMxbDhwazBic2xrNSJ9.WbcTL9uj8JPAsnT9mgb7oQ';

class WebGLVectorTileLayer extends VectorTile {
  createRenderer() {
    return new WebGLVectorTileLayerRenderer(this, {
      fill: {
        attributes: {
          color: (feature) => {
            const style = this.getStyle()(feature, 1)[0];
            const color = asArray(style?.getFill()?.getColor() || '#eee');
            return packColor(color);
          },
          opacity: () => 1,
        },
      },
      stroke: {
        attributes: {
          color: (feature) => {
            const style = this.getStyle()(feature, 1)[0];
            const color = asArray(style?.getStroke()?.getColor() || '#eee');
            return packColor(color);
          },
          width: (feature) => {
            const style = this.getStyle()(feature, 1)[0];
            return style?.getStroke()?.getWidth() || 0;
          },
          opacity: () => 1,
        },
      },
      point: {
        attributes: {
          color: () => packColor(asArray('#777')),
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
