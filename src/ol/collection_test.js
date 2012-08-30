goog.require('goog.testing.jsunit');
goog.require('ol');
goog.require('ol3.Collection');


function testCreateFromArray() {
  var array = [0, 1, 2];
  var collection = ol.collection(array);
  assertTrue(collection instanceof ol3.Collection);
  assertEquals(3, collection.getLength());
  assertEquals(0, collection.getAt(0));
  assertEquals(1, collection.getAt(1));
  assertEquals(2, collection.getAt(2));
}


function testCreateFromCollection() {
  var collection1 = new ol3.Collection();
  var collection2 = ol.collection(collection1);
  assertTrue(collection1 === collection2);
}

