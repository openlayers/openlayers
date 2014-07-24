---
title: Introduction
layout: doc.hbs
---

# Introduction

## Objectives
OpenLayers 3 (OL3) is a fundamental redesign of the OpenLayers web mapping library. Version 2 is widely used, but dates from the early days of Javascript development, and is increasingly showing its age. OL3 has been rewritten from the ground up to use modern design patterns.

The initial release aims to support much of the functionality provided by version 2, with support for a wide range of commercial and free tile sources, and the most popular open-source vector data formats. As with version 2, data can be in any projection. The initial release also adds some additional functionality, such as the ability to easily rotate or animate maps.

It is also designed such that major new features, such as displaying 3D maps, or using WebGL to quickly display large vector data sets, can be added in later releases.

## Closure Tools
OL3 is based on Google's Closure Tools. It makes heavy use of parts of the [__Closure Library__](https://developers.google.com/closure/library/). Using this to handle basics like DOM or event handling means the developers can concentrate on mapping functionality, and be sure that the underlying software is well-tested and cross-browser. Closure Library is specially designed to be optimized by the [__Closure Compiler__](https://developers.google.com/closure/compiler/). The 'advanced' optimizations that this provides offers a level of compression that far exceeds anything else available. OL3 has been designed to make full use of this.

## Public API
Using the advanced optimizations of the Closure Compiler means that properties and methods are renamed &ndash; `longMeaningfulName` might become `xB` &ndash; and so are effectively unusable in applications using the library. To be usable, they have to be explicitly `exported`. This means the exported names, those not renamed, effectively become the public API of the library. These __exportable__ properties and methods are marked in the source, and documented in the [API docs](../../apidoc). This is the officially supported API of the library. A build containing all these exportable names is known as a __full build__. A hosted version of this is available, which can be used by any application.

Although Closure library functions are widely used within OL3, none of them are exported. You will see references to them (they are all in the `goog` namespace) in the API docs, but these are for information only. You can use the Closure library in your own applications if you like, but this is not required.

## Custom Builds
Unlike in, say, Node, where a module's exports are fixed in the source, with Closure Compiler, exports can be defined at compile time. This makes it easy to create builds that are customized to the needs of a particular site or application: a __custom build__ only exports those properties and methods needed by the site or application. As the full build is large, and will probably become larger as new features are added to the API, it's recommended that sites create a custom build for production software.

## Renderers and Browser Support
The library currently includes three renderers: Canvas, DOM, and WebGL. All three support raster data from tile/image servers, but only the Canvas renderer currently supports vector data. This means that only those browsers that [support Canvas](http://caniuse.com/canvas) can handle vector data. In particular, this excludes Internet Explorer versions before 9, though there is some support for those in the DOM renderer. Clearly, the WebGL renderer can only be used on those devices and browsers supporting WebGL.

The library is intended for use on both desktop/laptop and mobile devices.

## Objects and Naming Conventions
OL3 uses a similar object hierarchy to the Closure library. There is a top-level `ol` namespace (basically, `var ol = {};`). Subdivisions of this are:

* further namespaces, such as `ol.layer`; these have a lower-case initial
* simple objects containing static properties and methods, such as `ol.animation`; these also have a lower-case initial
* types, which have an upper-case initial. These are mainly 'classes', which here means a constructor function with prototypal inheritance, such as `ol.Map` or `ol.layer.Vector` (the Vector class within the layer namespace). There are however other, simpler, types, such as `ol.Extent`, which is an array.

Class namespaces, such as `ol.layer` have a base class type with the same name, such as `ol.layer.Layer`. These are mainly abstract classes, from which the other subclasses inherit.

Source files are similarly organised, with a directory for each class namespace. Names are however all lower-case, and the subclasses repeat the superclass type in their name, for example, `ol/layer/vectorlayer.js`.

The naming structure means that there are sometimes 2 objects with the same name but different initial, such as `ol.feature`, a simple object with static functions to be used with features, and `ol.Feature`, a class used to instantiate new features. These two objects are however stored in the same file, in this case, `ol/feature.js`

OL3 follows the convention that the names of private properties and methods, that is, those that are not part of the API, end in an underscore. In general, instance properties are private and accessed using accessors.