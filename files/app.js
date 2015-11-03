var data; 

var margin = {top: 30, right: 50, bottom: 30, left: 50},
    width = 900 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

var rec_margin = 50;  

var tickFormat = "%b %e";
var timeDomain = [d3.time.day.offset(Date.now(),-360), new Date()];

var x = d3.time.scale().domain(timeDomain).range([0, width]);
// var x = techan.scale.financetime().range([0, width]);
var y = d3.scale.linear().range([height, 0]);
var y2 = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().ticks(6).tickFormat(d3.time.format(tickFormat)).tickPadding(8).scale(x).orient("bottom");

var yAxis = d3.svg.axis().scale(y).orient("left");
var yAxis2 = d3.svg.axis().scale(y2).orient("right").tickFormat(d3.format(".0%"));;

// var sell_line = d3.svg.line()
//     .x(function(d) { return x(d.updated_time); })
//     .y(function(d) { return y(d.sell_price); });

// var buy_line = d3.svg.line()
//     .x(function(d) { return x(d.updated_time); })
//     .y(function(d) { return y(d.buy_price); });  

var zoom = d3.behavior.zoom()
    .x(x)
    .scaleExtent([1,20])
    .on('zoom', function(){
      redraw(tickFormat,x.domain());
      updateViewportFromChart();
    });

