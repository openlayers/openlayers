

import _ol_Map_ from '../../../../src/ol/map';
import _ol_Tile_ from '../../../../src/ol/tile';
import _ol_View_ from '../../../../src/ol/view';
import _ol_control_Attribution_ from '../../../../src/ol/control/attribution';
import _ol_layer_Tile_ from '../../../../src/ol/layer/tile';
import _ol_source_Tile_ from '../../../../src/ol/source/tile';
import _ol_tilegrid_ from '../../../../src/ol/tilegrid';

describe('ol.control.Attribution', function() {

  var map;
  beforeEach(function() {
    var target = document.createElement('div');
    target.style.width = target.style.height = '100px';
    document.body.appendChild(target);
    map = new _ol_Map_({
      target: target,
      controls: [new _ol_control_Attribution_({
        collapsed: false,
        collapsible: false
      })],
      layers: [
        new _ol_layer_Tile_({
          source: new _ol_source_Tile_({
            projection: 'EPSG:3857',
            tileGrid: _ol_tilegrid_.createXYZ(),
            attributions: 'foo'
          })
        }),
        new _ol_layer_Tile_({
          source: new _ol_source_Tile_({
            projection: 'EPSG:3857',
            tileGrid: _ol_tilegrid_.createXYZ(),
            attributions: 'bar'
          })
        }),
        new _ol_layer_Tile_({
          source: new _ol_source_Tile_({
            projection: 'EPSG:3857',
            tileGrid: _ol_tilegrid_.createXYZ(),
            attributions: 'foo'
          })
        })
      ],
      view: new _ol_View_({
        center: [0, 0],
        zoom: 0
      })
    });
    map.getLayers().forEach(function(layer) {
      var source = layer.getSource();
      source.getTile = function() {
        var tile = new _ol_Tile_([0, 0, -1], 2 /* LOADED */);
        tile.getImage = function() {
          var image = new Image();
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
    var attribution = map.getTarget().querySelectorAll('.ol-attribution li');
    expect(attribution.length).to.be(3); // first <li> is the logo
  });

});
