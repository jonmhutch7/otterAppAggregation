define(function(require) {

  var Collection = require('lavaca/mvc/Collection');

  var ScatterModel = Collection.extend(function() {
    Collection.apply(this, arguments);
  });

  return new ScatterModel();
});