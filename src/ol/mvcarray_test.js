goog.require('goog.array');
goog.require('goog.testing.jsunit');
goog.require('ol.MVCArray');
goog.require('ol.MVCArrayEventType');


function testEmpty() {
  var a = new ol.MVCArray();
  assertEquals(0, a.getLength());
  assertTrue(goog.array.equals(a.getArray(), []));
  assertUndefined(a.getAt(0));
}


function testConstruct() {
  var array = [0, 1, 2];
  var a = new ol.MVCArray(array);
  assertEquals(0, a.getAt(0));
  assertEquals(1, a.getAt(1));
  assertEquals(2, a.getAt(2));
}


function testPush() {
  var a = new ol.MVCArray();
  a.push(1);
  assertEquals(1, a.getLength());
  assertTrue(goog.array.equals(a.getArray(), [1]));
  assertEquals(1, a.getAt(0));
}


function testPushPop() {
  var a = new ol.MVCArray();
  a.push(1);
  a.pop();
  assertEquals(0, a.getLength());
  assertTrue(goog.array.equals(a.getArray(), []));
  assertUndefined(a.getAt(0));
}


function testInsertAt() {
  var a = new ol.MVCArray([0, 2]);
  a.insertAt(1, 1);
  assertEquals(0, a.getAt(0));
  assertEquals(1, a.getAt(1));
  assertEquals(2, a.getAt(2));
}


function testSetAt() {
  var a = new ol.MVCArray();
  a.setAt(1, 1);
  assertEquals(2, a.getLength());
  assertUndefined(a.getAt(0));
  assertEquals(1, a.getAt(1));
}


function testRemoveAt() {
  var a = new ol.MVCArray([0, 1, 2]);
  a.removeAt(1);
  assertEquals(0, a.getAt(0));
  assertEquals(2, a.getAt(1));
}


function testForEachEmpty() {
  var a = new ol.MVCArray();
  var forEachCalled = false;
  a.forEach(function() {
    forEachCalled = true;
  });
  assertFalse(forEachCalled);
}


function testForEachPopulated() {
  var a = new ol.MVCArray();
  a.push(1);
  a.push(2);
  var forEachCount = 0;
  a.forEach(function() {
    ++forEachCount;
  });
  assertEquals(2, forEachCount);
}


function testSetAtEvent() {
  var a = new ol.MVCArray(['a', 'b']);
  var index, prev;
  goog.events.listen(a, ol.MVCArrayEventType.SET_AT, function(e) {
    index = e.index;
    prev = e.prev;
  });
  a.setAt(1, 1);
  assertEquals(1, index);
  assertEquals('b', prev);
}


function testRemoveAtEvent() {
  var a = new ol.MVCArray(['a']);
  var index, prev;
  goog.events.listen(a, ol.MVCArrayEventType.REMOVE_AT, function(e) {
    index = e.index;
    prev = e.prev;
  });
  a.pop();
  assertEquals(0, index);
  assertEquals('a', prev);
}


function testInsertAtEvent() {
  var a = new ol.MVCArray([0, 2]);
  var index;
  goog.events.listen(a, ol.MVCArrayEventType.INSERT_AT, function(e) {
    index = e.index;
  });
  a.insertAt(1, 1);
  assertEquals(1, index);
}


function testSetAtBeyondEnd() {
  var a = new ol.MVCArray();
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
  var mvcArray = ol.MVCArray.create(a);
  assertTrue(mvcArray instanceof ol.MVCArray);
  assertEquals(3, mvcArray.getLength());
  assertEquals(0, mvcArray.getAt(0));
  assertEquals(1, mvcArray.getAt(1));
  assertEquals(2, mvcArray.getAt(2));
}


function testCreateFromMVCArray() {
  var mvcArray1 = new ol.MVCArray();
  var mvcArray2 = ol.MVCArray.create(mvcArray1);
  assertTrue(mvcArray1 === mvcArray2);

}