var svg = d3.select(".plot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .call(zoom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// --tooltip--
var focus = svg.append("g") 
    .style("display", "none");
var bisectDate = d3.bisector(function(d) { return d.date; }).left;
var formatDate = d3.time.format("%d-%b-%y");

// --nav chart--
var navWidth = width, 
    navHeight = 100- margin.top - margin.bottom;

var navTickFormat = "%b %y";
var navTimeDomain = [d3.time.month.offset(Date.now(),-12), new Date()];

var navx = d3.time.scale().domain(navTimeDomain).range([0, navWidth]);
var navy = d3.scale.linear().range([navHeight, 0]);

var navxAxis = d3.svg.axis().ticks(6).tickFormat(d3.time.format(navTickFormat)).tickPadding(8).scale(navx).orient("bottom");

// var navyAxis = d3.svg.axis().scale(navy).orient("left");

var navArea = d3.svg.area()
    .x(function(d) { return navx(d.date); })
    .y0(navHeight)
    .y1(function(d) { return navy((d.high+d.low)/2); });

var viewport = d3.svg.brush()
    .x(navx)
    .on("brush", function () {
        tickFormat = "%b %e";
        x.domain(viewport.empty() ? navx.domain() : viewport.extent());
        redraw(tickFormat,x.domain());
    });

var navChart = d3.select(".nav_chart").append("svg")
    .attr("width", navWidth + margin.left + margin.right)
    .attr("height", navHeight + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

navChart.append("g")
    .attr("class", "viewport")
    .call(viewport)
    .selectAll("rect")
    .attr("height", navHeight);

//-- draw data --
// draw upper chart

d3.json("/price_data_all/", function(error, json) {
  if (error) throw error;
  if(json.length <=0) return;
  // console.log(json);
  data = json;
  // console.log(data);

  data.forEach(function(d) {
    d.date = new Date(d.date);
    d.open = +d.open;
    d.high = +d.high;
    d.low = +d.low;
    d.close = +d.close;
    d.avg = (d.high+d.low)/2;
  });
  // console.log(data);

  // draw Nav chart
  // nav_data = data.map(function(d) {
  //     // console.log(Date.parse(d.Date));
  //     return {
  //         date: new Date(d.date),
  //         avg: (d.high+d.low)/2
  //     };
  // });

  // navx.domain(d3.extent(data, function(d) { return d.date; }));
  navy.domain(d3.extent(data, function(d) { return d.avg; }));

  navChart.append("g")
      .attr("class", "navx axis")
      .attr("transform", "translate(0," + navHeight + ")")
      .call(navxAxis)

  navChart.append("path")
    .datum(data)
    .attr("class", "area")
    .attr("d", navArea);

  // filter data for time domain of upper chart
  data = data.filter(function(d) {
    return d.date >= timeDomain[0]&&d.date <= timeDomain[1];
  });

  // bisector only works on sorted data !!!!
  data.sort(function(a, b) { return a.date - b.date; });

  x.domain(d3.extent(data, function(d) { return d.date; }));

  var ymin =  d3.min(data, function(d) { return d.low; });
  var ymax =  d3.max(data, function(d) { return d.high; });

  y.domain([ymin, ymax]);
  // console.log(y.domain()[0],y.domain()[1]);
  
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      // .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("dy", "-0.71em")
      .style("text-anchor", "end")
      .text("Price");

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width +"," + 0 + ")")
    .call(yAxis2)
    .append("text")
    .attr("y", 0)
    .attr("dy", "-0.71em")
    .style("text-anchor", "end")
    .text("Percentage");

    // svg.append("path")
    //     .data([data])
    //     .attr("class", "buy line")
    //     .attr("d", buy_line)
    //     .style("stroke-dasharray", ("6,3"));

    //-- ohlc plot--
    var rect_width = min(0.5 * (width - 2 * margin.left)/ data.length, 10);
    svg.selectAll("rect")
      .data(data)
      .enter().append("rect")
      .attr("class","oc")
      .attr("x", function(d) { return x(d.date)-rect_width/2; })
      .attr("y", function(d) {return y(max(d.open, d.close));})     
      .attr("height", function(d) { return y(min(d.open, d.close))-y(max(d.open, d.close));})
      .attr("width", function(d) { return rect_width; })
      .attr("fill",function(d) { return d.open > d.close ? "red" : "green" ;});

    //   console.log("lala");
    var linestem_width = min(0.25 * (width - 2 * margin.left)/ data.length, 5);
    svg.selectAll("line.stem")
      .data(data)
      .enter().append("line")
      .attr("class", "stem")
      .attr("x1", function(d) { return x(d.date);})
      .attr("x2", function(d) { return x(d.date);})        
      .attr("y1", function(d) { return y(d.high);})
      .attr("y2", function(d) { return y(d.low); })
      .attr("stroke", function(d){ return d.open > d.close ? "red" : "green"; })

    // svg.append("line")
    //    .attr("x1",(width-margin.right-30))
    //    .attr("y1",15)
    //    .attr("x2",(width-margin.right-10))
    //    .attr("y2",15)
    //    .attr("stroke","steelblue")
    //    .style("stroke-dasharray", ("6,3"));

    // svg.append("text")
    //    .attr("fill","black")
    //    .text("Sell")
    //    .attr("transform", "translate(" + (width-margin.right) + ", 5)");

//--tooltip--

   // append the x line
    focus.append("line")
        .attr("class", "x_line")
        .style("stroke", "grey")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)
        .attr("y2", height);

    // append the y line
    focus.append("line")
        .attr("class", "y_line")
        .style("stroke", "grey")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", width)
        .attr("x2", width);

    // place the value at the intersection
    focus.append("rect")
      .attr("class", "y1bg")
      .attr("width", "55")
      .attr("height", "20")
      .attr("fill", "yellow")
      .style("opacity", 0.7);
    focus.append("text")
      .attr("class", "y1")
      .attr("dx", 8)
      .attr("dy", "-.3em")
      .attr("fill","blue");

    // place the date at the intersection
    focus.append("rect")
      .attr("class", "x1bg")
      .attr("width", "85")
      .attr("height", "20")
      .attr("fill", "yellow")
      .style("opacity", 0.7);
    focus.append("text")
        .attr("class", "x1")
        .attr("dx", 8)
        .attr("dy", "1em")
        .attr("fill","blue");
    
    // append the rectangle to capture mouse
    svg.append("rect")
        .attr("class","tooltip")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);

    function mousemove() {
      var x0 = x.invert(d3.mouse(this)[0]),
          i = bisectDate(data, x0, 1),
          d0 = data[i - 1],
          d1 = data[i],
          d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          // console.log(i);
          // console.log(d0);
          // console.log(d1);

      // focus.select("text.y1")
      //     .attr("transform",
      //           "translate(" + x(d.date) + "," +
      //                          y(d.close) + ")")
      //     .text(d.close);

      focus.select("rect.y1bg")
          .attr("transform",
                "translate(" + (-50) + "," +
                               (y(d.close)-20) + ")")
          .text(d.close);

      focus.select("text.y1")
          .attr("transform",
                "translate(" + (-55) + "," +
                               y(d.close) + ")")
          .text(d.close);

      focus.select("rect.x1bg")
          .attr("transform",
                "translate(" + (x(d.date)-45) + "," +
                               (height-20) + ")")
          .text(formatDate(d.date));

      focus.select("text.x1")
          .attr("transform",
                "translate(" + (x(d.date)-50) + "," +
                               (height-20) + ")")
          .text(formatDate(d.date));

      focus.select(".x_line")
          .attr("transform",
                "translate(" + x(d.date) + "," +
                               y(d.close) + ")")
                     .attr("y2", height - y(d.close));

      focus.select(".y_line")
          .attr("transform",
                "translate(" + width * -1 + "," +
                               y(d.close) + ")")
                     .attr("x2", width + width);
  }

});


