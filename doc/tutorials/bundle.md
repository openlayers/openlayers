---
title: Basic project setup using NPM and Parcel
layout: doc.hbs
---

# Introduction

Modern JavaScript works best when using and authoring modules. The recommended way of using OpenLayers is installing the [`ol`](https://npmjs.com/package/ol) package. This tutorial walks you through setting up a simple dev environment, which requires [node](https://nodejs.org) for everything to work.

In this tutorial, we will be using [Parcel](https://parceljs.org) to bundle our application. There are several other options, some of which are linked from the [README](https://npmjs.com/package/ol).

## Initial steps

Create a new empty directory for your project and navigate to it by running `mkdir new-project && cd new-project`. Initialize your project with

    npm init

This will create a `package.json` file in your working directory. Add OpenLayers as dependency to your application with

    npm install ol

At this point you can ask NPM to add required development dependencies by running

    npm install --save-dev parcel-bundler

## Application code and index.html

Place your application code in `index.js`. Here is a simple starting point:

```js
import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 0
  })
});
```

You will also need an `index.html` file that will use your bundle. Here is a simple example:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Using Parcel with OpenLayers</title>
    <style>
      #map {
        width: 400px;
        height: 250px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="./index.js"></script>
  </body>
</html>
```

## Creating a bundle

With two additional lines in `package.json` you can introduce the commands `npm run build` and `npm start` to manually build your bundle and watch for changes, respectively. The final `package.json` with the two additional commands `"start"` and `"build"` should look like this:

```json
{
  "name": "test",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "parcel index.html",
    "build": "parcel build --public-url . index.html"
  },
  "author": "",
  "license": "ISC"
}
```
That's it. Now to run your application, enter

    npm start

in your console. To test your application, open http://localhost:1234/ in your browser. Whenever you change something, the page will reload automatically to show the result of your changes.

Note that a single JavaScript file with all your application code and all dependencies used in your application has been created. From the OpenLayers package, it only contains the required components.

To create a production bundle of your application, simply type

    npm run build

and copy the `dist/` folder to your production server.
