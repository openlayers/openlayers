import Map from '../../../../src/ol/Map.js';
import Tile from '../../../../src/ol/Tile.js';
import View from '../../../../src/ol/View.js';
import Attribution from '../../../../src/ol/control/Attribution.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

describe('ol.control.Attribution', function() {

  let map;
  beforeEach(function() {
    const target = document.createElement('div');
    target.style.width = target.style.height = '100px';
    document.body.appendChild(target);
    map = new Map({
      target: target,
      controls: [new Attribution({
        collapsed: false,
        collapsible: false
      })],
      layers: [
        new TileLayer({
          source: new TileSource({
            projection: 'EPSG:3857',
            tileGrid: createXYZ(),
            attributions: 'foo'
          })
        }),
        new TileLayer({
          source: new TileSource({
            projection: 'EPSG:3857',
            tileGrid: createXYZ(),
            attributions: 'bar'
          })
        }),
        new TileLayer({
          source: new TileSource({
            projection: 'EPSG:3857',
            tileGrid: createXYZ(),
            attributions: 'foo'
          })
        })
      ],
      view: new View({
        center: [0, 0],
        zoom: 0
      })
    });
    map.getLayers().forEach(function(layer) {
      const source = layer.getSource();
      source.getTile = function() {
        const tile = new Tile([0, 0, -1], 2 /* LOADED */);
        tile.getImage = function() {
          const image = new Image();
          image.width = 256;
          image.height = 256;
          return image;
        };
        return tile;
      };
    });
  });

  afterEach(function() {
    disposeMap(map);
    map = null;
  });

  it('does not add duplicate attributions', function() {
    map.renderSync();
    const attribution = map.getTarget().querySelectorAll('.ol-attribution li');
    expect(attribution.length).to.be(2);
  });

});
