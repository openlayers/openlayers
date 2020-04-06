import DragAndDrop from '../../../../src/ol/interaction/DragAndDrop.js';
import Event from '../../../../src/ol/events/Event.js';
import EventTarget from '../../../../src/ol/events/Target.js';
import GeoJSON from '../../../../src/ol/format/GeoJSON.js';
import VectorSource from '../../../../src/ol/source/Vector.js';
import View from '../../../../src/ol/View.js';

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
      expect(interaction).to.be.an(DragAndDrop);
    });

    it('sets formatConstructors on the instance', function () {
      expect(interaction.formatConstructors_).to.have.length(1);
    });

    it('accepts a source option', function () {
      const source = new VectorSource();
      const drop = new DragAndDrop({
        formatConstructors: [GeoJSON],
        source: source,
      });
      expect(drop.source_).to.equal(source);
    });
  });

  describe('#setActive()', function () {
    it('registers and unregisters listeners', function () {
      interaction.setMap(map);
      interaction.setActive(true);
      expect(viewport.hasListener('dragenter')).to.be(true);
      expect(viewport.hasListener('dragover')).to.be(true);
      expect(viewport.hasListener('drop')).to.be(true);
      interaction.setActive(false);
      expect(viewport.hasListener('dragenter')).to.be(false);
      expect(viewport.hasListener('dragover')).to.be(false);
      expect(viewport.hasListener('drop')).to.be(false);
    });
  });

  describe('#setMap()', function () {
    it('registers and unregisters listeners', function () {
      interaction.setMap(map);
      expect(viewport.hasListener('dragenter')).to.be(true);
      expect(viewport.hasListener('dragover')).to.be(true);
      expect(viewport.hasListener('drop')).to.be(true);
      interaction.setMap(null);
      expect(viewport.hasListener('dragenter')).to.be(false);
      expect(viewport.hasListener('dragover')).to.be(false);
      expect(viewport.hasListener('drop')).to.be(false);
    });

    it('registers and unregisters listeners on a custom target', function () {
      const customTarget = new EventTarget();
      interaction = new DragAndDrop({
        formatConstructors: [GeoJSON],
        target: customTarget,
      });
      interaction.setMap(map);
      expect(customTarget.hasListener('dragenter')).to.be(true);
      expect(customTarget.hasListener('dragover')).to.be(true);
      expect(customTarget.hasListener('drop')).to.be(true);
      interaction.setMap(null);
      expect(customTarget.hasListener('dragenter')).to.be(false);
      expect(customTarget.hasListener('dragover')).to.be(false);
      expect(customTarget.hasListener('drop')).to.be(false);
    });
  });

  describe('#handleDrop_', function () {
    let OrigFileReader;

    beforeEach(function () {
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

    afterEach(function () {
      FileReader = OrigFileReader;
    });

    it('reads dropped files', function (done) {
      interaction.on('addfeatures', function (evt) {
        expect(evt.features.length).to.be(1);
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
        item: function () {
          return JSON.stringify({
            type: 'FeatureCollection',
            features: [{type: 'Feature', id: '1'}],
          });
        },
      };
      viewport.dispatchEvent(event);
      expect(event.dataTransfer.dropEffect).to.be('copy');
      expect(event.propagationStopped).to.be(true);
    });

    it('adds dropped features to a source', function (done) {
      const source = new VectorSource();
      const drop = new DragAndDrop({
        formatConstructors: [GeoJSON],
        source: source,
      });
      drop.setMap(map);

      drop.on('addfeatures', function (evt) {
        const features = source.getFeatures();
        expect(features.length).to.be(1);
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
        item: function () {
          return JSON.stringify({
            type: 'FeatureCollection',
            features: [{type: 'Feature', id: '1'}],
          });
        },
      };
      viewport.dispatchEvent(event);
      expect(event.dataTransfer.dropEffect).to.be('copy');
      expect(event.propagationStopped).to.be(true);
    });
  });
});
