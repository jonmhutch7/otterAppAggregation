define(function(require) {
  var BaseView = require('./BaseView'),

      jqUi = require('jqUi'),
      Detection = require('lavaca/env/Detection'),
      SidebarView = require('app/ui/views/controls/SidebarView'),
      router = require('lavaca/mvc/Router'),
      AnalyzeModel = require('app/models/AnalyzeModel');
  require('rdust!templates/scatter');
  /**
   * Scatter view type
   * @class app.ui.views.ScatterView
   * @extends app.ui.views.BaseView
   */
  var ScatterView = BaseView.extend(function(){
    BaseView.apply(this, arguments);

    this.mapEvent({
      model: {
        'reset': this.reset.bind(this)
      },
      '#play': {
        tap: this.automatePlay.bind(this)
      },
      '.criteria span': {
        tap: this.toggleCriteria.bind(this)
      },

    });

  }, {
    /**
     * The name of the template used by the view
     * @property {String} template
     * @default 'home'
     */
    template: 'templates/scatter',
    /**
     * A class name added to the view container
     * @property {String} className
     * @default 'scatter'
     */
    className: 'scatter',
    initial: true,
    xScale: null,
    yScale: null,
    color: null,
    max: null,
    ratings: 'ratingAverageAll',
    playRunning: false,
    onRenderSuccess: function() {
      BaseView.prototype.onRenderSuccess.apply(this, arguments);
      if (this.model.count()) {
        setTimeout(function() {
          if ($('#scatterSection').width() >= 600) {
            this.createScatter(this.model.toObject(), 'ratingAverageAll');
            this.initiateSlider();
          } else {
            $('.load-container').hide();
          }
        }.bind(this), 500);
      }

    },
    initiateSlider: function() {
      var self = this;

      $("#slider").slider({
        min: 0,
        max: 2,
        step: 0.05,
        animate: 'fast',
        slide: function() {
          slidePoint = $('#slider').slider('value');
          self.slideData(slidePoint,50,0,'cubic-in-out');
        },
        stop: function() {
          stoppingPoint = Math.round($('#slider').slider('value'));
          $( "#slider" ).slider( "value", stoppingPoint );
          self.updateData(stoppingPoint);
          self.clearTrail(750, 500);
        }
      });
    },
    reset: function() {
      var self = this;
      this.redraw(null, this.model).then(function() {
        if ($('#scatterSection').width() >= 600) {
          this.createScatter(this.model.toObject(), 'ratingAverageAll');
          this.initiateSlider();
        } else {
            $('.load-container').hide();
          }
      });
    },
    calculateScore: function(ratingCount, rating) {
      var exp = 0.12;
      var expRating = 1.2;
      return parseInt(Math.pow(ratingCount,exp) * Math.pow(rating,expRating) / (Math.pow(this.max,exp)*Math.pow(5,expRating)*0.01));
    },
    setScatterHeader: function() {
      var scatterState = SidebarView.scatterState;

      if (scatterState.company) {
        $('#selectedCompany').text(scatterState.company);
      } else if (scatterState.industry) {
        $('#selectedCompany').text('Industry - ' + scatterState.industry);
      }
    },
    createScatter: function(data, ratings) {
      $('.d3-scatterTip, .d3-scatterTip2').remove();

      this.setScatterHeader();

      var data = data.items;
      var width = parseInt(d3.select('#chartHolder').style('width'), 10);
      var height = parseInt(d3.select('#chartHolder').style('height'), 10);
      var marginLeft = 30;
      var marginRight = 40;
      var marginTop = 35;
      var marginBottom = 35;
      var duration = 500;
      var exp = 0.12;
      var expRating = 1.2;

      this.max = d3.max(data,function(d) {return d['velocityAll'];});

      var self = this; 

      // Define scales
      this.xScale = d3.scale.pow().exponent(0.4)
                .domain([0,this.max * 1.1])
                .range([marginLeft,width - marginRight]);
      this.yScale = d3.scale.linear()
                .domain([5,1])
                .range([marginTop,height - marginBottom]);
      this.color = d3.scale.linear()
                  .domain([1,50,100])
                  .range(["#e76a2a", "#f1df33","#55bc81"]);

      // Define line
      var line = d3.svg.line()
            .x(function(d) {return Math.pow(((20 * Math.pow(this,max,exp) * Math.pow(5,expRating) * 0.01) / Math.pow(rating,expRating)),(1/exp)) ;})
            .y(function(d) {return Math.pow(((20 * Math.pow(this.max,exp) * Math.pow(5,expRating) * 0.01) / Math.pow(ratingCount,exp)),(1/expRating)) ;});

      // Define axes
      var xAxis = d3.svg.axis()
                .scale(this.xScale)
                .orient('bottom');
      var yAxis = d3.svg.axis()
                .scale(this.yScale)
                .orient('left')
                .ticks(5);


      // Create mini circle function
      function historicalPoints(rating,text,classNum, self) {
        logoG.append('circle')
            .attr('cx', function(d) {return self.xScale(d['velocityAll']);})
            .attr('cy', function(d) {return self.yScale(d[rating]);})
            .attr('r', 0)
            .attr('class',function(d,i) { return 'historicalCircle historical' + i + ' historicalClass' + classNum;})
            .style('fill',function(d) {return self.color(self.calculateScore(d['velocityAll'],d[rating]));});

        logoG.append('text')
            .attr('class',function(d,i) {return 'historicalText historical' + i + ' historicalClass' + classNum;})
            .attr('x',function(d) {return self.xScale(d['velocityAll']);})
            .attr('y', function(d) {return self.yScale(d[rating]) + 3;})
            .text(text);
      }

            // Create SVG canvas
              var svg = d3.select('#chartHolder')
                    .append('svg')
                    .attr('width',width)
                    .attr('height',height);

            // Draw background
              // Create holder for background
                var backgroundG = svg.append('g').attr('width',width).attr('height',height);
                var clips = backgroundG.append("defs").append("svg:clipPath")
                              .attr("id", 'backgroundClip')
                              .append("rect")
                              .attr('width', width - marginLeft - marginRight + 20)
                              .attr('height', height - marginTop - marginBottom + 20)
                              .attr('transform','translate(' + (marginLeft - 10) + ',' + (marginTop - 10) + ')');
                  // Formula for calculating Y value based upon X
                  calculateY = function(xVal,score) {
                    return Math.pow((score * Math.pow(100,exp) * Math.pow(5,expRating) * 0.01 / (Math.pow(xVal,exp))),1/expRating);
                  };
              // Background scales
                var xScaleBackground = d3.scale.pow().exponent(0.4)
                            .domain([0,100])
                            .range([marginLeft,width - marginRight - 2]);
                var colorBackground = d3.scale.linear()
                            .domain([0,20,40,60,80])
                            .range(["#fcecde", "#fcf3de","#fdfadf","#eff7e6","#e5f5eb"]);           
                var d3line2 = d3.svg.line()
                    .x(function(d){return xScaleBackground(d.x);})
                    .y(function(d){return self.yScale(d.y);})
                    .interpolate("basis");
                var area = d3.svg.area()
                    .x(function(d) { return xScaleBackground(d.x); })
                    .y0(function(d) {return self.yScale(d.y);})
                    .y1(function(d) { return self.yScale(5.2); })
                    .interpolate("basis");
              // Create XY coordinates to plot background functions
                // Formula for calculating even X intervals on exponential scale
                  calculateX = function(percent) {
                    return Math.pow((6.30957 * percent / 10),1/0.4);
                  };
                // Create set of X variables 
                  xVars = [];
                  for ( i = 0.01; i <= 10.01; i += 0.1 ) {
                    xVars.push(calculateX(i));
                  }
                // Iterate through all background bands
                  for ( i = 0; i <= 80; i += 20 ) {
                    pathinfo = [];
                    // Set background variable to define color later in function
                      backgroundArc = i;
                    // Iterate through all X variables for a certain band
                      for ( j = 0; j < xVars.length; j++ ) {
                        // Create empty new object
                          newObject = {};
                        // Add parameters to object
                          newObject['x'] = xVars[j];
                          newObject['y'] = calculateY(xVars[j],i);
                        // Push object to pathinfo
                          pathinfo.push(newObject);
                      }
                    // Append the band dotted line
                      backgroundG.append("svg:path")
                        .attr("d", d3line2(pathinfo))
                        .attr("clip-path", function(d,i) {return "url(#backgroundClip)";})
                        .style("stroke-width", 1)
                        .style("stroke", "#e2e2e2")
                        .style("fill", "none");
                    // Append the band background color
                      backgroundG.append("svg:path")
                          .attr("clip-path", function(d,i) {return "url(#backgroundClip)";})
                          .attr("d", area(pathinfo))
                          .style("stroke-width", 2)
                          .style("stroke", "none")
                          .style("fill", function() {return colorBackground(backgroundArc);});
                  }

              $('.scatter #chartHolder').removeClass('hidden');

              // Append Axis Titles
              // Append Y Titles
                var logos = svg.append('svg:image')
                  .attr('xlink:href',function(d) { return 'assets/img/stars_5.png';})
                  .attr('x',width / 2 + (marginLeft - marginRight) / 2 + 10)
                  .attr('y',marginTop - 6)
                  .attr('width',66)
                  .attr('height',12);
                var logos = svg.append('svg:image')
                  .attr('xlink:href',function(d) { return 'assets/img/stars_1.png';})
                  .attr('x', width / 2 + (marginLeft - marginRight) / 2 + 10)
                  .attr('y', height - marginBottom - 8)
                  .attr('width',66)
                  .attr('height',12);
              // Append X Titles
                var xTitle = svg.append('g')
                  .attr('x',0)
                  .attr('y',0)
                  .attr('class','axisLabel')
                  .attr('transform','translate(' + (width - 22 ) + ',' + (height / 2 + (marginTop - marginBottom)) + ')')
                  .append('text')
                    .text('Popularity (Ratings / Day)')
                    .attr('transform', function(d) {return 'rotate(90)';});

            // Append Axes
              // X Axis
                var xAxis = svg.append('g')
                  .attr('id','xAxis')
                  .attr('class','axis')
                  .attr('transform','translate(0,' + (marginTop + (height - marginBottom - marginBottom)/2) + ')')
                  .call(xAxis);
                d3.selectAll('#xAxis g.tick line')
                  .attr('y2', function(d) {return 10;});
                d3.selectAll('#xAxis g.tick text')
                  .attr('y', 16);
              // Y Axis
                svg.append('g')
                  .attr('id','yAxis')
                  .attr('class','axis')
                  .attr('transform','translate(' + (marginLeft + (width - marginLeft - marginRight)/2) + ',0)')
                  .call(yAxis);
                d3.selectAll('#yAxis g.tick line')
                  .attr('x1', -10)
                  .attr('x2', 0);
                d3.selectAll('#yAxis g.tick text')
                  .attr('x', -14);
              // Remove all Axis text
                d3.selectAll('#yAxis text')
                  .remove();

            // Set tooltip
              var tip = d3Tip()
                .attr('class', 'd3-scatterTip scatterTip')
                .offset([71, 140])
                .html(function(d) {
                    return "<a href='/analyze?appId=" + d.appId + "&country=" + d.country + "'> <p class='appTitle' style='color:" + self.color(self.calculateScore(d['velocityAll'],d[self.ratings])) + "'>" + d['name'] + "</p></a><p class='tipText tipText1'>average rating <span class='tipHeavy'>" + d[ratings] + "</span></p><p class='tipText'>popularity <span class='tipHeavy'>" + d['velocityAll'].toFixed(2) + "</span></p>";
                });
              var tip2 = d3Tip()
                .attr('class', 'd3-scatterTip2 scatterTip')
                .offset([71,-140])
                .html(function(d) {
                    return "<p class='appTitle' style='color:" + self.color(self.calculateScore(d['velocityAll'],d[self.ratings])) + "'>" + d['name'] + "</p><p class='tipText tipText1'>average rating <span class='tipHeavy'>" + d[ratings] + "</span></p><p class='tipText'>popularity <span class='tipHeavy'>" + d['velocityAll'].toFixed(2) + "</span></p>";
                });

        // Append All Logos
          // Create G Holder
          var logoG = svg.append('g')
                .attr('id','allLogosContainer')
                .selectAll('g')
                .data(data)
                  .enter()
                .append('g')
                  .attr('class','logoHolder')
                  .on('mouseover', function(d,i) {
                    this.parentNode.appendChild(this);

                      if (!self.playRunning ) {
                        d3.select(this).select('.circleFrame').transition().duration(duration / 3)
                          .attr('r',26);
                        d3.select(this).select('.clipping circle').transition().duration(duration / 3)
                          .attr('r',26);
                        d3.select(this).select('.logo').transition().duration(duration / 3)
                          .attr('width','52px')
                          .attr('height','52px')
                          .attr('x',function(d) {return self.xScale(d['velocityAll']) - 26;})
                          .attr('y', function(d) {return self.yScale(d[self.ratings]) - 26;});
                        d3.select(this).select('.scoreCircle').transition().duration(duration / 3)
                          .attr('transform','translate(2,-2)')
                          .attr('r',13);
                        d3.select(this).select('.scoreText').transition().duration(duration / 3)
                          .attr('transform','translate(2,-2)');
                        // Show historical elements
                          d3.selectAll('circle.historical' + i).transition().duration(duration / 3)
                            .attr('r',14);
                          d3.select('.historicalLine' + i).transition().duration(duration / 3)
                            .style('stroke-width',1);
                          d3.selectAll('text.historical' + i).transition().duration(duration / 3)
                            .style('fill','black').style('font-size','10px');
                    }

                    if ( self.xScale(d['velocityAll']) < 300 ) {
                      tip.show(d);
                      tip2.hide(d);
                    } else {
                      tip2.show(d);
                      tip.hide(d);
                    }
                  })
                  .on('mouseout', function(d,i) {
                    tip.hide(d);
                    tip2.hide(d);
                    this.parentNode.appendChild(this);
                    // Return all logo elements to normal state if play automation not running
                     if ( !self.playRunning ) {
                        d3.select(this).select('.circleFrame').transition().duration(duration / 3)
                          .attr('r',22);
                        d3.select(this).select('.clipping circle').transition().duration(duration / 3)
                          .attr('r',21);
                        d3.select(this).select('.logo').transition().duration(duration / 3)
                          .attr('width','42px')
                          .attr('height','42px')
                          .attr('x',function(d) {return self.xScale(d['velocityAll']) - 21;})
                          .attr('y', function(d) {return self.yScale(d[self.ratings]) - 21;});
                        d3.select(this).select('.scoreCircle').transition().duration(duration / 3)
                          .attr('transform','translate(0,0)')
                          .attr('r',12);
                        d3.select(this).select('.scoreText').transition().duration(duration / 3)
                          .attr('transform','translate(0,0)');
                    // Hide historical elements
                        d3.selectAll('circle.historical' + i).transition().duration(duration / 3).attr('r',0);
                        d3.select('.historicalLine' + i).transition().duration(duration / 3).style('stroke-width',0);
                        d3.selectAll('text.historical' + i).transition().duration(duration / 3).style('fill','white').style('font-size','0px');
                    }
                      
                  })
                  .on('click', function(d) {
                    if (Detection.isMobile) {
                      this.parentNode.appendChild(this);

                        if (!self.playRunning ) {
                          d3.select(this).select('.circleFrame').transition().duration(duration / 3)
                            .attr('r',26);
                          d3.select(this).select('.clipping circle').transition().duration(duration / 3)
                            .attr('r',26);
                          d3.select(this).select('.logo').transition().duration(duration / 3)
                            .attr('width','52px')
                            .attr('height','52px')
                            .attr('x',function(d) {return self.xScale(d['velocityAll']) - 26;})
                            .attr('y', function(d) {return self.yScale(d[self.ratings]) - 26;});
                          d3.select(this).select('.scoreCircle').transition().duration(duration / 3)
                            .attr('transform','translate(2,-2)')
                            .attr('r',13);
                          d3.select(this).select('.scoreText').transition().duration(duration / 3)
                            .attr('transform','translate(2,-2)');
                          // Show historical elements
                            d3.selectAll('circle.historical' + i).transition().duration(duration / 3)
                              .attr('r',14);
                            d3.select('.historicalLine' + i).transition().duration(duration / 3)
                              .style('stroke-width',1);
                            d3.selectAll('text.historical' + i).transition().duration(duration / 3)
                              .style('fill','black').style('font-size','10px');
                      }

                      if ( self.xScale(d['velocityAll']) < 300 ) {
                        tip.show(d);
                        tip2.hide(d);
                      } else {
                        tip2.show(d);
                        tip.hide(d);
                      }
                    } else {
                      $('.d3-scatterTip, .d3-scatterTip2').remove();
                      AnalyzeModel.clear();

                      router.exec('/analyze?appId=' + d.appId + '&country=' + d.country);
                    }
                  });
          // Append group to contain slider trailing circles
            var trail = logoG.append('g')
              .attr('class','sliderTrailG');

          // Append Historical Line 
            logoG.append('svg:line')
              .attr('class',function(d,i) { return'historicalLine historicalLine' + i;})
              .attr("x1", function(d) {return self.xScale(d['velocityAll']);})
              .attr("y1", function(d) {return self.yScale(d3.max([d['ratingAverageAll'],d['ratingAverage50'],d['ratingAverage100']]));})
              .attr("x2", function(d) {return self.xScale(d['velocityAll']);})
              .attr("y2", function(d) {return self.yScale(d3.min([d['ratingAverageAll'],d['ratingAverage50'],d['ratingAverage100']]));})
              .style('stroke-width',0);
          // Append Historical All circle
            historicalPoints('ratingAverageAll','All',0, self);
          // Append Historical 50 circle
            historicalPoints('ratingAverage50','50',2, self);
          // Append Historical 100 circle
            historicalPoints('ratingAverage100','100',1, self);

          // Append Clip Path definition for logo circles 
            var clips = logoG.append("defs").append("svg:clipPath")
                  .attr("id", function(d,i) {return "logoClip" + i ;})
                  .attr('class','clipping')
                  .append("circle")
                    .attr('cx', function(d) {return self.xScale(d['velocityAll']);})
                .attr('cy', function(d) {return self.yScale(d[self.ratings]);})
                    .attr('r',0)
                    .transition()
                            .delay(0)
                            .duration(duration)
                            .attr('r',21);
          // Append logos
            var logos = logoG.append('g').append('svg:image')
                  .attr('xlink:href',function(d) { return d['image'];})
                  .attr('class','logo')
                  .attr("clip-path", function(d,i) {return "url(#logoClip" + i + ")";})
                  .attr('x',function(d) {return self.xScale(d['velocityAll']);})
                  .attr('y', function(d) {return self.yScale(d[self.ratings]);})
                  .attr('width','0px')
                  .attr('height','0px')
                  .transition()
                            .delay(0)
                            .duration(duration)
                            .attr('x',function(d) {return self.xScale(d['velocityAll']) - 21;})
                    .attr('y', function(d) {return self.yScale(d[self.ratings]) - 21;})
                            .attr('width','42px')
                    .attr('height','42px');
          // Append border to logos
            var borders = logoG.append('circle')
                .attr('cx', function(d) {return self.xScale(d['velocityAll']);})
                .attr('cy', function(d) {return self.yScale(d[self.ratings]);})
                .attr('r', 0)
                .attr('class','circleFrame')
                .style('stroke',function(d) {return self.color(self.calculateScore(d['velocityAll'],d[self.ratings]));})
                .transition()
                    .delay(0)
                    .duration(duration)
                    .attr('r',22);
          // Append score circle
            var scoreCircle = logoG.append('circle')
                .attr('cx', function(d) {return self.xScale(d['velocityAll'])+18;})
                .attr('cy', function(d) {return self.yScale(d[self.ratings])-18;})
                .attr('r', 0)
                .attr('class','scoreCircle')
                .style('fill',function(d) {return self.color(self.calculateScore(d['velocityAll'],d[self.ratings]));})
                .transition()
                            .delay(0)
                            .duration(duration)
                            .attr('r',12);
          // Append score
            var score = logoG.append('text')
                .attr('class','scoreText')
                .attr('x',function(d) {return self.xScale(d['velocityAll']) + 18;})
                .attr('y', function(d) {return self.yScale(d[self.ratings]) - 13;})
                .text(function(d) {return self.calculateScore(d['velocityAll'],d[self.ratings]);})
                .style('font-size','0px')
                .transition()
                            .delay(0)
                            .duration(duration)
                            .style('font-size','14px');

        // Call tip
          svg.call(tip);
          svg.call(tip2);


        $('.load-container').hide();
    },

    slideData: function(slideValue,speed,delay,easeType) {
      // Make historical points appear
        if ( slideValue === 0 ) {
          // gObject = d3.selectAll()
          d3.selectAll('circle.historicalClass0').transition()
            .delay(delay)
            .attr('r',14);
          d3.selectAll('text.historicalClass0').transition()
            .delay(delay)
            .style('fill','black').style('font-size','10px');
        }
        else if ( slideValue > 0.99 && slideValue < 1.01) {
          d3.selectAll('circle.historicalClass1').transition()
            .attr('r',14);
          d3.selectAll('text.historicalClass1').transition()
            .style('fill','black').style('font-size','10px');
        }
        else if ( slideValue >= 2 ) {
          d3.selectAll('circle.historicalClass2').transition()
            .attr('r',14);
          d3.selectAll('text.historicalClass2').transition()
            .style('fill','black').style('font-size','10px');
        }
      // Set variables based upon slider position
        if ( slideValue < 1 ) {
          var rating1 = 'ratingAverageAll';
          var rating2 = 'ratingAverage100';
          var min = 0;
          var max = 1;
        }
        else if ( slideValue <= 2 ) {
          var rating1 = 'ratingAverage100';
          var rating2 = 'ratingAverage50';
          var min = 1;
          var max = 2;
        }
      // Retrieve number of g's
        var appCount = d3.selectAll('#allLogosContainer g')[0].length;
      // Cycle through each g element and move it to its new spot
        for ( i = 0; i < appCount; i++ ) {
          // Select an individual application to move
            var gObject = d3.select(d3.selectAll('#allLogosContainer g')[0][i]);
          // Get that object's ratings
            var gRating1 = gObject[0][0]['__data__'][rating1];
            var gRating2 = gObject[0][0]['__data__'][rating2];
          // Set the slide scale
            var slideScale = d3.scale.linear()
              .domain([min,max])
              .range([gRating1,gRating2]);
          // Get the rating
            var gRating = slideScale(slideValue);
          // Individually transition all elements of the application
            this.transition(gObject,gRating,speed,1,easeType);
        }
    },
    transition: function(gObject, gRating, duration, trailActive, easeType) {
      var self = this;
        if (trailActive) {
          gObject.select('.sliderTrailG').append("circle")
                .attr('cx', function(d) {return self.xScale(d['velocityAll']);})
            .attr('cy', function(d) {return self.yScale(gRating);})
            .attr('class','slideTrail')
                .transition()
                        .delay(0)
                        .duration(500)
                        .attr('r',1.2);
        }
      // Transition the logo
        gObject.select('image').transition().duration(duration).ease(easeType)
          .attr('y', function(d) {return self.yScale(gRating) - 21;})
          .text(function(d) {return self.calculateScore(d['velocityAll'],gRating);});
      // Transition the clipping image
        gObject.select('.clipping circle').transition().duration(duration).ease(easeType)
          .attr('cy', function(d) {return self.yScale(gRating);});
      // Transition the border
        gObject.select('.circleFrame').transition().duration(duration).ease(easeType)
          .attr('cy', function(d) {return self.yScale(gRating);})
          .style('stroke',function(d) {return self.color(self.calculateScore(d['velocityAll'],gRating));});
      // Transition the score circle
        gObject.select('.scoreCircle').transition().duration(duration).ease(easeType)
          .attr('cy', function(d) {return self.yScale(gRating) - 18;})
          .style('fill',function(d) {return self.color(self.calculateScore(d['velocityAll'],gRating));});
      // Transition the score
        gObject.select('.scoreText').transition().duration(duration).ease(easeType)
          .attr('y', function(d) {return self.yScale(gRating) - 13;})
          .text(function(d) {return self.calculateScore(d['velocityAll'],gRating);});
    },
    updateData: function(rating) {
      // Set the correct rating variable
        if (rating === 1) {
          var rating = 'ratingAverage100';
          this.ratings = 'ratingAverage100';
        }
        else if ( rating === 2 ) {
          var rating = 'ratingAverage50';
          this.ratings = 'ratingAverage50';
        }
        else {
          var rating = 'ratingAverageAll';
          this.ratings = 'ratingAverageAll';
        }
      // Retrieve number of g's
        var appCount = d3.selectAll('#allLogosContainer g')[0].length;
      // Cycle through each g element and move it to its new spot
        for ( i = 0; i < appCount; i++ ) {
          // Select an individual application to move
            var gObject = d3.select(d3.selectAll('#allLogosContainer g')[0][i]);
          // Get that object's ratings
            var gRating = gObject[0][0]['__data__'][rating];
          // Individually transition all elements of the application
            this.transition(gObject,gRating,1000,0,'cubic-in-out');
        }
    },
    clearTrail: function(speed, delay) {
      // Remove all trail circles
        d3.selectAll('.slideTrail').transition()
          .delay(delay)
          .duration(speed)
          .attr('r',0)
          .transition()
            .remove();
      // Remove all historical points
        d3.selectAll('.historicalCircle').transition()
            .delay(delay)
            .duration(speed)
            .attr('r',0);
          d3.selectAll('.historicalText').transition()
            .delay(delay)
            .duration(speed)
            .style('fill','black').style('font-size','0px');
    },
    automatePlay: function(start, cancel) {
      if (!this.playRunning || (start < 2)) {

        
        this.playRunning = true;


        var self = this;

        if ((!start) || (start === 0) || isNaN(parseInt(start))) {
          var cancel = true;
          var start = 0;
        }

        if (start === 0 || cancel === false ) {
          if (start !== 0 ) {
            this.slideData(start,150,0,'linear');
          } else {
            this.slideData(start,150,150,'linear');
          }

          $( "#slider" ).slider( "value", start );
        }

        start += 0.05;
          
        if ( start < 2 ) {
          if (cancel === false ) {
            setTimeout(function() {
              self.automatePlay(start, cancel);
            },150);
          } else if ( start === 0.05 ) {
            setTimeout(function() {
              cancel = false; 
              self.automatePlay(start, cancel);
            },250);
          }
        } else {
          this.playRunning = false;
          this.clearTrail(800,400);
          self.ratings = 'ratingAverage50';
        }
      }
    },
    toggleCriteria: function(e) {
      var el = $(e.currentTarget),
          criteria = el.attr('data-criteria');

      $('#scatter-mobile ul').removeClass('hundred fifty all');
      $('.criteria span').removeClass('active');
      el.addClass('active');

      if (criteria === 'all') {
        $('#scatter-mobile ul').addClass('all');
      } else if (criteria === '100') {
        $('#scatter-mobile ul').addClass('hundred');
      } else if (criteria === '50') {
        $('#scatter-mobile ul').addClass('fifty');
      }

    }
  });
  return ScatterView;
});