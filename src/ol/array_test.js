goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('ol.Array');
goog.require('ol.ArrayEventType');


function testEmpty() {
  var a = new ol.Array();
  assertEquals(0, a.getLength());
  assertTrue(goog.array.equals(a.getArray(), []));
  assertUndefined(a.getAt(0));
}


function testConstruct() {
  var array = [0, 1, 2];
  var a = new ol.Array(array);
  assertEquals(0, a.getAt(0));
  assertEquals(1, a.getAt(1));
  assertEquals(2, a.getAt(2));
}


function testPush() {
  var a = new ol.Array();
  a.push(1);
  assertEquals(1, a.getLength());
  assertTrue(goog.array.equals(a.getArray(), [1]));
  assertEquals(1, a.getAt(0));
}


function testPushPop() {
  var a = new ol.Array();
  a.push(1);
  a.pop();
  assertEquals(0, a.getLength());
  assertTrue(goog.array.equals(a.getArray(), []));
  assertUndefined(a.getAt(0));
}


function testInsertAt() {
  var a = new ol.Array([0, 2]);
  a.insertAt(1, 1);
  assertEquals(0, a.getAt(0));
  assertEquals(1, a.getAt(1));
  assertEquals(2, a.getAt(2));
}


function testSetAt() {
  var a = new ol.Array();
  a.setAt(1, 1);
  assertEquals(2, a.getLength());
  assertUndefined(a.getAt(0));
  assertEquals(1, a.getAt(1));
}


function testRemoveAt() {
  var a = new ol.Array([0, 1, 2]);
  a.removeAt(1);
  assertEquals(0, a.getAt(0));
  assertEquals(2, a.getAt(1));
}


function testForEachEmpty() {
  var a = new ol.Array();
  var forEachCalled = false;
  a.forEach(function() {
    forEachCalled = true;
  });
  assertFalse(forEachCalled);
}


function testForEachPopulated() {
  var a = new ol.Array();
  a.push(1);
  a.push(2);
  var forEachCount = 0;
  a.forEach(function() {
    ++forEachCount;
  });
  assertEquals(2, forEachCount);
}


function testSetAtEvent() {
  var a = new ol.Array(['a', 'b']);
  var index, prev;
  goog.events.listen(a, ol.ArrayEventType.SET_AT, function(e) {
    index = e.index;
    prev = e.prev;
  });
  a.setAt(1, 1);
  assertEquals(1, index);
  assertEquals('b', prev);
}


function testRemoveAtEvent() {
  var a = new ol.Array(['a']);
  var index, prev;
  goog.events.listen(a, ol.ArrayEventType.REMOVE_AT, function(e) {
    index = e.index;
    prev = e.prev;
  });
  a.pop();
  assertEquals(0, index);
  assertEquals('a', prev);
}


function testInsertAtEvent() {
  var a = new ol.Array([0, 2]);
  var index;
  goog.events.listen(a, ol.ArrayEventType.INSERT_AT, function(e) {
    index = e.index;
  });
  a.insertAt(1, 1);
  assertEquals(1, index);
}


function testSetAtBeyondEnd() {
  var a = new ol.Array();
  var inserts = [];
  a.insert_at = function(index) {
    inserts.push(index);
  };
  a.setAt(2, 0);
  assertEquals(3, a.getLength());
  assertUndefined(a.getAt(0));
  assertUndefined(a.getAt(1));
  assertEquals(0, a.getAt(2));
  assertEquals(3, inserts.length);
  assertEquals(0, inserts[0]);
  assertEquals(1, inserts[1]);
  assertEquals(2, inserts[2]);
}


function testCreateFromArray() {
  var a = [0, 1, 2];
  var array = ol.Array.create(a);
  assertTrue(array instanceof ol.Array);
  assertEquals(3, array.getLength());
  assertEquals(0, array.getAt(0));
  assertEquals(1, array.getAt(1));
  assertEquals(2, array.getAt(2));
}


function testCreateFromArray() {
  var array1 = new ol.Array();
  var array2 = ol.Array.create(array1);
  assertTrue(array1 === array2);
}


function testLengthChangeInsertAt() {
  var array = ol.Array.create([0, 1, 2]);
  var lengthChangedCalled;
  array.length_changed = function() {
    lengthChangedCalled = true;
  };
  array.insertAt(2, 3);
  assertTrue(lengthChangedCalled);
}


function testLengthChangeRemoveAt() {
  var array = ol.Array.create([0, 1, 2]);
  var lengthChangedCalled;
  array.length_changed = function() {
    lengthChangedCalled = true;
  };
  array.removeAt(0);
  assertTrue(lengthChangedCalled);
}


function testLengthChangeSetAt() {
  var array = ol.Array.create([0, 1, 2]);
  var lengthChangedCalled;
  array.length_changed = function() {
    lengthChangedCalled = true;
  };
  array.setAt(1, 1);
  assertUndefined(lengthChangedCalled);
}
