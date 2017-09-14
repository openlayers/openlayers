goog.provide('ol.test.control.Attribution');

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.control.Attribution');
goog.require('ol.layer.Tile');
goog.require('ol.source.Tile');

describe('ol.control.Attribution', function() {

  var map, target;
  beforeEach(function() {
    target = document.createElement('div');
    target.style.width = target.style.height = '100px';
    document.body.appendChild(target);
    map = new ol.Map({
      target: target,
      controls: [new ol.control.Attribution({
        collapsed: false,
        collapsible: false
      })],
      layers: [
        new ol.layer.Tile({
          source: new ol.source.Tile({
            projection: 'EPSG:3857',
            tileGrid: ol.tilegrid.createXYZ(),
            attributions: 'foo'
          })
        }),
        new ol.layer.Tile({
          source: new ol.source.Tile({
            projection: 'EPSG:3857',
            tileGrid: ol.tilegrid.createXYZ(),
            attributions: 'bar'
          })
        }),
        new ol.layer.Tile({
          source: new ol.source.Tile({
            projection: 'EPSG:3857',
            tileGrid: ol.tilegrid.createXYZ(),
            attributions: 'foo'
          })
        })
      ],
      view: new ol.View({
        center: [0, 0],
        zoom: 0
      })
    });
    map.getLayers().forEach(function(layer) {
      var source = layer.getSource();
      source.getTile = function() {
        var tile = new ol.Tile([0, 0, -1], 2 /* LOADED */);
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
    map.setTarget(null);
    document.body.removeChild(target);
  });

  it('does not add duplicate attributions', function() {
    map.renderSync();
    var attribution = document.querySelectorAll('.ol-attribution li');
    expect(attribution.length).to.be(3); // first <li> is the logo
  });

});
