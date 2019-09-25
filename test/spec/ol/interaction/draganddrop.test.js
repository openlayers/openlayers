import View from '../../../../src/ol/View.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import DragAndDrop from '../../../../src/ol/interaction/DragAndDrop.js';
import VectorSource from '../../../../src/ol/source/Vector.js';

where('FileReader').describe('ol.interaction.DragAndDrop', function() {
  let viewport, map, interaction;

  beforeEach(() => {
    viewport = new EventTarget();
    map = {
      getViewport: function() {
        return viewport;
      },
      getView: function() {
        return new View();
      }
    };
    interaction = new DragAndDrop({
      formatConstructors: [GeoJSON]
    });
  });

  describe('constructor', () => {

    test('can be constructed without arguments', () => {
      const interaction = new DragAndDrop();
      expect(interaction).toBeInstanceOf(DragAndDrop);
    });

    test('sets formatConstructors on the instance', () => {
      expect(interaction.formatConstructors_).toHaveLength(1);
    });

    test('accepts a source option', () => {
      const source = new VectorSource();
      const drop = new DragAndDrop({
        formatConstructors: [GeoJSON],
        source: source
      });
      expect(drop.source_).toBe(source);
    });
  });

  describe('#setActive()', () => {
    test('registers and unregisters listeners', () => {
      interaction.setMap(map);
      interaction.setActive(true);
      expect(viewport.hasListener('dragenter')).toBe(true);
      expect(viewport.hasListener('dragover')).toBe(true);
      expect(viewport.hasListener('drop')).toBe(true);
      interaction.setActive(false);
      expect(viewport.hasListener('dragenter')).toBe(false);
      expect(viewport.hasListener('dragover')).toBe(false);
      expect(viewport.hasListener('drop')).toBe(false);
    });
  });

  describe('#setMap()', () => {
    test('registers and unregisters listeners', () => {
      interaction.setMap(map);
      expect(viewport.hasListener('dragenter')).toBe(true);
      expect(viewport.hasListener('dragover')).toBe(true);
      expect(viewport.hasListener('drop')).toBe(true);
      interaction.setMap(null);
      expect(viewport.hasListener('dragenter')).toBe(false);
      expect(viewport.hasListener('dragover')).toBe(false);
      expect(viewport.hasListener('drop')).toBe(false);
    });

    test('registers and unregisters listeners on a custom target', () => {
      const customTarget = new EventTarget();
      interaction = new DragAndDrop({
        formatConstructors: [GeoJSON],
        target: customTarget
      });
      interaction.setMap(map);
      expect(customTarget.hasListener('dragenter')).toBe(true);
      expect(customTarget.hasListener('dragover')).toBe(true);
      expect(customTarget.hasListener('drop')).toBe(true);
      interaction.setMap(null);
      expect(customTarget.hasListener('dragenter')).toBe(false);
      expect(customTarget.hasListener('dragover')).toBe(false);
      expect(customTarget.hasListener('drop')).toBe(false);
    });
  });

  describe('#handleDrop_', () => {
    let OrigFileReader;

    beforeEach(() => {
      OrigFileReader = FileReader;

      class MockFileReader extends EventTarget {
        constructor() {
          super(...arguments);
        }
        readAsText(file) {
          this.result = file;
          this.dispatchEvent('load');
        }
      }
      FileReader = MockFileReader;
    });

    afterEach(() => {
      FileReader = OrigFileReader;
    });

    test('reads dropped files', done => {
      interaction.on('addfeatures', function(evt) {
        expect(evt.features.length).toBe(1);
        done();
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
        item: function() {
          return JSON.stringify({
            type: 'FeatureCollection',
            features: [{type: 'Feature', id: '1'}]
          });
        }
      };
      viewport.dispatchEvent(event);
      expect(event.dataTransfer.dropEffect).toBe('copy');
      expect(event.propagationStopped).toBe(true);
    });

    test('adds dropped features to a source', done => {
      const source = new VectorSource();
      const drop = new DragAndDrop({
        formatConstructors: [GeoJSON],
        source: source
      });
      drop.setMap(map);

      drop.on('addfeatures', function(evt) {
        const features = source.getFeatures();
        expect(features.length).toBe(1);
        done();
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
        item: function() {
          return JSON.stringify({
            type: 'FeatureCollection',
            features: [{type: 'Feature', id: '1'}]
          });
        }
      };
      viewport.dispatchEvent(event);
      expect(event.dataTransfer.dropEffect).toBe('copy');
      expect(event.propagationStopped).toBe(true);
    });
  });

});
