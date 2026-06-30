import {assert} from 'chai';
import View from '../../../../../src/ol/View.js';
import Event from '../../../../../src/ol/events/Event.js';
import EventTarget from '../../../../../src/ol/events/Target.js';
import GeoJSON from '../../../../../src/ol/format/GeoJSON.js';
import MVT from '../../../../../src/ol/format/MVT.js';
import DragAndDrop from '../../../../../src/ol/interaction/DragAndDrop.js';
import {
  clearUserProjection,
  transform,
  useGeographic,
} from '../../../../../src/ol/proj.js';
import VectorSource from '../../../../../src/ol/source/Vector.js';

where('FileReader').describe('ol.interaction.DragAndDrop', function () {
  let viewport, map, interaction;

  beforeEach(function () {
    viewport = new EventTarget();
    map = {
      getViewport: function () {
        return viewport;
      },
      getView: function () {
        return new View();
      },
    };
    interaction = new DragAndDrop({
      formatConstructors: [GeoJSON],
    });
  });

  describe('constructor', function () {
    it('can be constructed without arguments', function () {
      const interaction = new DragAndDrop();
      assert.instanceOf(interaction, DragAndDrop);
    });

    it('sets formats on the instance', function () {
      assert.lengthOf(interaction.formats_, 1);
    });

    it('accepts a source option', function () {
      const source = new VectorSource();
      const drop = new DragAndDrop({
        formatConstructors: [GeoJSON],
        source: source,
      });
      assert.equal(drop.source_, source);
    });
  });

  describe('#setActive()', function () {
    it('registers and unregisters listeners', function () {
      interaction.setMap(map);
      interaction.setActive(true);
      assert.strictEqual(viewport.hasListener('dragenter'), true);
      assert.strictEqual(viewport.hasListener('dragover'), true);
      assert.strictEqual(viewport.hasListener('drop'), true);
      interaction.setActive(false);
      assert.strictEqual(viewport.hasListener('dragenter'), false);
      assert.strictEqual(viewport.hasListener('dragover'), false);
      assert.strictEqual(viewport.hasListener('drop'), false);
    });
  });

  describe('#setMap()', function () {
    it('registers and unregisters listeners', function () {
      interaction.setMap(map);
      assert.strictEqual(viewport.hasListener('dragenter'), true);
      assert.strictEqual(viewport.hasListener('dragover'), true);
      assert.strictEqual(viewport.hasListener('drop'), true);
      interaction.setMap(null);
      assert.strictEqual(viewport.hasListener('dragenter'), false);
      assert.strictEqual(viewport.hasListener('dragover'), false);
      assert.strictEqual(viewport.hasListener('drop'), false);
    });

    it('registers and unregisters listeners on a custom target', function () {
      const customTarget = new EventTarget();
      interaction = new DragAndDrop({
        formatConstructors: [GeoJSON],
        target: customTarget,
      });
      interaction.setMap(map);
      assert.strictEqual(customTarget.hasListener('dragenter'), true);
      assert.strictEqual(customTarget.hasListener('dragover'), true);
      assert.strictEqual(customTarget.hasListener('drop'), true);
      interaction.setMap(null);
      assert.strictEqual(customTarget.hasListener('dragenter'), false);
      assert.strictEqual(customTarget.hasListener('dragover'), false);
      assert.strictEqual(customTarget.hasListener('drop'), false);
    });
  });

  describe('#handleDrop_', function () {
    let OrigFileReader;
    let mockReadAsText;
    let mockReadAsArrayBuffer;

    beforeEach(function () {
      OrigFileReader = FileReader;
      mockReadAsText = false;
      mockReadAsArrayBuffer = false;

      class MockFileReader extends EventTarget {
        constructor() {
          super(...arguments);
        }
        readAsText(file) {
          mockReadAsText = true;
          this.result = file;
          this.dispatchEvent('load');
        }
        readAsArrayBuffer(file) {
          mockReadAsArrayBuffer = true;
          this.result = new TextEncoder().encode(file).buffer;
          this.dispatchEvent('load');
        }
      }
      FileReader = MockFileReader;
    });

    afterEach(function () {
      FileReader = OrigFileReader;
    });

    it('reads dropped files as text', () =>
      new Promise((resolve) => {
        interaction.on('addfeatures', function (evt) {
          assert.strictEqual(evt.features.length, 1);
          assert.deepEqual(
            evt.features[0].getGeometry().getCoordinates(),
            transform([102.0, 0.5], 'EPSG:4326', 'EPSG:3857'),
          );
          assert.strictEqual(mockReadAsText, true);
          assert.strictEqual(mockReadAsArrayBuffer, false);
          resolve();
        });
        interaction.setMap(map);
        const event = new Event();
        event.dataTransfer = {};
        event.type = 'dragenter';
        viewport.dispatchEvent(event);
        event.type = 'dragover';
        viewport.dispatchEvent(event);
        event.type = 'drop';
        event.dataTransfer.files = {
          length: 1,
          item: function () {
            return JSON.stringify({
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  id: '1',
                  'geometry': {
                    'type': 'Point',
                    'coordinates': [102.0, 0.5],
                  },
                },
              ],
            });
          },
        };
        viewport.dispatchEvent(event);
        assert.strictEqual(event.dataTransfer.dropEffect, 'copy');
        assert.strictEqual(event.propagationStopped, true);
      }));

    it('works with user projection', () =>
      new Promise((resolve) => {
        interaction.on('addfeatures', function (evt) {
          assert.strictEqual(evt.features.length, 1);
          assert.deepEqual(
            evt.features[0].getGeometry().getCoordinates(),
            [102.0, 0.5],
          );
          assert.strictEqual(mockReadAsText, true);
          assert.strictEqual(mockReadAsArrayBuffer, false);
          clearUserProjection();
          resolve();
        });
        useGeographic();
        interaction.setMap(map);
        const event = new Event();
        event.dataTransfer = {};
        event.type = 'dragenter';
        viewport.dispatchEvent(event);
        event.type = 'dragover';
        viewport.dispatchEvent(event);
        event.type = 'drop';
        event.dataTransfer.files = {
          length: 1,
          item: function () {
            return JSON.stringify({
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  id: '1',
                  'geometry': {
                    'type': 'Point',
                    'coordinates': [102.0, 0.5],
                  },
                },
              ],
            });
          },
        };
        viewport.dispatchEvent(event);
        assert.strictEqual(event.dataTransfer.dropEffect, 'copy');
        assert.strictEqual(event.propagationStopped, true);
      }));

    it('reads dropped files as arraybuffer', () =>
      new Promise((resolve) => {
        const drop = new DragAndDrop({
          formatConstructors: [GeoJSON, MVT],
        });
        drop.setMap(map);

        drop.on('addfeatures', function (evt) {
          assert.strictEqual(evt.features.length, 1);
          assert.strictEqual(mockReadAsText, false);
          assert.strictEqual(mockReadAsArrayBuffer, true);
          resolve();
        });

        const event = new Event();
        event.dataTransfer = {};
        event.type = 'dragenter';
        viewport.dispatchEvent(event);
        event.type = 'dragover';
        viewport.dispatchEvent(event);
        event.type = 'drop';
        event.dataTransfer.files = {
          length: 1,
          item: function () {
            return JSON.stringify({
              type: 'FeatureCollection',
              features: [{type: 'Feature', id: '1'}],
            });
          },
        };
        viewport.dispatchEvent(event);
        assert.strictEqual(event.dataTransfer.dropEffect, 'copy');
        assert.strictEqual(event.propagationStopped, true);
      }));

    it('reads using constructed formats', () =>
      new Promise((resolve) => {
        const drop = new DragAndDrop({
          formatConstructors: [new GeoJSON()],
        });
        drop.setMap(map);

        drop.on('addfeatures', function (evt) {
          assert.strictEqual(evt.features.length, 1);
          assert.strictEqual(mockReadAsText, true);
          assert.strictEqual(mockReadAsArrayBuffer, false);
          resolve();
        });

        const event = new Event();
        event.dataTransfer = {};
        event.type = 'dragenter';
        viewport.dispatchEvent(event);
        event.type = 'dragover';
        viewport.dispatchEvent(event);
        event.type = 'drop';
        event.dataTransfer.files = {
          length: 1,
          item: function () {
            return JSON.stringify({
              type: 'FeatureCollection',
              features: [{type: 'Feature', id: '1'}],
            });
          },
        };
        viewport.dispatchEvent(event);
        assert.strictEqual(event.dataTransfer.dropEffect, 'copy');
        assert.strictEqual(event.propagationStopped, true);
      }));

    it('reads using arraybuffer formats', () =>
      new Promise((resolve) => {
        class binaryGeoJSON extends GeoJSON {
          constructor(options) {
            super(options);
          }
          getType() {
            return 'arraybuffer';
          }
          readFeatures(source, options) {
            const data = new TextDecoder().decode(source);
            return super.readFeatures(data, options);
          }
        }

        const drop = new DragAndDrop({
          formatConstructors: [binaryGeoJSON],
        });
        drop.setMap(map);

        drop.on('addfeatures', function (evt) {
          assert.strictEqual(evt.features.length, 1);
          assert.strictEqual(mockReadAsText, false);
          assert.strictEqual(mockReadAsArrayBuffer, true);
          resolve();
        });

        const event = new Event();
        event.dataTransfer = {};
        event.type = 'dragenter';
        viewport.dispatchEvent(event);
        event.type = 'dragover';
        viewport.dispatchEvent(event);
        event.type = 'drop';
        event.dataTransfer.files = {
          length: 1,
          item: function () {
            return JSON.stringify({
              type: 'FeatureCollection',
              features: [{type: 'Feature', id: '1'}],
            });
          },
        };
        viewport.dispatchEvent(event);
        assert.strictEqual(event.dataTransfer.dropEffect, 'copy');
        assert.strictEqual(event.propagationStopped, true);
      }));

    it('adds dropped features to a source', () =>
      new Promise((resolve) => {
        const source = new VectorSource();
        const drop = new DragAndDrop({
          formatConstructors: [GeoJSON],
          source: source,
        });
        drop.setMap(map);

        drop.on('addfeatures', function (evt) {
          const features = source.getFeatures();
          assert.strictEqual(features.length, 1);
          resolve();
        });

        const event = new Event();
        event.dataTransfer = {};
        event.type = 'dragenter';
        viewport.dispatchEvent(event);
        event.type = 'dragover';
        viewport.dispatchEvent(event);
        event.type = 'drop';
        event.dataTransfer.files = {
          length: 1,
          item: function () {
            return JSON.stringify({
              type: 'FeatureCollection',
              features: [{type: 'Feature', id: '1'}],
            });
          },
        };
        viewport.dispatchEvent(event);
        assert.strictEqual(event.dataTransfer.dropEffect, 'copy');
        assert.strictEqual(event.propagationStopped, true);
      }));
  });
});
