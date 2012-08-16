goog.require('goog.testing.jsunit');
goog.require('ol.Collection');
goog.require('ol3');


function testCreateFromArray() {
  var array = [0, 1, 2];
  var collection = ol3.collection(array);
  assertTrue(collection instanceof ol.Collection);
  assertEquals(3, collection.getLength());
  assertEquals(0, collection.getAt(0));
  assertEquals(1, collection.getAt(1));
  assertEquals(2, collection.getAt(2));
}


function testCreateFromCollection() {
  var collection1 = new ol.Collection();
  var collection2 = ol3.collection(collection1);
  assertTrue(collection1 === collection2);
}

