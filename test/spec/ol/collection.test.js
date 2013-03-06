goog.provide('ol.test.Collection');

describe('ol.collection', function() {
  var collection;

  beforeEach(function() {
    collection = new ol.Collection();
  });

  describe('create an empty collection', function() {
    it('creates an empty collection', function() {
      expect(collection.getLength()).toEqual(0);
      expect(goog.array.equals(collection.getArray(), [])).toBeTruthy();
      expect(collection.getAt(0)).toBeUndefined();
    });
  });

  describe('create a collection from an array', function() {
    it('creates the expected collection', function() {
      var array = [0, 1, 2];
      var collection = new ol.Collection(array);
      expect(collection.getAt(0)).toEqual(0);
      expect(collection.getAt(1)).toEqual(1);
      expect(collection.getAt(2)).toEqual(2);
    });
  });

  describe('push to a collection', function() {
    it('adds elements to the collection', function() {
      collection.push(1);
      expect(collection.getLength()).toEqual(1);
      expect(goog.array.equals(collection.getArray(), [1])).toBeTruthy();
      expect(collection.getAt(0)).toEqual(1);
    });
  });

  describe('pop from a collection', function() {
    it('removes elements from the collection', function() {
      collection.push(1);
      collection.pop();
      expect(collection.getLength()).toEqual(0);
      expect(goog.array.equals(collection.getArray(), [])).toBeTruthy();
      expect(collection.getAt(0)).toBeUndefined();
    });
  });

  describe('insertAt', function() {
    it('inserts elements at the correct location', function() {
      collection = new ol.Collection([0, 2]);
      collection.insertAt(1, 1);
      expect(collection.getAt(0)).toEqual(0);
      expect(collection.getAt(1)).toEqual(1);
      expect(collection.getAt(2)).toEqual(2);
    });
  });

  describe('setAt', function() {
    it('sets at the correct location', function() {
      collection.setAt(1, 1);
      expect(collection.getLength()).toEqual(2);
      expect(collection.getAt(0)).toBeUndefined();
      expect(collection.getAt(1)).toEqual(1);
    });
  });

  describe('removeAt', function() {
    it('removes elements at the correction', function() {
      var collection = new ol.Collection([0, 1, 2]);
      collection.removeAt(1);
      expect(collection.getAt(0)).toEqual(0);
      expect(collection.getAt(1)).toEqual(2);
    });
  });

  describe('forEach', function() {
    var cb;
    beforeEach(function() {
      cb = jasmine.createSpy();
    });
    describe('on an empty collection', function() {
      it('does not call the callback', function() {
        collection.forEach(cb);
        expect(cb).not.toHaveBeenCalled();
      });
    });
    describe('on a non-empty collection', function() {
      it('does call the callback', function() {
        collection.push(1);
        collection.push(2);
        collection.forEach(cb);
        expect(cb.calls.length).toEqual(2);
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
        expect(that).toBe(uniqueObj);
      });
    });
  });

  describe('setAt and event', function() {
    it('does dispatch events', function() {
      var collection = new ol.Collection(['a', 'b']);
      var added, removed;
      goog.events.listen(collection, ol.CollectionEventType.ADD, function(e) {
        added = e.elem;
      });
      goog.events.listen(
          collection, ol.CollectionEventType.REMOVE, function(e) {
            removed = e.elem;
          });
      collection.setAt(1, 1);
      expect(added).toEqual(1);
      expect(removed).toEqual('b');
    });
  });

  describe('removeAt and event', function() {
    it('does dispatch events', function() {
      var collection = new ol.Collection(['a']);
      var removed;
      goog.events.listen(
          collection, ol.CollectionEventType.REMOVE, function(e) {
            removed = e.elem;
          });
      collection.pop();
      expect(removed).toEqual('a');
    });
  });

  describe('insertAt and event', function() {
    it('does dispatch events', function() {
      var collection = new ol.Collection([0, 2]);
      var added;
      goog.events.listen(
          collection, ol.CollectionEventType.ADD, function(e) {
            added = e.elem;
          });
      collection.insertAt(1, 1);
      expect(added).toEqual(1);
    });
  });

  describe('setAt beyond end', function() {
    it('triggers events properly', function() {
      var added = [];
      goog.events.listen(
          collection, ol.CollectionEventType.ADD, function(e) {
            added.push(e.elem);
          });
      collection.setAt(2, 0);
      expect(collection.getLength()).toEqual(3);
      expect(collection.getAt(0)).toBeUndefined();
      expect(collection.getAt(1)).toBeUndefined();
      expect(collection.getAt(2)).toEqual(0);
      expect(added.length).toEqual(3);
      expect(added[0]).toEqual(undefined);
      expect(added[1]).toEqual(undefined);
      expect(added[2]).toEqual(0);
    });
  });

  describe('length_changed event', function() {
    var collection, cb;
    beforeEach(function() {
      collection = new ol.Collection([0, 1, 2]);
      cb = jasmine.createSpy();
      goog.events.listen(collection, 'length_changed', cb);
    });

    describe('insertAt', function() {
      it('triggers length_changed event', function() {
        collection.insertAt(2, 3);
        expect(cb).toHaveBeenCalled();
      });
    });

    describe('removeAt', function() {
      it('triggers length_changed event', function() {
        collection.removeAt(0);
        expect(cb).toHaveBeenCalled();
      });
    });

    describe('setAt', function() {
      it('does not trigger length_changed event', function() {
        collection.setAt(1, 1);
        expect(cb).not.toHaveBeenCalled();
      });
    });
  });

  describe('add event', function() {
    it('triggers add when pushing', function() {
      var collection = new ol.Collection();
      var elem;
      goog.events.listen(collection, ol.CollectionEventType.ADD, function(e) {
        elem = e.elem;
      });
      collection.push(1);
      expect(elem).toEqual(1);
    });
  });

  describe('remove event', function() {
    var collection, cb1, cb2;
    beforeEach(function() {
      collection = new ol.Collection([1]);
      cb1 = jasmine.createSpy();
      cb2 = jasmine.createSpy();
    });
    describe('setAt', function() {
      it('triggers remove', function() {
        goog.events.listen(collection, ol.CollectionEventType.ADD, cb1);
        goog.events.listen(collection, ol.CollectionEventType.REMOVE, cb2);
        collection.setAt(0, 2);
        expect(cb1.mostRecentCall.args[0].elem).toEqual(2);
        expect(cb2.mostRecentCall.args[0].elem).toEqual(1);
      });
    });
    describe('pop', function() {
      it('triggers remove', function() {
        var elem;
        goog.events.listen(collection, ol.CollectionEventType.REMOVE, cb1);
        collection.pop();
        expect(cb1.mostRecentCall.args[0].elem).toEqual(1);
      });
    });
  });

  describe('extending a collection', function() {
    it('adds elements to end of the collection', function() {
      collection.extend([1, 2]);
      expect(collection.getLength()).toEqual(2);
      expect(goog.array.equals(collection.getArray(), [1, 2])).toBeTruthy();
      expect(collection.getAt(0)).toEqual(1);
      expect(collection.getAt(1)).toEqual(2);
    });
  });

});

goog.require('goog.array');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');
