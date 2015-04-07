---
title: Example for building application and library code together
layout: doc.hbs
---

# Example for building application and library code together
This page gives the same example as the previous one, except this time we will compile the application together with the OL3 library.

The skeleton html will be the same as the one given in the previous page, with the exception that there will be no separate `myApp.js` script to load.

## Simple example
We'll use `examples/simple.js` again. This time, you do need the `goog.require`s, so can simply copy the code over from the `examples` directory; you will though still have to edit out the `renderer` line. Leave the typecast in there.

As the namespaces the app uses are already defined with `goog.require`, nothing more needs to be done. As we're compiling our code with OL, we don't need any exports. We do however need the `olx` externs, so our config file looks like this:

```json
{
  "src": ["src/**/*.js", "build/simple.js", "externs/olx.js"],
  "exports": [],
  "compile": {
    "define": [
      "goog.dom.ASSUME_STANDARDS_MODE=true",
      "goog.DEBUG=false"
    ],
    "compilation_level": "ADVANCED_OPTIMIZATIONS",
    "use_types_for_optimization": true,
    "manage_closure_dependencies": true
  }
}
```

This assumes that we're running the build task from the root of the OL directory, with the app source in build, OL source in `src`, and externs in `externs`. So what this means is 'take the source in `src` and `build/simple.js`, compile it, and don't export anything'.

Now, run this with `node tasks/build.js build/config.json build/ol-build.js` again. As before, it tells you it is 'Parsing dependencies' and 'Compiling sources'. When it is finished, if you reload your html file, the map should be displayed.

## Exporting your own variables
If you load your html file with the build created above, and open the browser console, you will notice that the difference with having a separate build is that there is now no `ol` variable and not even a `map` variable; nor is there a `goog` variable. These have been optimized away. If you want to keep your map var, so you can inspect it in the console, you should export it. You might think you can just add `map` to the exports section of the config file, but, as the readme explains, this is for the OL variables, not application ones. So you will have to export it in your script:
```js
goog.exportSymbol('map', map);
```
Now rebuild and reload, and you should now have a map variable you can inspect.
