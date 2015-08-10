define(function(require) {

  var Promise = require('lavaca/util/Promise'),
      Collection = require('lavaca/mvc/Collection'),
      Connectivity = require('lavaca/net/Connectivity'),
      underscore = require('underscore'),
      exclusionList = ['',' ','a','b','1','2','3','i','r','t','s','d','u','ve','(',')','-','--','&',"i'm",'it','at','ur','me','they','very','them','or','re','es','scan','also','app','have','be','so',"it's",'got','being','when','was','there','as','those','how','has','not','your','than','an','my','but','and','any','are','you','that','the','this','of','for','to','with','is','in','on','our','u','too','using','game','because','ive','lol','we','its','who','use','am','does',"i've",'from','their','one',"you're",'into','de','un','su','way','been','he','gay','ha','do','since','all','will','while','apps','through','what','by','these','y','la','el','o','mi','con','por','que','se','las','los','und','e','i','y','al'];


  function _processReviews(appName, array) {
    var promise = new Promise(),
        totalRating = 0,
        appName = appName.toLowerCase(),
        count = array.length,
        allRatings = new Array();
    for (var i = 1; i < count; i++) {
      var rating = parseInt(array[i]['rating'].label),
          string = array[i].content.label + ' ' + array[i].title.label,
          newString = string.toLowerCase(),
          removePunctuation = newString.replace(/[^a-zA-Z'\w]/g,' '),
          split = removePunctuation.split(" ");

      totalRating += rating;

      for ( j = 0; j < split.length; j++ ) {
        if ((exclusionList.indexOf(split[j]) === -1) && (appName !== split[j].toLowerCase())) {
          var newObj = {'name': split[j], 'rating': rating};
          allRatings.push(newObj);
        }
      }
    }

    this.countWords(allRatings, totalRating).then(function(response) {
      promise.resolve(response);
    });

    return promise;
  }

  function _countWords(allRatings, totalRating) {
    var promise = new Promise(),
        largest = underscore.chain(allRatings)
          .groupBy(function(item){return item.name;} )
          .sortBy(function(item){ return item.length; } )
          .value(),
        bubbleArray = [];

      if (largest.length > 100) {
        largest = largest.slice(largest.length - 100);
      }

      $.each(largest, function(index, word) {
        ratingCount = word.length;
        if ( ratingCount >= 3 ) {
          wordName = word[0].name;
          ratingTotal = 0;
          $.each (word, function(index, word2) {
            ratingTotal += parseInt(word2.rating);
          });
          bubbleArray.push([wordName,ratingCount,ratingTotal/ratingCount]);
        }
      });

    promise.resolve(bubbleArray);
    return promise;
  }

  return {
    processReviews: _processReviews,
    countWords: _countWords
  };

});