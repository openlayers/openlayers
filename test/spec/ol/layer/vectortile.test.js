import VectorTileLayer from '../../../../src/ol/layer/VectorTile.js';
import VectorTileSource from '../../../../src/ol/source/VectorTile.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import View from '../../../../src/ol/View.js';
import Map from '../../../../src/ol/Map.js';
import {fromLonLat} from '../../../../src/ol/proj.js';


describe('ol.layer.VectorTile', function() {

  describe('constructor (defaults)', function() {

    let layer;

    beforeEach(function() {
      layer = new VectorTileLayer({
        source: new VectorTileSource({})
      });
    });

    afterEach(function() {
      layer.dispose();
    });

    it('creates an instance', function() {
      expect(layer).to.be.a(VectorTileLayer);
    });

    it('provides default preload', function() {
      expect(layer.getPreload()).to.be(0);
    });

    it('provides default useInterimTilesOnError', function() {
      expect(layer.getUseInterimTilesOnError()).to.be(true);
    });

    it('provides default renderMode', function() {
      expect(layer.getRenderMode()).to.be('hybrid');
    });

  });

  describe('constructor (options)', function() {
    it('works with options', function() {
      let layer = new VectorTileLayer({
        renderMode: 'hybrid',
        source: new VectorTileSource({})
      });
      expect(layer.getRenderMode()).to.be('hybrid');
      layer = new VectorTileLayer({
        renderMode: 'image',
        source: new VectorTileSource({})
      });
      expect(layer.getRenderMode()).to.be('image');
      expect(function() {
        layer = new VectorTileLayer({
          renderMode: 'foo',
          source: new VectorTileSource({})
        });
      }).to.throwException();
    });
  });

  describe('#getFeatures()', function() {

    let map, layer;

    beforeEach(function() {
      layer = new VectorTileLayer({
        source: new VectorTileSource({
          format: new GeoJSON(),
          url: `data:application/json;charset=utf-8,
            {
              "type": "FeatureCollection",
              "features": [
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [-36, 0]
                  },
                  "properties": {
                    "name": "feature1"
                  }
                },
                {
                  "type": "Feature",
                  "geometry": {
                    "type": "Point",
                    "coordinates": [36, 0]
                  },
                  "properties": {
                    "name": "feature2"
                  }
                }
              ]
            }
          `
        })
      });
      const container = document.createElement('div');
      container.style.width = '256px';
      container.style.height = '256px';
      document.body.appendChild(container);
      map = new Map({
        target: container,
        layers: [
          layer
        ],
        view: new View({
          zoom: 0,
          center: [0, 0]
        })
      });
    });

    afterEach(function() {
      document.body.removeChild(map.getTargetElement());
      map.setTarget(null);
    });

    it('detects features properly', function(done) {
      map.once('rendercomplete', function() {
        const pixel = map.getPixelFromCoordinate(fromLonLat([-36, 0]));
        layer.getFeatures(pixel).then(function(features) {
          expect(features[0].get('name')).to.be('feature1');
          done();
        }).catch(done);
      });
    });

    it('does not give false positives', function(done) {
      map.once('rendercomplete', function() {
        const pixel = map.getPixelFromCoordinate(fromLonLat([0, 0]));
        layer.getFeatures(pixel).then(function(features) {
          expect(features.length).to.be(0);
          done();
        }).catch(done);
      });
    });

    it('stores separate hit detection data for each layer that uses the source', function(done) {
      const layer2 = new VectorTileLayer({
        source: layer.getSource()
      });
      map.addLayer(layer2);
      map.once('rendercomplete', function() {
        const pixel = map.getPixelFromCoordinate(fromLonLat([-36, 0]));
        Promise.all([layer.getFeatures(pixel), layer2.getFeatures(pixel)]).then(function(result) {
          const tile = layer.getSource().tileCache.get('0/0/0');
          expect(Object.keys(tile.hitDetectionImageData).length).to.be(2);
          done();
        }).catch(done);
      });
    });

  });

});
