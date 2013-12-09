goog.provide('ol.test.Transaction');

describe('ol.Transaction', function() {

  function values(obj) {
    var items = [];
    for (var key in obj) {
      items.push(obj[key]);
    }
    return items;
  }

  describe('constructor', function() {

    it('creates a new transaction', function() {
      var transaction = new ol.Transaction();
      expect(transaction).to.be.a(ol.Transaction);
    });

  });

  describe('constructor', function() {

    it('creates a new transaction', function() {
      var transaction = new ol.Transaction();
      expect(transaction).to.be.a(ol.Transaction);
    });

  });

  describe('#handleFeatureAdd_()', function() {

    it('adds features to the inserts lookup', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureAdd_({features: features});

      var inserts = values(transaction.getInserts());
      expect(inserts).to.have.length(2);
      expect(inserts).to.contain(features[0]);
      expect(inserts).to.contain(features[1]);
    });

    it('trumps change and remove handlers', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureRemove_({features: [features[0]]});
      transaction.handleFeatureChange_({features: [features[1]]});
      transaction.handleFeatureAdd_({features: features});

      var inserts = values(transaction.getInserts());
      expect(inserts).to.have.length(2);
      expect(inserts).to.contain(features[0]);
      expect(inserts).to.contain(features[1]);

      var updates = values(transaction.getUpdates());
      expect(updates).to.have.length(0);

      var deletes = values(transaction.getDeletes());
      expect(deletes).to.have.length(0);
    });

  });

  describe('#handleFeatureChange_()', function() {

    it('adds features to the updates lookup', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureChange_({features: features});

      var updates = values(transaction.getUpdates());
      expect(updates).to.have.length(2);
      expect(updates).to.contain(features[0]);
      expect(updates).to.contain(features[1]);
    });

    it('does not convert inserts to updates', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureAdd_({features: [features[0]]});
      transaction.handleFeatureChange_({features: features});

      var inserts = values(transaction.getInserts());
      expect(inserts).to.have.length(1);
      expect(inserts).to.contain(features[0]);

      var updates = values(transaction.getUpdates());
      expect(updates).to.have.length(1);
      expect(updates).to.contain(features[1]);
    });

  });

  describe('#handleFeatureRemove_()', function() {

    it('adds features to the deletes lookup', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureRemove_({features: features});

      var deletes = values(transaction.getDeletes());
      expect(deletes).to.have.length(2);
      expect(deletes).to.contain(features[0]);
      expect(deletes).to.contain(features[1]);
    });

    it('removes inserts but does not track as delete', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureAdd_({features: [features[0]]});
      transaction.handleFeatureRemove_({features: features});

      var inserts = values(transaction.getInserts());
      expect(inserts).to.have.length(0);

      var deletes = values(transaction.getDeletes());
      expect(deletes).to.have.length(1);
      expect(deletes).to.contain(features[1]);
    });

    it('moves updates to deletes', function() {
      var features = [new ol.Feature(), new ol.Feature()];

      var transaction = new ol.Transaction();
      transaction.handleFeatureChange_({features: [features[0]]});
      transaction.handleFeatureRemove_({features: features});

      var updates = values(transaction.getUpdates());
      expect(updates).to.have.length(0);

      var deletes = values(transaction.getDeletes());
      expect(deletes).to.have.length(2);
      expect(deletes).to.contain(features[0]);
      expect(deletes).to.contain(features[1]);
    });

  });

});

goog.require('ol.Feature');
goog.require('ol.Transaction');
