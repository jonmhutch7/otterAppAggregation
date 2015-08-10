define(function(require) {

  var Promise = require('lavaca/util/Promise'),
      Connectivity = require('lavaca/net/Connectivity'),
      ErrorHandler = require('app/misc/ErrorHandler');

  function _lookup(country, id) {
    var promise = new Promise();

    Connectivity.ajax({
      url: "http://itunes.apple.com/"+ country +"/lookup?id=" + id + "&callback=?",
      dataType: "json",
      contentType:'application/json; charset=utf-8',
      success: function(response) {
        promise.resolve(response.results[0]);
      },
      error: function(response) {
         promise.resolve(response.results[0]);
      }
    });

    return promise;
  }

  function _getIndustries(country, id) {
    var promise = new Promise();

    Connectivity.ajax({
      url: "assets/industry.json",
      dataType: "json",
      contentType:'application/json; charset=utf-8',
      success: function(response) {
        promise.resolve(response);
      },
      error: function(response) {
        ErrorHandler.throwError('otterError');
      }
    });
    
    return promise;
  } 

  function _page1(id, country) {
    var promise = new Promise();

    Connectivity.ajax({
      url: "http://itunes.apple.com/" + country + "/rss/customerreviews/id=" + id + "/json",
      dataType: 'json',
      success: function(response) {
        promise.resolve(response.feed.entry);
      },
      error: function(response) {
         promise.resolve(response.feed.entry);
      }
    });
    return promise;
  }

  function _page2(id, country) {
    var promise = new Promise();


    Connectivity.ajax({
      url: "http://itunes.apple.com/" + country + "/rss/customerreviews/page=2/id=" + id + "/json",
      dataType: 'json',
      success: function(response) {
        promise.resolve(response.feed.entry);
      },
      error: function(response) {
       // ErrorHandler.throwError('fetchError');
      }
    });
    return promise;
  }

  function _getApp(term, country) {
    var promise = new Promise();

    Connectivity.ajax({
      url: "http://itunes.apple.com/search?term=" + term + "&country=" + country + "&media=software&entity=software,iPadSoftware&limit=15&callback=?",
      dataType: "json",
      contentType: "application/json",
      success: function(response) {
        promise.resolve(response);
      },
      error: function(response) {
        promise.resolve(response);
      }
    });
    return promise;
  }

  function _getCompany(term, country) {
    var promise = new Promise();

    Connectivity.ajax({
      url: "http://itunes.apple.com/search?term=" + term + "&country=" + country + "&media=software&entity=software,iPadSoftware&attribute=softwareDeveloper&limit=15&callback=?",
      dataType: "json",
      contentType: "application/json",
      success: function(response) {
        promise.resolve(response);
      },
      error: function(response) {
        promise.resolve(response);
      }
    });
    return promise;
  }

  function _validate(array) {
    var i,
        len = array.length,
        out = [],
        obj = {},
        valid;
   
    for (var i = 0; i < len; i++) {
      if (array.length === 1 || valid) {
        break;
        return array;
      }
      var id = array[i].appId;
      var country = array[i].country;
      for (var j = 0; j < len; j++) {
        if (i !== j) {
          var Vid = (id === array[j].appId);
          var Vcountry = (country === array[j].country);
          if (Vcountry && Vid) {
            array.splice(i,1);
            this.validate(array);
            break;
          }
        }
      }
      valid = true;
      break;
    }
    return array;
  }

  return {
    getApp: _getApp,
    getCompany: _getCompany,
    getIndustries: _getIndustries,
    lookup: _lookup,
    page1: _page1,
    page2: _page2,
    validate: _validate
  };

});