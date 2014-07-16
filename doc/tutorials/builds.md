---
title: Creating custom builds
layout: doc.hbs
---

# Creating Custom Builds

## Basics
The [introduction](introduction.md) has a brief description of full and custom builds and the public API. Creating custom builds is reasonably straightforward once you get the hang of it, but it requires knowledge of both the library and how the compiler works, so is not recommended for the complete beginner. If you just want to try things out or quickly create a mapping app, the hosted version should be sufficient. Having said that, this tutorial should also help if you want to know more about how things fit together.

If you're now sure you want to continue, this tutorial is split into 2 sections:
- an introductory page (this one) including
  - summary of terms
  - overview of Closure library and compiler, and types of build
  - how that compares to the OL2 process
  - pros and cons of compiling your code separately or together with OL
- some examples of using the build tool to create custom builds

If you already know much of the introductory material, and/or just want a quick primer on creating a custom build, feel free to skip to the [next page](buildExamples.md).

## Summary of terms
Let's start with a brief summary of the terms used here. When you have a large body of code like OpenLayers, you have to divide it up into manageable self-contained units of code; these are often called __modules__ (though see below for Closure's different naming). When you do this, you have to have a standard way of specifying the relationships between the different modules: which functions a module provides, commonly called __exports__, and which other modules/functions it needs, commonly called __imports__. This establishes a __dependency__: if module1 uses functions from module2, it is dependent on it.
 __Module loading__ is easy on server-based systems, as you can pre-install the modules you need, and then an app can simply import them from the local filesystem as needed. This however doesn't work on the browser, which doesn't have a filesystem; in addition, loading large numbers of separate scripts is inefficient. So you need to, first, __optimize__ or __compile__ code so it takes up less space and so requires less bandwidth, and, second, minimise the amount of IO by combining all the modules needed by an application into a __build__.

