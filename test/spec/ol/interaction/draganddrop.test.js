

goog.require('ol');
goog.require('ol.View');
goog.require('ol.events.Event');
goog.require('ol.events.EventTarget');
goog.require('ol.format.GeoJSON');
goog.require('ol.interaction.DragAndDrop');
goog.require('ol.source.Vector');

where('FileReader').describe('ol.interaction.DragAndDrop', function() {
  var viewport, map, interaction;

  beforeEach(function() {
    viewport = new ol.events.EventTarget();
    map = {
      getViewport: function() {
        return viewport;
      },
      getView: function() {
        return new ol.View();
      }
    };
    interaction = new ol.interaction.DragAndDrop({
      formatConstructors: [ol.format.GeoJSON]
    });
  });

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var interaction = new ol.interaction.DragAndDrop();
      expect(interaction).to.be.an(ol.interaction.DragAndDrop);
    });

    it('sets formatConstructors on the instance', function() {
      expect(interaction.formatConstructors_).to.have.length(1);
    });

    it('accepts a source option', function() {
      var source = new ol.source.Vector();
      var drop = new ol.interaction.DragAndDrop({
        formatConstructors: [ol.format.GeoJSON],
        source: source
      });
      expect(drop.source_).to.equal(source);
    });
  });

  describe('#setActive()', function() {
    it('registers and unregisters listeners', function() {
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

  describe('#setMap()', function() {
    it('registers and unregisters listeners', function() {
      interaction.setMap(map);
      expect(viewport.hasListener('dragenter')).to.be(true);
      expect(viewport.hasListener('dragover')).to.be(true);
      expect(viewport.hasListener('drop')).to.be(true);
      interaction.setMap(null);
      expect(viewport.hasListener('dragenter')).to.be(false);
      expect(viewport.hasListener('dragover')).to.be(false);
      expect(viewport.hasListener('drop')).to.be(false);
    });

    it('registers and unregisters listeners on a custom target', function() {
      var customTarget = new ol.events.EventTarget();
      interaction = new ol.interaction.DragAndDrop({
        formatConstructors: [ol.format.GeoJSON],
        target: customTarget
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

  describe('#handleDrop_', function() {
    var OrigFileReader;

    beforeEach(function() {
      OrigFileReader = FileReader;

      FileReader = function() {
        ol.events.EventTarget.apply(this, arguments);
        this.readAsText = function(file) {
          this.result = file;
          this.dispatchEvent('load');
        };
      };
      ol.inherits(FileReader, ol.events.EventTarget);
    });

    afterEach(function() {
      FileReader = OrigFileReader;
    });

    it('reads dropped files', function(done) {
      interaction.on('addfeatures', function(evt) {
        expect(evt.features.length).to.be(1);
        done();
      });
      interaction.setMap(map);
      var event = new ol.events.Event();
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
      expect(event.dataTransfer.dropEffect).to.be('copy');
      expect(event.propagationStopped).to.be(true);
    });

    it('adds dropped features to a source', function(done) {
      var source = new ol.source.Vector();
      var drop = new ol.interaction.DragAndDrop({
        formatConstructors: [ol.format.GeoJSON],
        source: source
      });
      drop.setMap(map);

      drop.on('addfeatures', function(evt) {
        var features = source.getFeatures();
        expect(features.length).to.be(1);
        done();
      });

      var event = new ol.events.Event();
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
      expect(event.dataTransfer.dropEffect).to.be('copy');
      expect(event.propagationStopped).to.be(true);
    });
  });

});
