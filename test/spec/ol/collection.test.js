import {listen} from '../../../src/ol/events.js';
import Collection from '../../../src/ol/Collection.js';
import CollectionEventType from '../../../src/ol/CollectionEventType.js';


describe('ol.collection', () => {
  let collection;

  beforeEach(() => {
    collection = new Collection();
  });

  describe('create an empty collection', () => {
    test('creates an empty collection', () => {
      expect(collection.getLength()).toEqual(0);
      expect(collection.getArray()).toHaveLength(0);
      expect(collection.item(0)).toBe(undefined);
    });
  });

  describe('create a collection from an array', () => {
    test('creates the expected collection', () => {
      const array = [0, 1, 2];
      const collection = new Collection(array);
      expect(collection.item(0)).toEqual(0);
      expect(collection.item(1)).toEqual(1);
      expect(collection.item(2)).toEqual(2);
    });
  });

  describe('push to a collection', () => {
    test('adds elements to the collection', () => {
      const length = collection.push(1);
      expect(collection.getLength()).toEqual(length);
      expect(collection.getArray()).toEqual([1]);
      expect(collection.item(0)).toEqual(1);
    });
    test('returns the correct new length of the collection', () => {
      let length;
      listen(collection, 'add', function(event) {
        if (event.element === 'remove_me') {
          collection.remove(event.element);
        }
      });
      length = collection.push('keep_me');
      expect(collection.getLength()).toEqual(length);
      length = collection.push('remove_me');
      expect(collection.getLength()).toEqual(length);
    });
  });

  describe('pop from a collection', () => {
    test('removes elements from the collection', () => {
      collection.push(1);
      collection.pop();
      expect(collection.getLength()).toEqual(0);
      expect(collection.getArray()).toHaveLength(0);
      expect(collection.item(0)).toBe(undefined);
    });
  });

  describe('insertAt', () => {
    test('inserts elements at the correct location', () => {
      collection = new Collection([0, 2]);
      collection.insertAt(1, 1);
      expect(collection.item(0)).toEqual(0);
      expect(collection.item(1)).toEqual(1);
      expect(collection.item(2)).toEqual(2);
    });
  });

  describe('setAt', () => {
    test('sets at the correct location', () => {
      collection.setAt(1, 1);
      expect(collection.getLength()).toEqual(2);
      expect(collection.item(0)).toBe(undefined);
      expect(collection.item(1)).toEqual(1);
    });
  });

  describe('removeAt', () => {
    test('removes elements at the correction', () => {
      const collection = new Collection([0, 1, 2]);
      collection.removeAt(1);
      expect(collection.item(0)).toEqual(0);
      expect(collection.item(1)).toEqual(2);
    });
  });

  describe('forEach', () => {
    let cb;
    beforeEach(() => {
      cb = sinon.spy();
    });
    describe('on an empty collection', () => {
      test('does not call the callback', () => {
        collection.forEach(cb);
        expect(cb).to.not.be.called();
      });
    });
    describe('on a non-empty collection', () => {
      test('does call the callback', () => {
        collection.push(1);
        collection.push(2);
        collection.forEach(cb);
        expect(cb.callCount).toEqual(2);
      });
    });
  });

  describe('remove', () => {
    test('removes the first matching element', () => {
      const collection = new Collection([0, 1, 2]);
      expect(collection.remove(1)).toEqual(1);
      expect(collection.getArray()).toEqual([0, 2]);
      expect(collection.getLength()).toEqual(2);
    });
    test('fires a remove event', () => {
      const collection = new Collection([0, 1, 2]);
      const cb = sinon.spy();
      listen(collection, CollectionEventType.REMOVE, cb);
      expect(collection.remove(1)).toEqual(1);
      expect(cb).to.be.called();
      expect(cb.lastCall.args[0].element).toEqual(1);
    });
    test('does not remove more than one matching element', () => {
      const collection = new Collection([0, 1, 1, 2]);
      expect(collection.remove(1)).toEqual(1);
      expect(collection.getArray()).toEqual([0, 1, 2]);
      expect(collection.getLength()).toEqual(3);
    });
    test('returns undefined if the element is not found', () => {
      const collection = new Collection([0, 1, 2]);
      expect(collection.remove(3)).toBe(undefined);
      expect(collection.getArray()).toEqual([0, 1, 2]);
      expect(collection.getLength()).toEqual(3);
    });
  });

  describe('setAt and event', () => {
    test('does dispatch events', () => {
      const collection = new Collection(['a', 'b']);
      let added, removed, addedIndex, removedIndex;
      listen(collection, CollectionEventType.ADD, function(e) {
        added = e.element;
        addedIndex = e.index;
      });
      listen(collection, CollectionEventType.REMOVE, function(e) {
        removed = e.element;
        removedIndex = e.index;
      });
      collection.setAt(1, 1);
      expect(added).toEqual(1);
      expect(addedIndex).toEqual(1);
      expect(removed).toEqual('b');
      expect(removedIndex).toEqual(1);
    });
  });

  describe('removeAt and event', () => {
    test('does dispatch events', () => {
      const collection = new Collection(['a']);
      let removed, removedIndex;
      listen(collection, CollectionEventType.REMOVE, function(e) {
        removed = e.element;
        removedIndex = e.index;
      });
      collection.pop();
      expect(removed).toEqual('a');
      expect(removedIndex).toEqual(0);
    });
  });

  describe('insertAt and event', () => {
    test('does dispatch events', () => {
      const collection = new Collection([0, 2]);
      let added, addedIndex;
      listen(collection, CollectionEventType.ADD, function(e) {
        added = e.element;
        addedIndex = e.index;
      });
      collection.insertAt(1, 1);
      expect(added).toEqual(1);
      expect(addedIndex).toEqual(1);
    });
  });

  describe('setAt beyond end', () => {
    test('triggers events properly', () => {
      const added = [], addedIndexes = [];
      listen(collection, CollectionEventType.ADD, function(e) {
        added.push(e.element);
        addedIndexes.push(e.index);
      });
      collection.setAt(2, 0);
      expect(collection.getLength()).toEqual(3);
      expect(collection.item(0)).toBe(undefined);
      expect(collection.item(1)).toBe(undefined);
      expect(collection.item(2)).toEqual(0);
      expect(added.length).toEqual(3);
      expect(added[0]).toEqual(undefined);
      expect(added[1]).toEqual(undefined);
      expect(added[2]).toEqual(0);
      expect(addedIndexes).toEqual([0, 1, 2]);
    });
  });

  describe('change:length event', () => {
    let collection, cb;
    beforeEach(() => {
      collection = new Collection([0, 1, 2]);
      cb = sinon.spy();
      listen(collection, 'change:length', cb);
    });

    describe('insertAt', () => {
      test('triggers change:length event', () => {
        collection.insertAt(2, 3);
        expect(cb).to.be.called();
      });
    });

    describe('removeAt', () => {
      test('triggers change:length event', () => {
        collection.removeAt(0);
        expect(cb).to.be.called();
      });
    });

    describe('setAt', () => {
      test('does not trigger change:length event', () => {
        collection.setAt(1, 1);
        expect(cb).to.not.be.called();
      });
    });
  });

  describe('add event', () => {
    test('triggers add when pushing', () => {
      const collection = new Collection();
      let elem, addedIndex;
      listen(collection, CollectionEventType.ADD, function(e) {
        elem = e.element;
        addedIndex = e.index;
      });
      const length = collection.push(1);
      expect(elem).toEqual(length);
      expect(addedIndex).toEqual(0);
    });
  });

  describe('remove event', () => {
    let collection, cb1, cb2;
    beforeEach(() => {
      collection = new Collection([1]);
      cb1 = sinon.spy();
      cb2 = sinon.spy();
    });
    describe('setAt', () => {
      test('triggers remove', () => {
        listen(collection, CollectionEventType.ADD, cb1);
        listen(collection, CollectionEventType.REMOVE, cb2);
        collection.setAt(0, 2);
        expect(cb2.lastCall.args[0].element).toEqual(1);
        expect(cb1.lastCall.args[0].element).toEqual(2);
      });
    });
    describe('pop', () => {
      test('triggers remove', () => {
        listen(collection, CollectionEventType.REMOVE, cb1);
        collection.pop();
        expect(cb1.lastCall.args[0].element).toEqual(1);
      });
    });
  });

  describe('extending a collection', () => {
    test('adds elements to end of the collection', () => {
      collection.extend([1, 2]);
      expect(collection.getLength()).toEqual(2);
      expect(collection.getArray()).toEqual([1, 2]);
      expect(collection.item(0)).toEqual(1);
      expect(collection.item(1)).toEqual(2);
    });
    test('fires events', () => {
      const collection = new Collection();
      const elems = [], addedIndexes = [];
      listen(collection, CollectionEventType.ADD, function(e) {
        elems.push(e.element);
        addedIndexes.push(e.index);
      });
      collection.extend([1, 2]);
      expect(elems).toEqual([1, 2]);
      expect(addedIndexes).toEqual([0, 1]);
    });
  });

  describe('unique collection', () => {
    test('allows unique items in the constructor', () => {
      new Collection([{}, {}, {}], {unique: true});
    });

    test('throws if duplicate items are passed to the constructor', () => {
      const item = {};
      const call = function() {
        new Collection([item, item], {unique: true});
      };
      expect(call).toThrow();
    });

    test('allows unique items to be added via push', () => {
      const unique = new Collection(undefined, {unique: true});
      unique.push({});
      unique.push({});
    });

    test('throws if duplicate items are added via push', () => {
      const unique = new Collection(undefined, {unique: true});
      const item = {};
      unique.push(item);
      const call = function() {
        unique.push(item);
      };
      expect(call).toThrow();
    });

    test('allows unique items to be added via insertAt', () => {
      const unique = new Collection(undefined, {unique: true});
      unique.insertAt(0, {});
      unique.insertAt(0, {});
    });

    test('throws if duplicate items are added via insertAt', () => {
      const unique = new Collection(undefined, {unique: true});
      const item = {};
      unique.insertAt(0, item);
      const call = function() {
        unique.insertAt(0, item);
      };
      expect(call).toThrow();
    });

    test('allows unique items to be added via setAt', () => {
      const unique = new Collection(undefined, {unique: true});
      unique.setAt(0, {});
      unique.setAt(1, {});
    });

    test('allows items to be reset via setAt', () => {
      const unique = new Collection(undefined, {unique: true});
      const item = {};
      unique.setAt(0, item);
      unique.setAt(0, item);
    });

    test('throws if duplicate items are added via setAt', () => {
      const unique = new Collection(undefined, {unique: true});
      const item = {};
      unique.setAt(0, item);
      const call = function() {
        unique.setAt(1, item);
      };
      expect(call).toThrow();
    });

  });

});