## Closure tools and comparison with OL2
Many of those coming to OL3 will be familiar with OL2, so here's a brief summary of its build process. When it was originally written, there wasn't much in the way of standardised ways of handling modules and not much in the way of build tools. So it invented its own ([Readme](https://github.com/openlayers/openlayers/tree/master/build)). Releases of OL2 reflected the evolution of optimization tools as they became available:
* the code was split into 'classes', with one page per class; dependencies were defined using `@requires` in comments at the top of each page
* a config file listed the classes to be used, and a build script then used these classes' dependencies to create a dependency tree, build that into a single file, and then optionally optimize that file
* the first optimizers, such as Douglas Crockford's [JSMin](http://www.crockford.com/javascript/jsmin.html), simply removed comments and unneeded whitespace
* later updates included the option of using the simple_optimizations option of the Closure compiler
* the latest versions include the option of using [UglifyJS](http://lisperator.net/uglifyjs/), written in Javascript, now the most commonly used JS optimization tool, which produces sizes similar to Closure's simple option.

OL3 uses Google's Closure tools. There are two principal elements to this: the [__library__](https://developers.google.com/closure/library/) and the [__compiler__](https://developers.google.com/closure/compiler/). Whereas OL2 used little in the way of external software (with the exception of Proj4js) and included its own utility functions, OL3 is based on the Closure library, which has the advantage of tried and tested library functions. You do not have to use the Closure library and compiler together &ndash; you can use the compiler on any code &ndash; but, if you do use the library, then the optimum is to use the compiler as well, as this will create the smallest build file. The disadvantage of using the Closure library is that it's very large, in terms of both numbers of classes and numbers of functions in those classes, which in turn means that the simple optimization option used in OL2 still creates large files. Making full use of advanced compilation, for example by defining types, also adds to the complexity, and means there's a long learning curve in trying to use it fully. However, OL3 takes care to hide this complexity from API users - none of the Closure code is exposed - so you don't have to worry about these details when creating a custom build.

OL3 follows Closure's system:
* code is divided into 'namespaces', i.e. simple JS objects; Closure's namespace is `goog`, OL3's is `ol`
* definition is done with `goog.provide('namespaceA')`; there is no 1-to-1 namespace/file relationship as with, for example, Node's modules: 1 file can provide several namespaces
* dependencies are specified with `goog.require('namespaceB')`
* Closure has `goog.exportProperty(propA)` and `goog.exportSymbol(symA)` but a key difference from other systems is that exports don't have to be in the namespace/module itself and can be defined separately, at compile/optimize time. This makes the system very flexible. An export is essentially any unoptimized variable name, so they can also be defined by using literal notation: `namespaceA["propb"]=xxx` will ensure that 'propb' is available for public use
* because there is no 1-to-1 file/namespace, the first step is to search through files and create a dependency tree; Closure library provides two (Python) programs &ndash; `calcDeps.py` and `closureBuilder.py` &ndash; but these have both been deprecated; the preferred way to do this is to pass all the source files along with the `manage_closure_dependencies` flag to the compiler. OL3's build script includes its own dependency tree generator
* Closure compiler is available as a Java jar, a webservice API, or an interactive web UI
* to confuse things, the Closure compiler includes the ability to split the build file into separate bundles of code, which can be loaded separately on demand; it calls these 'modules'. However, this is not used by OL3's build tools, and in any case Closure's definition is currently being changed to make it compatible with ES6 modules; this subject is not dealt with further in this tutorial.

Although OL2 added the ability to optimize with UglifyJS, this is not really practical with Closure library and hence OL3. Closure compiler knows about `goog.provide` and `goog.require` and strips them out; it also works optimally with other features of Closure library. UglifyJS doesn't, so its output will be large and probably won't work.

## OL3 build tools
You can of course use the compiler directly yourself, but OL3 includes its own build tools. `build.py` (and the equivalent for Windows `build.cmd`) was created for those developing the library, and includes testing, creating API docs, and other options not needed by apps developers. See the [contributors guide](https://github.com/openlayers/ol3/blob/master/CONTRIBUTING.md) for more on this. For building, these scripts use the tools in the `tasks` directory, especially `build.js`. This is what is discussed here. As with OL2, you provide a config file to control the script.

`build.js` uses the `getDependencies` and `compile` functions of [closure-util](https://github.com/openlayers/closure-util).

## Types of Build
The [Closure Library documentation](https://developers.google.com/closure/library/docs/gettingstarted) shows an example which loads each file/module individually, starting from `goog.base`. OL2 had a similar ability to load unbuilt code. OL3's hosted examples also have this capability, called 'raw mode'. For example, http://openlayers.org/en/master/examples/simple.html?mode=raw will load each required file individually. However, you will probably notice that this takes a long time to load even on a fast connection. This could be speeded up with HTTP2/SPDY push but, as the dependency tree for even a modest OL3 application is likely to be well over 100 files, loading them individually is not really recommended for anything other than occasional use. This 'unbuilt' code is not dealt with further in this tutorial.

Closure compiler has 3 optimization levels: __whitespace__, equivalent to basic optimizers like JSMin; __simple__, as used in OL2; and __advanced__. See [Google's documentation](https://developers.google.com/closure/compiler/docs/compilation_levels) for more information on these. The OL3 website only provides advanced builds, though the build tools do have an additional __debug__ option, which is an unoptimized build: the same code as 'raw', but all in one file.

As stated above, with Closure's system, you have the ability to specify what you want to export, effectively what you use in your app/site. This is what is meant by a __custom build__: one that is customized to your needs and only exports those properties and methods you need. This is particularly effective with advanced optimization, and is recommended for production software.

## Compiling with or without your own code
There are 2 basic approaches to building and compiling, both dealt with here:

* you can build/compile your code in with the OL/Closure code, producing one script, loaded in one script tag
* you can build/compile the OL/Closure code as a separate file, similar to OL's hosted build, and load that in a separate script tag from your own code

These approaches both have pros and cons, so here are some things to consider:

* one script is better from the optimization point of view, as all the code will be optimized; there's no need to define exports, as there is no external code that needs to refer to the unoptimized names
* one script is also better if you want to use Closure library functions, as these can be optimized too; if your code is separate, then you would also have to define exports for those functions your code uses
* against that, if you want to use advanced_optimizations with typedefs for maximum optimization (which OL3 does by default), you have to define these in your code
* if your code is large and/or spread over many pages, you have to decide whether you want everything in one build, or a different build for each page
* if you use a lot of 3rd-party software, compiling all this in with your code and OL can soon get complicated; alternatively, you may need a lot of externs
* the compiler does not work well with some JS code; in particular, it does not handle the module pattern correctly
* if your code is separate, this means you can use whatever you normally use for compressing it; for example, you can use UglifyJS on your code, with a separate task for compiling OL with the Closure compiler

## A note on CSS
The CSS file supplied in the [repo](https://github.com/openlayers/ol3/blob/master/css/ol.css) contains styling for all the controls supported by the library. The hosted version of this is used in the example html in this tutorial. Clearly, for production use, you should customize this for your own site, but this is not discussed further in this tutorial.

## Examples
Right, that's enough theory. On to some [practical examples](buildExamples.md).
