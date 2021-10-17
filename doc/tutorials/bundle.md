---
title: Basic project setup using NPM and Vite
layout: doc.hbs
---

# Introduction

Modern JavaScript works best when using and authoring modules. The recommended way of using OpenLayers is installing the [`ol`](https://npmjs.com/package/ol) package. This tutorial walks you through setting up a simple dev environment, which requires [node](https://nodejs.org) for everything to work.

In this tutorial, we will be using [Vite](https://vitejs.dev/) as a development tool and to bundle our application for production. There are several other options, some of which are linked from the [README](https://npmjs.com/package/ol).

## Application setup

Create a new empty directory for your project and navigate to it by running `mkdir new-project && cd new-project`. Initialize your project with

    npx create-ol-app

*You will need to have `git` installed for the above command to work.  If you receive an error, make sure that [Git is installed](https://github.com/git-guides/install-git) on your system.*

This will install the `ol` package, set up a development environment with additional dependencies, and give you an `index.html` and `main.js` starting point for your application.  By default, [Vite](https://vitejs.dev/) will be used as a module loader and bundler.  See the [`create-ol-app`](https://github.com/openlayers/create-ol-app) documentation for details on using another bundler.

To start the development server

    npm start

You can now visit http://localhost:3000/ to view your application.  Begin making changes to the `index.html` and `main.js` files to add additional functionality.

To create a production bundle of your application, simply type

    npm run build

and copy the `dist/` folder to your production server.
