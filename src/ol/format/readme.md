# Implementing formats with ol/format/Feature
`ol/format/Feature` defines a number of abstract methods including:

* `readFeatures` returning an `Array.<ol/Feature>`
* `readFeature` returning an `ol/Feature`
* `readGeometry` returning an `module:ol/geom/Geometry~Geometry`

Having different functions for multiple return types allows both the user to specify what type of data they want and for the compiler to properly type check the code. Depending on the format, it is entirely reasonable to leave one or more of these methods unimplemented, or provide sensible default implementations.

For example, `ol/format/GPX` only supports reading multiple features.  Therefore `readFeature` and `readGeometry` are unimplemented and will raise an exception if called.

The IGC format contains only one feature per file, so `readFeature` returns that feature, `readFeatures` returns an array containing a single feature which is the feature in the file, and `readGeometry` is unimplemented.

For formats that only contain a single geometry, like WKB and WKT, `readGeometry` should return that geometry, `readFeature` should return a feature with its geometry set to the geometry read from the file, and `readFeatures` should return an array containing the single feature returned by `readFeature`.

If a file cannot be parsed, then the return value should be `null` for all three cases. Parsing failures should not raise exceptions (although exceptions can be used internally).


# Implementing XML formats

This is an introduction for people looking to contribute an XML format reader to OpenLayers. After having read this document, you should read the code of and make sure that you understand the simpler XML format readers like `ol/format/GPX` before embarking on writing your own format reader.
The document ends with guidelines for implementing a new format.

The `ol/xml` namespace contains a number of useful functions for parsing XML documents. All code in OpenLayers that reads data from XML documents should use it. It has several features:

* Browser support back to IE9
* Correct treatment of XML namespaces
* Robust handling of errors
* Modular design to promote the re-use of parsers
* Decoupling of the XML document structure from the output data structure
* Good compatibility with the Closure Compiler, including good type checking

The `ol/format/XML` class includes a number of methods for reading arrays of features, single features, geometries, and projections from XML documents. `ol/format/XML` should only be used for formats containing features and geometries.  If your format does not contain features or geometries (e.g. WMS GetCapabilities) then you should not use `ol/format/XML`.

## `ol/format/XML`

`ol/format/XML` is for formats that contain features and geometries. If your XML file contains something else then you should not inherit from `ol/format/XML` and can skip ahead to the `ol/xml` section.

`ol/format/XML` is perhaps easiest to explain first, since it is higher level than `ol/xml`.

`ol/format/XML` defines a number of abstract type-checked methods with names including:

    read{Features,Feature,Geometry}From{Document,Node}

`Document`s are top-level XML document objects, `Node`s are children of the top-level XML document object. In modern browsers `Document` is a subclass of `Node`, and inherits all of `Node`'s methods.  In IE, this is not the case: `Document` is not a subclass of `Node`, and `Document` only has some of `Node`'s functionality.  The distinction between the two is therefore necessary.

## `ol/xml`

There are two key concepts to master to understand how `ol/xml` works:

* How `ol/xml~parse` traverses the XML document (or node) and calls back to your code
* How `ol/xml` decouples the structure of the XML document (which is always a tree) from the structure of the output data (which could be a single object, an array of objects, or anything else) using an object stack.

It's handy to have the [`src/ol/xml.js` source code](https://github.com/openlayers/openlayers/blob/master/src/ol/xml.js) to hand while you read the following.

## How `ol/xml~parse` traverses the XML document

`ol/xml~parse` is the core of the XML parser. Given a `Node`, it loops over all that `Node`'s child `Elements` (ignoring text, CDATA sections, comments, etc.). For each child element, it looks up to see if there is a function to call that matches the child element's namespace and local (unqualified) name. If there is a function to call, then that function is called with the child element.

The `parserNS` argument to `parse` is an `Object` whose keys are XML namespaces and whose values are `Objects` whose keys are local element names and whose values are functions.  A simple example might look like this:

```js
var parserNS = {
  'http://my/first/namespace': {
    'elementLocalName': function(/* ... */) {
      // parse an <elementLocalName> element in the http://my/first/namespace namespace
    }
  },
  'http://my/second/namespace': {
    'elementLocalName': function(/* ... */) {
      // parse an <elementLocalName> element in the http://my/second/namespace namespace
    }
  }
};
```

Many XML formats use different namespaces for different versions, but the code for handling the elements in different versions is the same.  `ol/xml~makeParserNS` is an helper function that creates the above structure given a single array of namespaces and a single object mapping element names onto functions.

## How the object stack works

`ol/xml~parse` also takes an argument called `objectStack` which is an `Array` of arbitrary values. This stack is key to the decoupling of the XML tree structure from the structure of the parsed output.

Generally speaking, each callback function will modify the object at the top of the object stack. This is perhaps best demonstrated with a couple of examples.

First consider the case of constructing a feature.  Consider the following (imaginary) XML:

```xml
<doc>
  <Feature>
    <id>f1</id>
    <Point>1 2</Point>
  </Feature>
</doc>
```

When we parse find the `<Feature>` tag, we construct a new `ol/Feature` and push it on to the object stack. We will then call a `ol/xml~parse` to parse the child elements of the `Feature` tag. When we find the `<id>` element, we'll set the id of the object that is on top of the object stack (the `ol/Feature`).  When find the `<Point>` element we set the geometry of the object on the top of the object stack (still the `ol/Feature`). Finally, at the end of the `</Feature>` tag, our fully-configured `ol/Feature` is on the top of the stack, so we pop it off the top of the stack and return it.

This pattern is so common that there is a function, `ol/xml~pushParseAndPop` that implements it.

Now consider the case of parsing multiple features:

```xml
<doc>
  <Feature>
    <id>f1</id>
    <Point>1 2</Point>
  </Feature>
  <Feature>
    <id>f2</id>
    <Point>3 4</Point>
  </Feature>
</doc>
```

In this case, we want to extract an `Array` of `ol/Feature`s. Here's how it works. When we encounter the `<doc>` tag we push an empty `Array` on to the stack. On each `<Feature>` tag, we invoke our feature parser above, which will return a populated `ol/Feature`. We append this `ol/Feature` to the object on the top of the object stack (our `Array` of `ol/Feature`s). At the final closing `</doc>` tag we pop the object off the top of the stack - now an `Array` containing two features - and return it.

### Common operations

In the above there are many common operations, like setting the property of the object on the top of the stack, or reading an object and appending that to an array on the top of the stack. There are many helper functions here, for example:

* `ol/xml~makeObjectPropertySetter` reads a value from the child element and sets a property on the object on the top of the stack.
* `ol/xml~makeArrayPusher` reads a value from the child element and appends it to the array on the top of the stack.
* `ol/xml~makeReplacer` reads a value from the child element and *replaces* whatever is on top of the stack with it.

### Putting it all together

With the above, you should be able to read through the [source code to `ol/format/GPX`](https://github.com/openlayers/openlayers/blob/master/src/ol/format/gpxformat.js) and get a feel for how it works. Start from the bottom of the file and work upwards. It's also useful to have [an example GPX file](http://www.topografix.com/fells_loop.gpx) and [the GPX specification](http://www.topografix.com/GPX/1/1/) to hand.

### Handling errors

If, when reading a value from a child element, you find an invalid value, you should return `undefined`. The helper functions above (like `ol/xml~makeObjectPropertySetter`) will then skip this value. If the structure is incomplete or incorrect (e.g. a child element is missing a mandatory tag) then you should also return `undefined` from your reader, which will in turn cause the value to be skipped.
An `ol/format/Format` should read as many features as it can, skipping features with any errors.


