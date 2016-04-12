goog.provide('ol.test.interaction.DragAndDrop');

describe('ol.interaction.DragAndDrop', function() {
  var viewport, map, interaction;

  beforeEach(function() {
    viewport = new ol.events.EventTarget();
    map = {
      getViewport: function() {
        return viewport;
      },
      getView: function() {
        return new ol.View()
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


  });

  describe('#setMap()', function() {
    it('registers and unregisters listeners', function() {
      interaction.setMap(map);
      expect(viewport.hasListener(ol.events.EventType.DRAGENTER)).to.be(true);
      expect(viewport.hasListener(ol.events.EventType.DRAGOVER)).to.be(true);
      expect(viewport.hasListener(ol.events.EventType.DROP)).to.be(true);
      interaction.setMap(null);
      expect(viewport.hasListener(ol.events.EventType.DRAGENTER)).to.be(false);
      expect(viewport.hasListener(ol.events.EventType.DRAGOVER)).to.be(false);
      expect(viewport.hasListener(ol.events.EventType.DROP)).to.be(false);
    });

    it('registers and unregisters listeners on a custom target', function() {
      var customTarget = new ol.events.EventTarget();
      interaction = new ol.interaction.DragAndDrop({
        formatConstructors: [ol.format.GeoJSON],
        target: customTarget
      });
      interaction.setMap(map);
      expect(customTarget.hasListener(ol.events.EventType.DRAGENTER)).to.be(true);
      expect(customTarget.hasListener(ol.events.EventType.DRAGOVER)).to.be(true);
      expect(customTarget.hasListener(ol.events.EventType.DROP)).to.be(true);
      interaction.setMap(null);
      expect(customTarget.hasListener(ol.events.EventType.DRAGENTER)).to.be(false);
      expect(customTarget.hasListener(ol.events.EventType.DRAGOVER)).to.be(false);
      expect(customTarget.hasListener(ol.events.EventType.DROP)).to.be(false);
    });
  });

  describe('#handleDrop_', function() {
    var origFileReader = ol.global.FileReader;

    beforeEach(function() {
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
      ol.global.FileReader = origFileReader;
    });

    it('reads dropped files', function(done) {
      interaction.on('addfeatures', function(evt) {
        expect(evt.features.length).to.be(1);
        done();
      });
      interaction.setMap(map);
      var event = new ol.events.Event();
      event.dataTransfer = {};
      event.type = ol.events.EventType.DRAGENTER;
      viewport.dispatchEvent(event);
      event.type = ol.events.EventType.DRAGOVER;
      viewport.dispatchEvent(event);
      event.type = ol.events.EventType.DROP;
      event.dataTransfer.files = {
        length: 1,
        item: function() {
          return JSON.stringify({
            type: 'FeatureCollection',
            features: [{type: 'Feature', id: '1'}]
          });
        }
      }
      viewport.dispatchEvent(event);
      expect(event.dataTransfer.dropEffect).to.be('copy');
      expect(event.propagationStopped).to.be(true);
    });
  });

});

goog.require('ol.interaction.DragAndDrop');
goog.require('ol.View');
goog.require('ol.events.Event');
goog.require('ol.events.EventTarget');
goog.require('ol.events.EventType');
goog.require('ol.format.GeoJSON');
