# Developing

## Setting up development environment

You will start by [forking](https://github.com/openlayers/openlayers/fork) the OpenLayers repository.

### Installing dependencies

The minimum requirements are:

* Git
* [Node.js](https://nodejs.org/) (version 16 and above)

The executables `git` and `node` should be in your `PATH`.

To install the project dependencies run

```shell
npm install
```


## Style guidelines

We use [ESLint](https://eslint.org/) rules to ensure a consistent coding style and catch potential bugs.  ESLint and the rules used by the project are installed as part of the development dependencies in the step above – so you don't need to have any additional executables installed globally.

When you submit a pull request, the styling rules are enforced by running the `npm run lint` task.  This happens as part of an automated workflow, so you don't need to run it yourself.  However, it can be useful to run the `npm run lint` task before submitting a pull request so that you can fix any styling issues ahead of time.

The best way to conform with the style guidelines is to configure your editor to detect the ESLint configuration from the repository's `package.json` file.  See the [ESLint integration documentation](https://eslint.org/docs/latest/use/integrations) for details on configuring your editor.  If you don't already have a preferred editor that is capable of running ESLint rules, we recommend using [VS Code](https://code.visualstudio.com/) with the [ESLint plugin](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

In addition to having your editor warn you when the style guidelines are not being followed, you can set things up so many of the violations are automatically fixed.  This saves you from having to think about tedious things like spacing and whitespace while developing.  Using the ESLint plugin for VS Code, you can add the following to your settings to automatically fix issues when you save a file:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  }
}
```


## Running examples

To run the examples you first need to start the dev server:

```shell
npm run serve-examples
```

Then, load <http://localhost:8080/> in your browser.


## Running tests

To run the tests once:

```shell
npm test
```

See the [tests README](./test/README.md) for details.


## Adding examples

Adding functionality often implies adding one or several examples. This
section provides explanations related to adding examples.

The examples are located in the `examples` directory. Adding a new example
implies creating two or three files in this directory, an `.html` file, a `.js`
file, and, optionally, a `.css` file.

You can use `simple.js` and `simple.html` as templates for new examples.


## Linking Package

The `ol` package is published from the `build/ol` folder of the `openlayers` repo.

After you've cloned the `openlayers` repo locally run the `npm build-package` to prepare the build then use the `npm link` command to connect it your project.

Below is an example of how to build and link it to `sample-project`.

```shell
cd openlayers
npm run build-package
cd build/ol
npm link
cd /sample-project
npm link ol
```

To remove the link run the following commands

```shell
cd sample-project
npm unlink --no-save ol
cd ../openlayers
npm unlink
```
