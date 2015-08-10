define(function(require) {

  var BaseController = require('app/net/BaseController'),
      Collection = require('app/models/AppCollection'),
      Promise = require('lavaca/util/Promise'),
      CompareView = require('app/ui/views/CompareView'),
      Service = require('app/data/Service'),
      router = require('lavaca/mvc/Router'),
      Model = require('app/models/CompareModel');

  var CompareController = BaseController.extend({
    compare: function(params, history) {

      if (typeof params.appId == 'string' && params.appId.indexOf(',') > -1) {
        var id = params.appId.split(/\s*,\s*/);
      } else {
        var id = "284882215,333903271".split(/\s*,\s*/);
      }

      if (typeof params.country == 'string' && params.country.indexOf(',') > -1) {
        var country = params.country.split(/\s*,\s*/);
      } else {
        var country = 'us,us'.split(/\s*,\s*/);
      }

      var array = new Array();

      for (var i = 0; i < id.length; i++) {
        var obj = {
          'country': country[i],
          'appId': id[i],
          'model': 'CompareModel'   
        };

        array.push(obj);
      }

      array = Service.validate(array);

      Collection.compareAppCount = array.length;

      for (var i = 0; i < array.length; i++) {
        Collection.checkCollection(array[i]);
      }

      var url = '/compare?appId=' + id +'&country=' + country;

      return this
        .view(null, CompareView, Model)
        .then(this.updateState(history, 'Otter - App Comparison', url));
      }
  });

  return CompareController;

});