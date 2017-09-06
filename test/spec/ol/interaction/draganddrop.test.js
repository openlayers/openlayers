

import _ol_ from '../../../../src/ol';
import _ol_View_ from '../../../../src/ol/view';
import _ol_events_Event_ from '../../../../src/ol/events/event';
import _ol_events_EventTarget_ from '../../../../src/ol/events/eventtarget';
import _ol_format_GeoJSON_ from '../../../../src/ol/format/geojson';
import _ol_interaction_DragAndDrop_ from '../../../../src/ol/interaction/draganddrop';
import _ol_source_Vector_ from '../../../../src/ol/source/vector';

where('FileReader').describe('ol.interaction.DragAndDrop', function() {
  var viewport, map, interaction;

  beforeEach(function() {
    viewport = new _ol_events_EventTarget_();
    map = {
      getViewport: function() {
        return viewport;
      },
      getView: function() {
        return new _ol_View_();
      }
    };
    interaction = new _ol_interaction_DragAndDrop_({
      formatConstructors: [_ol_format_GeoJSON_]
    });
  });

  describe('constructor', function() {

    it('can be constructed without arguments', function() {
      var interaction = new _ol_interaction_DragAndDrop_();
      expect(interaction).to.be.an(_ol_interaction_DragAndDrop_);
    });

    it('sets formatConstructors on the instance', function() {
      expect(interaction.formatConstructors_).to.have.length(1);
    });

    it('accepts a source option', function() {
      var source = new _ol_source_Vector_();
      var drop = new _ol_interaction_DragAndDrop_({
        formatConstructors: [_ol_format_GeoJSON_],
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
      var customTarget = new _ol_events_EventTarget_();
      interaction = new _ol_interaction_DragAndDrop_({
        formatConstructors: [_ol_format_GeoJSON_],
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
        _ol_events_EventTarget_.apply(this, arguments);
        this.readAsText = function(file) {
          this.result = file;
          this.dispatchEvent('load');
        };
      };
      _ol_.inherits(FileReader, _ol_events_EventTarget_);
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
      var event = new _ol_events_Event_();
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
      var source = new _ol_source_Vector_();
      var drop = new _ol_interaction_DragAndDrop_({
        formatConstructors: [_ol_format_GeoJSON_],
        source: source
      });
      drop.setMap(map);

      drop.on('addfeatures', function(evt) {
        var features = source.getFeatures();
        expect(features.length).to.be(1);
        done();
      });

      var event = new _ol_events_Event_();
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
