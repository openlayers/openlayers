goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('ol.Collection');
goog.require('ol.CollectionEventType');


function testEmpty() {
  var collection = new ol.Collection();
  assertEquals(0, collection.getLength());
  assertTrue(goog.array.equals(collection.getArray(), []));
  assertUndefined(collection.getAt(0));
}


function testConstruct() {
  var array = [0, 1, 2];
  var collection = new ol.Collection(array);
  assertEquals(0, collection.getAt(0));
  assertEquals(1, collection.getAt(1));
  assertEquals(2, collection.getAt(2));
}


function testPush() {
  var collection = new ol.Collection();
  collection.push(1);
  assertEquals(1, collection.getLength());
  assertTrue(goog.array.equals(collection.getArray(), [1]));
  assertEquals(1, collection.getAt(0));
}


function testPushPop() {
  var collection = new ol.Collection();
  collection.push(1);
  collection.pop();
  assertEquals(0, collection.getLength());
  assertTrue(goog.array.equals(collection.getArray(), []));
  assertUndefined(collection.getAt(0));
}


function testInsertAt() {
  var collection = new ol.Collection([0, 2]);
  collection.insertAt(1, 1);
  assertEquals(0, collection.getAt(0));
  assertEquals(1, collection.getAt(1));
  assertEquals(2, collection.getAt(2));
}


function testSetAt() {
  var collection = new ol.Collection();
  collection.setAt(1, 1);
  assertEquals(2, collection.getLength());
  assertUndefined(collection.getAt(0));
  assertEquals(1, collection.getAt(1));
}


function testRemoveAt() {
  var collection = new ol.Collection([0, 1, 2]);
  collection.removeAt(1);
  assertEquals(0, collection.getAt(0));
  assertEquals(2, collection.getAt(1));
}


function testForEachEmpty() {
  var collection = new ol.Collection();
  var forEachCalled = false;
  collection.forEach(function() {
    forEachCalled = true;
  });
  assertFalse(forEachCalled);
}


function testForEachPopulated() {
  var collection = new ol.Collection();
  collection.push(1);
  collection.push(2);
  var forEachCount = 0;
  collection.forEach(function() {
    ++forEachCount;
  });
  assertEquals(2, forEachCount);
}


function testSetAtEvent() {
  var collection = new ol.Collection(['a', 'b']);
  var index, prev;
  goog.events.listen(collection, ol.CollectionEventType.SET_AT, function(e) {
    index = e.index;
    prev = e.prev;
  });
  collection.setAt(1, 1);
  assertEquals(1, index);
  assertEquals('b', prev);
}


function testRemoveAtEvent() {
  var collection = new ol.Collection(['a']);
  var index, prev;
  goog.events.listen(collection, ol.CollectionEventType.REMOVE_AT, function(e) {
    index = e.index;
    prev = e.prev;
  });
  collection.pop();
  assertEquals(0, index);
  assertEquals('a', prev);
}


function testInsertAtEvent() {
  var collection = new ol.Collection([0, 2]);
  var index;
  goog.events.listen(collection, ol.CollectionEventType.INSERT_AT, function(e) {
    index = e.index;
  });
  collection.insertAt(1, 1);
  assertEquals(1, index);
}


function testSetAtBeyondEnd() {
  var collection = new ol.Collection();
  var inserts = [];
  collection.insert_at = function(index) {
    inserts.push(index);
  };
  collection.setAt(2, 0);
  assertEquals(3, collection.getLength());
  assertUndefined(collection.getAt(0));
  assertUndefined(collection.getAt(1));
  assertEquals(0, collection.getAt(2));
  assertEquals(3, inserts.length);
  assertEquals(0, inserts[0]);
  assertEquals(1, inserts[1]);
  assertEquals(2, inserts[2]);
}


function testCreateFromArray() {
  var array = [0, 1, 2];
  var collection = ol.Collection.create(array);
  assertTrue(collection instanceof ol.Collection);
  assertEquals(3, collection.getLength());
  assertEquals(0, collection.getAt(0));
  assertEquals(1, collection.getAt(1));
  assertEquals(2, collection.getAt(2));
}


function testCreateFromCollection() {
  var collection1 = new ol.Collection();
  var collection2 = ol.Collection.create(collection1);
  assertTrue(collection1 === collection2);
}


function testLengthChangeInsertAt() {
  var collection = ol.Collection.create([0, 1, 2]);
  var lengthChangedCalled;
  collection.length_changed = function() {
    lengthChangedCalled = true;
  };
  collection.insertAt(2, 3);
  assertTrue(lengthChangedCalled);
}


function testLengthChangeRemoveAt() {
  var collection = ol.Collection.create([0, 1, 2]);
  var lengthChangedCalled;
  collection.length_changed = function() {
    lengthChangedCalled = true;
  };
  collection.removeAt(0);
  assertTrue(lengthChangedCalled);
}


function testLengthChangeSetAt() {
  var collection = ol.Collection.create([0, 1, 2]);
  var lengthChangedCalled;
  collection.length_changed = function() {
    lengthChangedCalled = true;
  };
  collection.setAt(1, 1);
  assertUndefined(lengthChangedCalled);
}


function testForEach() {
  var collection = ol.Collection.create([1, 2, 4]);
  var sum = 0;
  collection.forEach(function(elem) {
    sum += elem;
  });
  assertEquals(7, sum);
}


function testForEachScope() {
  var collection = ol.Collection.create([0]);
  var that;
  var uniqueObj = {};
  collection.forEach(function(elem) {
    that = this;
  }, uniqueObj);
  assertTrue(that === uniqueObj);
}