function redraw(tickFormat,timeDomain) {
  // console.log(tickFormat);
  // console.log(timeDomain);
  var diff = timeDomain[1] - timeDomain[0];

  if(diff*1.15741e-8 < 1.1){
    tickFormat = "%H:%M";
    xAxis.ticks(6);
  }
  else if(diff*1.15741e-8 >1 && diff*1.15741e-8 < 5){
    tickFormat = "%b %e";
    xAxis.ticks(3);

  }

  x.domain(timeDomain);
  x.range([0, width]);

  xAxis.tickFormat(d3.time.format(tickFormat));

  //x.domain(d3.extent(data, function(d) { return d.updated_time; }));

  var start_time = timeDomain[0].getTime() / 1000;
  var end_time = timeDomain[1].getTime() / 1000;
  var data_url = "/price_data?" + start_time + "?" + end_time;
  // console.log(data_url);

  d3.json("/price_data_all/", function(error, json) {
    if (error) throw error;
    // console.log(json);
    var data = json;

    data = data.map(function(d) {
        // console.log(Date.parse(d.Date));
        return {
            date: new Date(d.date),
            open: +d.open,
            high: +d.high,
            low: +d.low,
            close: +d.close
        };
    });

    // console.log(data);

    data = data.filter(function(d) {
      return d.date >= timeDomain[0]&&d.date <= timeDomain[1];
    });


    var data_length = 100;
    if(data.length > 0){
      ymin =  d3.min(data, function(d) { return d.low; });
      ymax =  d3.max(data, function(d) { return d.high; });

      y.domain([ymin, ymax]);
      // console.log(y.domain()[0],y.domain()[1])   

      data_length = data.length;  

      // bisector only works on sorted data !!!!
      data.sort(function(a, b) { return a.date - b.date; });
    }
    // console.log(data);

   //  var svg = d3.select(".plot").transition();
   //  // Make the changes
   //      svg.select(".sell.line")   // change the line
   //          .duration(300)
   //          .attr("d", sell_line(data));
   //      svg.select(".buy.line")   // change the line
   //          .duration(300)
   //          .attr("d", buy_line(data));
   //      svg.select(".x.axis") // change the x axis
   //          .duration(300)
   //          .call(xAxis);
   //      svg.select(".y.axis") // change the y axis
   //          .duration(300)
   //          .call(yAxis);
   // }); 
  // var svg = d3.select(".plot").transition();

  // specify the selection to g !!!!
  var rects = d3.select(".plot svg g").selectAll("rect.oc").data(data);
  var rect_width = min(0.5 * (width - 2 * margin.left)/ data_length, 10);

  rects.transition()
    .duration(100)
    .attr("class","oc")
    .attr("x", function(d) { return x(d.date)-rect_width/2; })
    .attr("y", function(d) {return y(max(d.open, d.close));})     
    .attr("height", function(d) { return y(min(d.open, d.close))-y(max(d.open, d.close));})
    .attr("width", function(d) { return rect_width; })
    .attr("fill",function(d) { return d.open > d.close ? "red" : "green" ;});

  rects.enter()
   .append("svg:rect")
    .attr("class","oc")
    .attr("x", function(d) { return x(d.date)-rect_width/2; })
    .attr("y", function(d) {return y(max(d.open, d.close));})     
    .attr("height", function(d) { return y(min(d.open, d.close))-y(max(d.open, d.close));})
    .attr("width", function(d) { return rect_width; })
    .attr("fill",function(d) { return d.open > d.close ? "red" : "green" ;});

  rects.exit().remove();

  // console.log(d3.select(".plot").selectAll("rect"));

  var lines = d3.select(".plot svg g").selectAll("line.stem").data(data);
  var linestem_width = min(0.25 * (width - 2 * margin.left)/ data_length, 5);

  lines.transition()
    .duration(100)
    .attr("class", "stem")
    .attr("x1", function(d) { return x(d.date);})
    .attr("x2", function(d) { return x(d.date);})        
    .attr("y1", function(d) { return y(d.high);})
    .attr("y2", function(d) { return y(d.low); })
    .attr("stroke", function(d){ return d.open > d.close ? "red" : "green"; });

  lines.enter()
   .append("svg:line")
    .attr("class", "stem")
    .attr("x1", function(d) { return x(d.date);})
    .attr("x2", function(d) { return x(d.date);})        
    .attr("y1", function(d) { return y(d.high);})
    .attr("y2", function(d) { return y(d.low); })
    .attr("stroke", function(d){ return d.open > d.close ? "red" : "green"; });

  lines.exit().remove();

  // console.log(d3.select(".plot").selectAll("line.stem"));

   var svg = d3.select(".plot").transition();
  // Make the changes
      svg.select(".x.axis") // change the x axis
          // .duration(300)
          .call(xAxis);
      svg.select(".y.axis") // change the y axis
          // .duration(300)
          .call(yAxis);

  //tooltip
  var rect_tooltip = d3.select(".plot svg").selectAll("rect.tooltip").data(data);
      rect_tooltip.on("mousemove", mousemove);

    function mousemove() {
      var x0 = x.invert(d3.mouse(this)[0]),
          i = bisectDate(data, x0, 1),
          d0 = data[i - 1],
          d1 = data[i],
          d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          // console.log(i);
          // console.log(d0);
          // console.log(d1);

      focus.select("rect.y1bg")
          .attr("transform",
                "translate(" + (-50) + "," +
                               (y(d.close)-20) + ")")
          .text(d.close);

      focus.select("text.y1")
          .attr("transform",
                "translate(" + (-55) + "," +
                               y(d.close) + ")")
          .text(d.close);

      focus.select("rect.x1bg")
          .attr("transform",
                "translate(" + (x(d.date)-45) + "," +
                               (height-20) + ")")
          .text(formatDate(d.date));

      focus.select("text.x1")
          .attr("transform",
                "translate(" + (x(d.date)-50) + "," +
                               (height-20) + ")")
          .text(formatDate(d.date));


      focus.select(".x_line")
          .attr("transform",
                "translate(" + x(d.date) + "," +
                               y(d.close) + ")")
                     .attr("y2", height - y(d.close));

      focus.select(".y_line")
          .attr("transform",
                "translate(" + width * -1 + "," +
                               y(d.close) + ")")
                     .attr("x2", width + width);
  }
   // if(x.domain() !== viewport.extent()) updateViewportFromChart();
 });  
}


