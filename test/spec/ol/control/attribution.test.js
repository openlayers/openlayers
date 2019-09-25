import Map from '../../../../src/ol/Map.js';
import Tile from '../../../../src/ol/Tile.js';
import View from '../../../../src/ol/View.js';
import Attribution from '../../../../src/ol/control/Attribution.js';
import TileLayer from '../../../../src/ol/layer/Tile.js';
import TileSource from '../../../../src/ol/source/Tile.js';
import {createXYZ} from '../../../../src/ol/tilegrid.js';

describe('ol.control.Attribution', () => {

  let map;

  const tileLoadFunction = function() {
    const tile = new Tile([0, 0, -1], 2 /* LOADED */);
    tile.getImage = function() {
      const image = new Image();
      image.width = 256;
      image.height = 256;
      return image;
    };
    return tile;
  };

  beforeEach(() => {
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
      source.getTile = tileLoadFunction;
    });
  });

  afterEach(() => {
    disposeMap(map);
    map = null;
  });

  test('does not add duplicate attributions', () => {
    map.renderSync();
    const attribution = map.getTarget().querySelectorAll('.ol-attribution li');
    expect(attribution.length).toBe(2);
  });

  test(
    'renders attributions as non-collapsible if source is configured with attributionsCollapsible set to false',
    () => {
      map.getControls().clear();
      map.addControl(new Attribution());
      const source = new TileSource({
        projection: 'EPSG:3857',
        tileGrid: createXYZ(),
        attributions: 'foo',
        attributionsCollapsible: false
      });
      source.getTile = tileLoadFunction;
      map.addLayer(new TileLayer({
        source: source
      }));
      map.renderSync();

      const attribution = map.getTarget().querySelectorAll('.ol-attribution.ol-uncollapsible');
      expect(attribution.length).toBe(1);
    }
  );

  test(
    'renders attributions as collapsible if configured with collapsible set to true',
    () => {
      map.getControls().clear();
      map.addControl(new Attribution({collapsible: true}));
      const source = new TileSource({
        projection: 'EPSG:3857',
        tileGrid: createXYZ(),
        attributions: 'foo',
        attributionsCollapsible: false
      });
      source.getTile = tileLoadFunction;
      map.addLayer(new TileLayer({
        source: source
      }));
      map.renderSync();

      const attribution = map.getTarget().querySelectorAll('.ol-attribution.ol-uncollapsible');
      expect(attribution.length).toBe(0);
    }
  );

});
