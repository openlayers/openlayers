goog.provide('ol.test.interaction.Interaction');

describe('ol.interaction.Interaction', function() {

  describe('constructor', function() {

    it('creates a new interaction', function() {
      var interaction = new ol.interaction.Interaction();
      expect(interaction).to.be.a(ol.interaction.Interaction);
      expect(interaction).to.be.a(ol.Observable);
    });

  });

  describe('#getMap()', function() {

    it('retrieves the associated map', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction();
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('returns null if no map', function() {
      var interaction = new ol.interaction.Interaction();
      expect(interaction.getMap()).to.be(null);
    });

  });

  describe('#setMap()', function() {

    it('allows a map to be set', function() {
      var map = new ol.Map({});
      var interaction = new ol.interaction.Interaction();
      interaction.setMap(map);
      expect(interaction.getMap()).to.be(map);
    });

    it('accepts null', function() {
      var interaction = new ol.interaction.Interaction();
      interaction.setMap(null);
      expect(interaction.getMap()).to.be(null);
    });

  });

});

goog.require('ol.Map');
goog.require('ol.Observable');
goog.require('ol.interaction.Interaction');
