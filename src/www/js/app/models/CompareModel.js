define(function(require) {

  var Collection = require('lavaca/mvc/Collection'),
      Promise = require('lavaca/util/Promise');

  var CompareModel = Collection.extend(function() {
    Collection.apply(this, arguments);
  });

  return new CompareModel();
});