function timeRange(timeDomainString) {
  this.timeDomainString = timeDomainString;
  // console.log(this.timeDomainString );
  switch (timeDomainString) {
    case "1day":
      tickFormat = "%H:%M";
      timeDomain = [d3.time.day.offset(Date.now(), -1), new Date() ];
      break;
    case "5day":
      tickFormat = "%b %e";
      timeDomain = [d3.time.day.offset(Date.now(), -5),new Date() ];
      // console.log(d3.time.day.offset(getEndDate(), -7));
      // console.log(getEndDate());
      break;
    case "1month":
      tickFormat = "%b %e";
      timeDomain = [d3.time.day.offset(Date.now(), -30), new Date()];
      break;
    case "3month":
      tickFormat = "%b %e";
      timeDomain = [d3.time.month.offset(Date.now(), -3), new Date()];
      break;
    case "6month":
      tickFormat = "%b %e '%y";
      timeDomain = [d3.time.month.offset(Date.now(), -6), new Date() ];
      break;
    case "1year":
      tickFormat = "%b '%y";
      timeDomain = [d3.time.month.offset(Date.now(), -12), new Date() ];
      break;
    default:
      tickFormat = "%H:%M"
  }
  // console.log(format);
  // console.log(timeDomain);
  redraw(tickFormat, timeDomain);
  updateViewportFromChart();
}

function updateViewportFromChart() {

    if ((x.domain()[0] <= navx.domain()[0] ) && (x.domain()[1] >= navx.domain()[1] )) {

        viewport.clear();
    }
    else {

        viewport.extent(x.domain());
    }

    navChart.select('.viewport').call(viewport);
}

function min(a, b){ return a < b ? a : b ; }
             
function max(a, b){ return a > b ? a : b; }   