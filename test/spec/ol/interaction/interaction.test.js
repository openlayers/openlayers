

goog.require('ol.Map');
goog.require('ol.View');
goog.require('ol.events.EventTarget');
goog.require('ol.interaction.Interaction');

describe('ol.interaction.Interaction', function() {

  describe('constructor', function() {
    var interaction;

    beforeEach(function() {
      interaction = new ol.interaction.Interaction({});
    });

    it('creates a new interaction', function() {
      expect(interaction).to.be.a(ol.interaction.Interaction);
      expect(interaction).to.be.a(ol.events.EventTarget);
    });

    it('creates an active interaction', function() {
      expect(interaction.getActive()).to.be(true);
    });

  });

  describe('#getMap()', function() {

    it('retrieves the associated map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction({});
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('returns null if no map', function() {
      var interaction = new ol.interaction.Interaction({});
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('#setMap()', function() {

    it('allows a map to be set', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction({});
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('accepts null', function() {
      var interaction = new ol.interaction.Interaction({});
      interaction.setMap(null);
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('zoomByDelta()', function() {

    it('changes view resolution', function() {
      var view = new ol.View({
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      ol.interaction.Interaction.zoomByDelta(view, 1);
      expect(view.getResolution()).to.be(0.5);

      ol.interaction.Interaction.zoomByDelta(view, -1);
      expect(view.getResolution()).to.be(1);

      ol.interaction.Interaction.zoomByDelta(view, 2);
      expect(view.getResolution()).to.be(0.25);

      ol.interaction.Interaction.zoomByDelta(view, -2);
      expect(view.getResolution()).to.be(1);
    });

    it('changes view resolution and center relative to the anchor', function() {
      var view = new ol.View({
        center: [0, 0],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      ol.interaction.Interaction.zoomByDelta(view, 1, [10, 10]);
      expect(view.getCenter()).to.eql([5, 5]);

      ol.interaction.Interaction.zoomByDelta(view, -1, [0, 0]);
      expect(view.getCenter()).to.eql([10, 10]);

      ol.interaction.Interaction.zoomByDelta(view, 2, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      ol.interaction.Interaction.zoomByDelta(view, -2, [0, 0]);
      expect(view.getCenter()).to.eql([10, 10]);
    });

    it('changes view resolution and center relative to the anchor, while respecting the extent', function() {
      var view = new ol.View({
        center: [0, 0],
        extent: [-2.5, -2.5, 2.5, 2.5],
        resolution: 1,
        resolutions: [4, 2, 1, 0.5, 0.25]
      });

      ol.interaction.Interaction.zoomByDelta(view, 1, [10, 10]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      ol.interaction.Interaction.zoomByDelta(view, -1, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      ol.interaction.Interaction.zoomByDelta(view, 2, [10, 10]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);

      ol.interaction.Interaction.zoomByDelta(view, -2, [0, 0]);
      expect(view.getCenter()).to.eql([2.5, 2.5]);
    });
  });

});
