'use strict';

var is = require('is_js');
var express = require('express');
var walk = require('walk');
var path = require('path');

var debug = function () {};

function getRelativeName(root, basedir, name) {
  return path.normalize(path.join(root, path.basename(name, '.js')).replace(basedir, ''));
}

function getRoute(root, basedir, name) {
  return getRelativeName(root, basedir, name).
  replace(/index/gim, '/').
  replace(/[\\\/]+/gm, '/').
  replace(/(.+)\/$/gm, '$1');
}

function getPath(root, name) {
  return path.normalize(path.join(root, name));
}

/* Exports */
module.exports = function (app, config) {

  if (is.function(config.debug)) {
    debug = config.debug;
  } else if (config.debug) {
    debug = console.log;
  }

  if (is.not.string(config.basedir)) {
    throw new Error("Config's basedir cannot be empty!");
  }

  config.arguments = config.arguments || [];

  walk.walkSync(config.basedir, {
    listeners: {
      file: function (root, stats) {
        if (path.extname(stats.name) === '.js') {
          /* Generate route's path */
          var route = getRoute(root, config.basedir, stats.name);
          /* Create a new router instance */
          var router = express.Router();
          /* Get the controller's path */
          var filepath = getPath(root, stats.name);

          /* Build the controller */
          require(filepath).apply(this, [router].concat(config.arguments));

          /* Declare route */
          app.use(route, router);

          debug(route + " --> " + filepath);
        }
      },

      errors: function (root, stats) {
        console.dir(stats);
        throw new Error("Could not compile routes! ");
      }
    }
  });
};
