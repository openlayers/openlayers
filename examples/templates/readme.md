This folder contains example templates. These templates are used to build the examples in the `examples/` folder. The resulting examples are written to the `build/examples` folder.

Although the main purpose of these examples is to demonstrate how to use the API, they also serve other purposes in the development cycle, and so are not exactly as they would be in normal application code:

 * every time the library changes, they are compiled together with the library as a basic check that they remain in sync with the library

 * they use a special loader script to enable defining at run time which build mode (raw/debug/advanced) to use

To enable this, examples have the following, not needed in application code:

 * each html file loads `loader.js`; application code would not need this, but would instead load the appropriate library build file, either a hosted version or a custom build

 * each js file starts with `goog.require` functions, used by the compiler; application code would only have these if the code is to be compiled together with the library and/or Closure library

 * some js files use type definitions (comments with @type tags); these are also used by the compiler, and are only needed if the code is to be compiled together with the library

 * html files load `resources/common.js` and some scripts use `common.getRendererFromQueryString()` to set the map renderer; application code would not need these

At the bottom of each example generated in the `build/examples` folder, a modified version of its source code is shown. That modified version can be run standalone and is usually used as starting point for users to extend examples into their own application.
