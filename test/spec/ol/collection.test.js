goog.provide('ol.test.Collection');

describe('ol.collection', function() {
  var collection;

  beforeEach(function() {
    collection = new ol.Collection();
  });

  describe('create an empty collection', function() {
    it('creates an empty collection', function() {
      expect(collection.getLength()).to.eql(0);
      expect(collection.getArray()).to.be.empty();
      expect(collection.item(0)).to.be(undefined);
    });
  });

  describe('create a collection from an array', function() {
    it('creates the expected collection', function() {
      var array = [0, 1, 2];
      var collection = new ol.Collection(array);
      expect(collection.item(0)).to.eql(0);
      expect(collection.item(1)).to.eql(1);
      expect(collection.item(2)).to.eql(2);
    });
  });

  describe('push to a collection', function() {
    it('adds elements to the collection', function() {
      collection.push(1);
      expect(collection.getLength()).to.eql(1);
      expect(collection.getArray()).to.eql([1]);
      expect(collection.item(0)).to.eql(1);
    });
  });

  describe('pop from a collection', function() {
    it('removes elements from the collection', function() {
      collection.push(1);
      collection.pop();
      expect(collection.getLength()).to.eql(0);
      expect(collection.getArray()).to.be.empty();
      expect(collection.item(0)).to.be(undefined);
    });
  });

  describe('insertAt', function() {
    it('inserts elements at the correct location', function() {
      collection = new ol.Collection([0, 2]);
      collection.insertAt(1, 1);
      expect(collection.item(0)).to.eql(0);
      expect(collection.item(1)).to.eql(1);
      expect(collection.item(2)).to.eql(2);
    });
  });

  describe('setAt', function() {
    it('sets at the correct location', function() {
      collection.setAt(1, 1);
      expect(collection.getLength()).to.eql(2);
      expect(collection.item(0)).to.be(undefined);
      expect(collection.item(1)).to.eql(1);
    });
  });

  describe('removeAt', function() {
    it('removes elements at the correction', function() {
      var collection = new ol.Collection([0, 1, 2]);
      collection.removeAt(1);
      expect(collection.item(0)).to.eql(0);
      expect(collection.item(1)).to.eql(2);
    });
  });

  describe('forEach', function() {
    var cb;
    beforeEach(function() {
      cb = sinon.spy();
    });
    describe('on an empty collection', function() {
      it('does not call the callback', function() {
        collection.forEach(cb);
        expect(cb).to.not.be.called();
      });
    });
    describe('on a non-empty collection', function() {
      it('does call the callback', function() {
        collection.push(1);
        collection.push(2);
        collection.forEach(cb);
        expect(cb.callCount).to.eql(2);
      });
    });
    describe('scope', function() {
      it('callbacks get the correct scope', function() {
        var collection = new ol.Collection([0]);
        var that;
        var uniqueObj = {};
        collection.forEach(function(elem) {
          that = this;
        }, uniqueObj);
        expect(that).to.be(uniqueObj);
      });
    });
  });

  describe('remove', function() {
    it('removes the first matching element', function() {
      var collection = new ol.Collection([0, 1, 2]);
      expect(collection.remove(1)).to.eql(1);
      expect(collection.getArray()).to.eql([0, 2]);
      expect(collection.getLength()).to.eql(2);
    });
    it('fires a remove event', function() {
      var collection = new ol.Collection([0, 1, 2]);
      var cb = sinon.spy();
      goog.events.listen(collection, ol.CollectionEventType.REMOVE, cb);
      expect(collection.remove(1)).to.eql(1);
      expect(cb).to.be.called();
      expect(cb.lastCall.args[0].element).to.eql(1);
    });
    it('does not remove more than one matching element', function() {
      var collection = new ol.Collection([0, 1, 1, 2]);
      expect(collection.remove(1)).to.eql(1);
      expect(collection.getArray()).to.eql([0, 1, 2]);
      expect(collection.getLength()).to.eql(3);
    });
    it('returns undefined if the element is not found', function() {
      var collection = new ol.Collection([0, 1, 2]);
      expect(collection.remove(3)).to.be(undefined);
      expect(collection.getArray()).to.eql([0, 1, 2]);
      expect(collection.getLength()).to.eql(3);
    });
  });

  describe('setAt and event', function() {
    it('does dispatch events', function() {
      var collection = new ol.Collection(['a', 'b']);
      var added, removed;
      goog.events.listen(collection, ol.CollectionEventType.ADD, function(e) {
        added = e.element;
      });
      goog.events.listen(
          collection, ol.CollectionEventType.REMOVE, function(e) {
            removed = e.element;
          });
      collection.setAt(1, 1);
      expect(added).to.eql(1);
      expect(removed).to.eql('b');
    });
  });

  describe('removeAt and event', function() {
    it('does dispatch events', function() {
      var collection = new ol.Collection(['a']);
      var removed;
      goog.events.listen(
          collection, ol.CollectionEventType.REMOVE, function(e) {
            removed = e.element;
          });
      collection.pop();
      expect(removed).to.eql('a');
    });
  });

  describe('insertAt and event', function() {
    it('does dispatch events', function() {
      var collection = new ol.Collection([0, 2]);
      var added;
      goog.events.listen(
          collection, ol.CollectionEventType.ADD, function(e) {
            added = e.element;
          });
      collection.insertAt(1, 1);
      expect(added).to.eql(1);
    });
  });

  describe('setAt beyond end', function() {
    it('triggers events properly', function() {
      var added = [];
      goog.events.listen(
          collection, ol.CollectionEventType.ADD, function(e) {
            added.push(e.element);
          });
      collection.setAt(2, 0);
      expect(collection.getLength()).to.eql(3);
      expect(collection.item(0)).to.be(undefined);
      expect(collection.item(1)).to.be(undefined);
      expect(collection.item(2)).to.eql(0);
      expect(added.length).to.eql(3);
      expect(added[0]).to.eql(undefined);
      expect(added[1]).to.eql(undefined);
      expect(added[2]).to.eql(0);
    });
  });

  describe('change:length event', function() {
    var collection, cb;
    beforeEach(function() {
      collection = new ol.Collection([0, 1, 2]);
      cb = sinon.spy();
      goog.events.listen(collection, 'change:length', cb);
    });

    describe('insertAt', function() {
      it('triggers change:length event', function() {
        collection.insertAt(2, 3);
        expect(cb).to.be.called();
      });
    });

    describe('removeAt', function() {
      it('triggers change:length event', function() {
        collection.removeAt(0);
        expect(cb).to.be.called();
      });
    });

    describe('setAt', function() {
      it('does not trigger change:length event', function() {
        collection.setAt(1, 1);
        expect(cb).to.not.be.called();
      });
    });
  });

  describe('add event', function() {
    it('triggers add when pushing', function() {
      var collection = new ol.Collection();
      var elem;
      goog.events.listen(collection, ol.CollectionEventType.ADD, function(e) {
        elem = e.element;
      });
      collection.push(1);
      expect(elem).to.eql(1);
    });
  });

  describe('remove event', function() {
    var collection, cb1, cb2;
    beforeEach(function() {
      collection = new ol.Collection([1]);
      cb1 = sinon.spy();
      cb2 = sinon.spy();
    });
    describe('setAt', function() {
      it('triggers remove', function() {
        goog.events.listen(collection, ol.CollectionEventType.ADD, cb1);
        goog.events.listen(collection, ol.CollectionEventType.REMOVE, cb2);
        collection.setAt(0, 2);
        expect(cb2.lastCall.args[0].element).to.eql(1);
        expect(cb1.lastCall.args[0].element).to.eql(2);
      });
    });
    describe('pop', function() {
      it('triggers remove', function() {
        goog.events.listen(collection, ol.CollectionEventType.REMOVE, cb1);
        collection.pop();
        expect(cb1.lastCall.args[0].element).to.eql(1);
      });
    });
  });

  describe('extending a collection', function() {
    it('adds elements to end of the collection', function() {
      collection.extend([1, 2]);
      expect(collection.getLength()).to.eql(2);
      expect(collection.getArray()).to.eql([1, 2]);
      expect(collection.item(0)).to.eql(1);
      expect(collection.item(1)).to.eql(2);
    });
    it('fires events', function() {
      var collection = new ol.Collection();
      var elems = [];
      goog.events.listen(collection, ol.CollectionEventType.ADD, function(e) {
        elems.push(e.element);
      });
      collection.extend([1, 2]);
      expect(elems).to.eql([1, 2]);
    });
  });

});


goog.require('goog.events');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
