  define(function(require) {

    var Collection = require('lavaca/mvc/Collection'),
        Promise = require('lavaca/util/Promise'),
        Service = require('app/data/Service'),
        ProcessReviews = require('app/data/ProcessReviews'),
        ErrorHandler = require('app/misc/ErrorHandler'),
        AnalyzeModel = require('app/models/AnalyzeModel'),
        CompareModel = require('app/models/CompareModel'),
        underscore = require('underscore'),
        ScatterModel = require('app/models/ScatterModel');

    var AppCollection = Collection.extend(function() {
      Collection.apply(this, arguments);
    },{
      scatterAppCount: 0,
      compareAppCount: 0,
      errorCount: 0,
      lookupApp: function(params) {
        var self = this,
            params = params;
        Service.lookup(params.country, params.appId)
          .success(function(response) {
            if (response) {
              var releaseDate = new Date(response.releaseDate);
              var sinceRelease = parseInt((new Date() - releaseDate) / 86400 / 1000);
              var velocityAll = response.userRatingCount / sinceRelease;
              var param = {
                            'appId': params.appId, 
                            'name': response.trackName, 
                            'image': response.artworkUrl60, 
                            'model': params.model, 
                            'country': params.country, 
                            'ratingAverageAll': response.averageUserRating, 
                            'ratingCount': response.userRatingCount, 
                            'velocityAll': velocityAll, 
                            'company': response.artistName};

              self.fetch(param);
            } else {
               self.errorCount += 1;
              if (self.errorCount > 4  && (params.model === 'ScatterModel' || params.model === 'CompareModel')) {
                if (self.errorCount === 5) {
                  ErrorHandler.throwError('apiDown');
                  setTimeout(function() {
                    self.errorCount = 0;
                  }, 300000);
                } else if (self.errorCount > 5 && params.model === 'CompareModel') {
                  ErrorHandler.throwError('fetchError');
                }
              } else {
                ErrorHandler.throwError('fetchError');
              }
              if (params.model === 'ScatterModel') {
                self.scatterAppCount = self.scatterAppCount - 1;
                if (ScatterModel.count() === self.scatterAppCount) {
                  ScatterModel.trigger('reset');
                }
              } else if (params.model === 'CompareModel') {
                self.compareAppCount = self.compareAppCount - 1;
                if (CompareModel.count() === self.compareAppCount) {
                  CompareModel.trigger('reset');
                }
              }
              return false;
            }
        });
      },
      getCompany: function(term, country) {
        var self = this;
        ScatterModel.clear();
        Service.getCompany(term, country)
          .then(function(response) {

            var results = underscore.uniq(response.results, false, function(item){ return item.trackId; });

            self.scatterAppCount = results.length;

            $.each(results, function(index, value) {
              var id = value.trackId,
                  name = value.trackName,
                  rating = value.averageUserRating,
                  image = value.artworkUrl100,
                  exists = false;

              self.checkCollection({'appId': id, 'country': country, 'name': name, 'rating': rating, 'model': 'ScatterModel', 'image': image});
            });
          });
      },
      getIndustryApps: function(industry, country) {
        var ind = industry,
            cou = country.toLowerCase(),
            self = this;
        ScatterModel.clear();
        Service.getIndustries().then(function(response) {
          self.scatterAppCount = response.industries[ind].length;

          var array = response.industries[ind];
          $.each(array, function(index, value) {
            var id = value;

            self.checkCollection({'appId': id, 'country': cou, 'model': 'ScatterModel'});
          });
        });
      },
      checkCollection: function(params) {
        var model = params.model,
            country = params.country,
            id = params.appId,
            exists = false;
        if (this.count() === 0) {
          this.lookupApp(params);
        } else {
          for (i = 0; i < this.count(); i++) {
            var id = (params.appId == this.itemAt(i).get('appId') ? true : false),
                country = (params.country == this.itemAt(i).get('country') ? true : false);

            if (id && country) {
              exists = true;
              if (model === 'AnalyzeModel') {
                AnalyzeModel.set('items', this.itemAt(i));
              } else if (model === 'CompareModel') {
                CompareModel.add(this.itemAt(i));
                if (CompareModel.count() === this.compareAppCount) {
                 CompareModel.trigger('reset');
                }
              } else if (model === 'ScatterModel') {
                ScatterModel.add(this.itemAt(i));
                if (ScatterModel.count() === this.scatterAppCount) {
                  ScatterModel.trigger('reset');
                }
              }
              return false;
              break;
            } else {
              exists = false;
            }
          }
          if (!exists) {
            this.lookupApp(params);
          }
        }
      },

      fetch: function(params) {
        var country = params.country,
            name = params.name,
            id = params.appId,
            image = params.image,
            ratingCount = params.ratingCount,
            Model = params.model,
            ratingAverageAll = params.ratingAverageAll,
            company = params.company,
            promise = new Promise(),
            service = Service,
            velocityAll = params.velocityAll,
            self = this;

        promise
          .when(service.page1(id, country), service.page2(id, country))
          .success(function(page1, page2) {
            if (page1) {
              if (page1.length) {
                page1.shift();
                var page1shift = true;
              } else {
                var page1shift = false;
              }
            }
            if (page2) {
              if (page2.length) {
                page2.shift();
                var page2shift = true;
              } else {
                var page2shift = false;
              }
            }

            if (page1shift && page2shift) {
              var reviews = page1.concat(page2);
            } else {
              var reviews = page1;
            }

            var ratingAverage100 = 0,
                ratingAverage50 = 0;

            if (!reviews || reviews.length <= 1 || reviews.length === undefined) {
              self.errorCount += 1;
              if (self.errorCount > 4 && (Model === 'ScatterModel' || Model === 'CompareModel')) {
                if (self.errorCount === 5) {
                  ErrorHandler.throwError('apiDown');
                  setTimeout(function() {
                    self.errorCount = 0;
                  }, 300000);
                } else if (self.errorCount > 5 && params.model === 'CompareModel') {
                  ErrorHandler.throwError('noReviews', name);
                }
              } else {
                ErrorHandler.throwError('noReviews', name);
              }
              if (Model === 'ScatterModel') {
                self.scatterAppCount = self.scatterAppCount - 1;
                if (ScatterModel.count() === self.scatterAppCount) {
                  ScatterModel.trigger('reset');
                } 
              } else if (params.model === 'CompareModel') {
                  self.compareAppCount = self.compareAppCount - 1;
                  if (CompareModel.count() === self.compareAppCount) {
                    CompareModel.trigger('reset');
                  }
                }
              promise.reject();
            } else {
              for (var i = 0; i < reviews.length; i++) {
                reviews[i].version = reviews[i]['im:version'];
                reviews[i].rating = reviews[i]['im:rating'];
                delete reviews[i]['im:rating'];
                delete reviews[i]['im:version']; 

                ratingAverage100 = ratingAverage100 + parseInt(reviews[i].rating.label);
                if (i <= 49) {
                  ratingAverage50 = ratingAverage50 + parseInt(reviews[i].rating.label);
                }
              }

              if (reviews.length < 50) {
                ratingAverage100 = ratingAverage100 / reviews.length;
                ratingAverage50 = ratingAverage50 / reviews.length;
              } else if ((reviews.length >= 50) || (reviews.length < 100)) {
                ratingAverage100 = ratingAverage100 / reviews.length;
                ratingAverage50 = ratingAverage50 / 50;
              } else if (reviews.length === 100) {
                ratingAverage100 = ratingAverage100 / 100;
                ratingAverage50 = ratingAverage50 / 50;
              }

              ProcessReviews.processReviews(name, reviews).success(function(bubbleArray) {
                var object = {
                  'name': name,
                  'country': country,
                  'reviews': reviews,
                  'bubbleArray': bubbleArray,
                  'ratingAverageAll': ratingAverageAll,
                  'image': image,
                  'appId': id,
                  'ratingCount': ratingCount,
                  'ratingAverage50': ratingAverage50,
                  'ratingAverage100': ratingAverage100,
                  'company': company,
                  'velocityAll': velocityAll
                };


                self.add(object);

                if (Model === 'AnalyzeModel') {
                  AnalyzeModel.set('items', object);
                  AnalyzeModel.trigger('reset');
                } else if (Model === 'CompareModel') {
                  CompareModel.add(object);
                  if (CompareModel.count() === self.compareAppCount) {
                   CompareModel.trigger('reset');
                  }
                } else if (Model === 'ScatterModel') {
                  ScatterModel.add(object);
                  if (ScatterModel.count() === self.scatterAppCount) {
                    ScatterModel.trigger('reset');
                  }
                }
              });
            }
          });
      }
      
    });

    return new AppCollection();
  });