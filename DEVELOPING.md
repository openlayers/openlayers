# Developing

## Setting up development environment

You will start by
[forking](https://github.com/openlayers/openlayers/fork) the OpenLayers repository.

### Development dependencies

The minimum requirements are:

* Git
* [Node.js](https://nodejs.org/) (version 8 and above)

The executables `git` and `node` should be in your `PATH`.

To install the Node.js dependencies run

    $ npm install

## Running examples

To run the examples you first need to start the dev server:

    $ npm run serve-examples

Then, load <http://localhost:8080/> in your browser.

## Linking Package

The `ol` package is published from the `build/ol` folder of the `openlayers` repo. 

After you've cloned the `openlayers` repo locally run the `npm build-package` to prepare the build then use the `npm link` command to connect it your project. 

Below is an example of how to build and link it to "sample-project"


    $ cd openlayers
    $ npm run build-package
    $ cd build/ol
    $ npm link
    $ cd /sample-project
    $ npm link ol

To remove the link run the following commands

    $ cd sample-project
    $ npm unlink --no-save ol
    $ cd ../openlayers
    $ npm unlink
## Running tests

To run the tests once:

    $ npm test

To run the tests continuously during development:

    $ npm run karma

## Adding examples

Adding functionality often implies adding one or several examples. This
section provides explanations related to adding examples.

The examples are located in the `examples` directory. Adding a new example
implies creating two or three files in this directory, an `.html` file, a `.js`
file, and, optionally, a `.css` file.

You can use `simple.js` and `simple.html` as templates for new examples.
