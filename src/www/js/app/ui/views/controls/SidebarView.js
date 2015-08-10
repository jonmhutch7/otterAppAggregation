define(function(require) {

  var BaseView = require('app/ui/views/BaseView'),
      state = require('app/models/StateModel'),
      router = require('lavaca/mvc/Router'),
      Promise = require('lavaca/util/Promise'),
      Detection = require('lavaca/env/Detection'),
      Service = require('app/data/Service'),
      Collection = require('app/models/AppCollection'),
      AnalyzeModel = require('app/models/AnalyzeModel'),
      CompareModel = require('app/models/CompareModel'),
      ScatterModel = require('app/models/ScatterModel'),
      AppCollection = require('app/models/AppCollection');
  require('rdust!templates/sidebar');

  /**
   * SidebarBaseView type
   * @class app.ui.BaseViews.globalUI.SidebarBaseView
   * @super Lavaca.mvc.BaseView
   */
  var SidebarView = BaseView.extend(function(){
      BaseView.apply(this, arguments);

      this.mapEvent({
        '.stateSelectorToggle': {
          tap: this.toggleState.bind(this)
        },
        '#typeSelector': {
          'change': $.proxy(_onTypeChange, this)
        },
        'form': {
          submit: _onSubmit.bind(this)
        },
        '.comparisonSelector.active': {
          tap: this.appRoute.bind(this)
        },
        '#generateComparison': {
          tap: _newCompare.bind(this)
        },
        '.deleteItem': {
          tap: _deleteItem.bind(this)
        },
        '#clearAll': {
          tap: _clearAll.bind(this)
        },
        '.search-btn': {
          tap: this.dropdown.bind(this)
        },
        '#industrySelector': {
          change: _selectIndustry.bind(this)
        },
        '#helpButton': {
          tap: _openPopup.bind(this)
        },
        '.share.facebook': {
          tap: _shareFacebook.bind(this)
        },
        '.share.twitter': {
          tap: _shareTwitter.bind(this)
        }
      });
    }, {
    /**
     * The name of the template used by the BaseView
     * @property {String} template
     * @default 'templates/sidebar'
     */
    template: 'templates/sidebar',
    /**
     * A class name added to the BaseView container
     * @property {String} className
     * @default 'drawer'
     */
    className: 'sidebar',
    hasSearched: false,
    scatterState: null,
    onRenderSuccess: function() {
      BaseView.prototype.onRenderSuccess.apply(this, arguments);
      $.getJSON("assets/countries.json", function(data) {
          for (var i = 0; i < data.countries.length; i++) {
            var item = data.countries[i];
            var option = document.createElement('option');

            option.value = item.code;
            option.textContent = item.name;

            $('#countrySelector').append(option);
          }
          $('#countrySelector option[value=US]').attr('selected','selected');

      });
    },
    configure: function(state) {
      $('.stateSelectorToggle').removeClass('active');

      if (state === 'analyze') {
        $('#state1.stateSelectorToggle').addClass('active');
        $('.state2, .state3').hide();
        $('.state1').show();
        $('.hide-industry').show();
      } else if (state === 'compare') {
        $('#state2.stateSelectorToggle').addClass('active');
        $('.state1, .state3').hide();
        $('.state2').show();
        $('.hide-industry').show();
      } else if ((state === 'scatter company') || (state === 'scatter industry')) {
        $('#state3.stateSelectorToggle').addClass('active');
        $('.state2, .state1').hide();
        $('.state3').show();
        if (state === 'scatter company') {
          $('.hide-industry').show();
          $('#industrySelector').hide();
          $('#typeSelector').find('option[value="company"]').attr("selected",true);
        } else {
          $('.hide-industry').hide();
          $('#industrySelector').show();
          $('#typeSelector').find('option[value="industry"]').attr("selected",true);
        }
      }
    },
    toggleState: function(e) {
      var el = e.currentTarget;
      var attr = $(el).attr('data-state'),
          model,
          url;

      $('#comparisonSearchField').empty();

      switch (attr) {
        case 'Analyze':
          model = AnalyzeModel.toObject();

          if (!model.items) {
            url = '/analyze?appId=333903271&country=us';
          } else {
            url = '/analyze?appId=' + model.items.appId + '&country=' + model.items.country;
          }

          router.exec(url);
          break;
        case 'Compare':
          model = CompareModel;

          if (model.count() === 0) {
            url = '/compare?appId=284882215,333903271&country=us,us';
          } else {
            var country = "",
                id = "";
            for (var i = 0; i < model.count(); i++) {
              id += model.itemAt(i).get('appId') + ',';
              country += model.itemAt(i).get('country')+ ',';
            }
            url = '/compare?appId=' + id.substring(0, id.length - 1) + '&country=' + country.substring(0, country.length - 1);;
          }

          model.clear();

          router.exec(url);
          break;
        case 'Scatter':
          model = ScatterModel;

          var scatterState = this.scatterState;

          if (model.count() === 0) {
            url = '/scatter?company=Facebook,%20Inc.&country=us';
          } else {
            var country = scatterState.country;
            if (scatterState.company) {
              var company = scatterState.company;
              url = '/scatter?company=' + company + '&country=' + country;
            } else {
              var industry = scatterState.industry;
              url = '/scatter?industry=' + industry + '&country=' + country;
            }
          }

          router.exec(url);
          break;
      }
    },
    appRoute: function(e) {
      var state = $('.stateSelectorToggle.active').attr('data-state'),
          el = $(e.currentTarget),
          id = el.attr('data-appid'),
          name = el.attr('data-appname'),
          country = el.attr('data-country'),
          rating = el.attr('data-rating'),
          image = el.attr('data-image'),
          company = el.attr('data-company');


      el.removeClass('active');

      if (state === 'Analyze') {
        if (window.innerWidth <= 640) {
          this.dropdown();
        }
        _newAnalyze({'appId': id, 'country': country, 'name': name, 'rating': rating, 'model': AnalyzeModel, 'image': image}, el);
      } else if (state === 'Compare') {
        if (Detection.isMobile) {
          $('#comparisonSearchField').empty();
        }
        this.addCompare({'appId': id, 'country': country, 'name': name, 'rating': rating, 'model': CompareModel, 'image': image});
      } else if (state === 'Scatter') {
        $('#comparisonSearchField').empty();
        _newScatter(company, country);
      }

    },
    addCompare: function(data) {
      $('.search-container').removeClass('compare-error');
      if ( $('#comparison .comparedAppItem.itemActive').size() < 6 ) {
        if ( $('#comparison .comparedAppItem.itemActive').size() === 0 ) {
          $('#comparison').prepend('<div class="comparedAppItem itemActive" data-appid="' + data.appId + '" data-appname="' + data.name + '" data-country="'+ data.country +'" data-rating="'+ data.rating +'" data-image="'+ data.image +'"><div class="itemDrag"></div><div class="comparedAppName">' + data.name + ' - '+ data.country.toUpperCase() + '</div><div class="deleteItem"></div></div>');
        } else {
          $('#comparison .comparedAppItem.itemActive').last().after('<div class="comparedAppItem itemActive" data-appid="' + data.appId + '" data-appname="' + data.name + '" data-country="'+ data.country +'" data-rating="'+ data.rating +'" data-image="'+ data.image +'"><div class="itemDrag"></div><div class="comparedAppName">' + data.name + ' - '+ data.country.toUpperCase() + '</div><div class="deleteItem"></div></div>');
        }
        $('.comparedAppItem.itemInactive').last().hide();
      } else {
        $('.search-container').addClass('compare-error');
      }
    },

    dropdown: function() {
      $('#sidebar').toggleClass('index');
      $('#comparisonSearchField').empty();
      $('.mobile-dropdown').toggle();
    }

  });

  function _onTypeChange(e) {
    var el = e.currentTarget;
    var val = $(el).val();

    if (val === "company") {
      $('.hide-industry').show();
      $('#industrySelector').hide();
    } else {
      $('.hide-industry').hide();
      $('#industrySelector').show();
    }
  }

  function _newAnalyze(data, el) {
    $('.comparisonSelector').addClass('active');
    el.removeClass('active');

    router.exec('/analyze?appId=' + data.appId + '&country=' + data.country);
  }

  function _newCompare() {
    if ($('#comparison .comparedAppItem.itemActive').size() === 0) {
      alert('todo');
    } else {
      var elements = $('#comparison').children('.itemActive'),
          array = [],
          countryStr = '',
          idStr = '';

      $('#comparisonSearchField').empty();
      this.hasSearched = true;

      for (var i = 0; i < elements.length; i++) {
        var el = $(elements[i]),
            id = el.attr('data-appid'),
            country = el.attr('data-country');

        idStr += id + ',';
        countryStr += country + ',';
      }

      CompareModel.clear();

      if (window.innerWidth <= 640) {
        this.dropdown();
      }
      router.exec('/compare?appId=' + idStr.substring(0, idStr.length - 1) + '&country=' + countryStr.substring(0, countryStr.length - 1));
    }
  }

  function _newScatter(term, country) {
    this.scatterState = {'company': term, 'country': country, 'industry': null};

    router.exec('/scatter?company=' + term + '&country=' + country);
  }
  function _selectIndustry(e) {
    var industry = $(e.currentTarget).val(),
        country = $('#countrySelector').val();

    this.scatterState = {'industry': industry, 'country': country, 'company': null};

    if (window.innerWidth <= 640) {
      this.dropdown();
    }

    router.exec('/scatter?industry=' + industry + '&country=' + country);
  }
  function _onSubmit(e) {
    e.stopPropagation();
    e.preventDefault();

    var form = $(e.currentTarget),
        term = form.find('#comparisonSearch').val().trim(),
        country = form.find('#countrySelector').val(),
        typeToggle = 1,
        state = $('.stateSelectorToggle.active').attr('data-state'),
        nameArray = new Array();

    $('#comparisonSearchField').empty();
    $('#comparisonSearchField').append('<p class="comparisonSelector searching active">Searching...<img src="/assets/img/loader.gif" class="loading"></p>');


    if (state === 'Scatter') {
      Service.getCompany(term, country).then(function(response) {
        $('#comparisonSearchField').empty();
        if ( response.results.length === 0 ) {
          $('#comparisonSearchField').append('<p class="comparisonSelector no-results">0 results found</p>');
        } else {
          $.each(response.results, function(index, value) {
                var selection = value.artistName

                if ( $.inArray(selection, nameArray) == -1 ) {
                  nameArray.push(selection);
                  if (ScatterModel.itemAt(0).get('company') === selection) {
                    $('#comparisonSearchField').append('<div class="comparisonSelector" data-company="' + selection + '" data-country="'+ country.toLowerCase() +'"><div class="selection">' + selection + '</div><span class="addItem">+</span></div>');
                  } else {
                    $('#comparisonSearchField').append('<div class="comparisonSelector active" data-company="' + selection + '" data-country="'+ country.toLowerCase() +'"><div class="selection">' + selection + '</div><span class="addItem">+</span></div>');
                  }
                }
            });
        }
      });
    } else {
      Service.getApp(term, country).then(function(response) {
        $('#comparisonSearchField').empty();

        if ( response.results.length === 0 ) {
          $('#comparisonSearchField').append('<p class="comparisonSelector">0 results found</p>');
        } else {
          $.each(response.results, function(index, value) {
            var active = '<div class="comparisonSelector active" data-appid="' + value.trackId + '" data-appname="' + value.trackName + '" data-country="'+ country.toLowerCase() +'" data-rating="'+ value.averageUserRating +'" data-image="'+ value.artworkUrl100 +'"><img src="' + value.artworkUrl60 + '" class="comparisonSelectorLogo"><div class="appName">' + value.trackName + '</div><span class="addItem">+</span></div>',
                inactive = '<div class="comparisonSelector " data-appid="' + value.trackId + '" data-appname="' + value.trackName + '" data-country="'+ country.toLowerCase() +'" data-rating="'+ value.averageUserRating +'" data-image="'+ value.artworkUrl100 +'"><img src="' + value.artworkUrl60 + '" class="comparisonSelectorLogo"><div class="appName">' + value.trackName + '</div><span class="addItem">+</span></div>',
                status = true;

              if (state === 'Analyze') {
                if (AnalyzeModel.get('appId') == value.trackId) {
                  if (AnalyzeModel.get('country') === country.toLowerCase()) {
                    $('#comparisonSearchField').append(inactive);
                  } else {
                    $('#comparisonSearchField').append(active);
                  }
                } else {
                  $('#comparisonSearchField').append(active);
                }
              } else if (state === 'Compare') {
                for (var i = 0; i < CompareModel.count(); i++) {
                  if (CompareModel.itemAt(i).get('appId') == value.trackId) {
                    if (CompareModel.itemAt(i).get('country') === country.toLowerCase()) {
                      status = false;
                      break;
                    } else {
                      status = true;
                    }
                  } else {
                    status = true;
                  }
                }
                if (status) {
                  $('#comparisonSearchField').append(active);
                } else {
                  $('#comparisonSearchField').append(inactive);
                }
              }
          });
        }
      });
    }
    this.hasSearched = true;
  }

  function _deleteItem(e) {
    var el = $(e.currentTarget);
    el.parent().remove();
    $('.comparedAppItem.itemInactive').last().show();
  }

  function _clearAll() {
    CompareModel.clear();
    $('.comparedAppItem.itemActive').remove();
    $('.comparedAppItem.itemInactive').show();
  }

  function _openPopup() {
    $('.help-popup').fadeToggle();
  }

  function _shareFacebook() {
    var url = window.location.href,
        share = 'https://facebook.com/sharer.php?' + url;
    window.open(share, '_blank');
  }

  function _shareTwitter() {
    var url = window.location.href,
        share = 'https://twitter.com/intent/tweet?url='+ encodeURIComponent(url) +'&text=Check out this great free tool to visualize app reviews and performance&via=mutualmobile'
    window.open(share, '_blank');
  }

  return new SidebarView('#sidebar', state);
});