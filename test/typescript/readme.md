The test cases in the `./cases` folder are meant to test OpenLayers with the auto-generated types that are included in the npm package.

When authoring tests here, make sure to run

    npm run build-package

before, and to import modules from the `/build/ol` folder instead of `/src/ol`.