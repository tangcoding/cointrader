var data; 

var margin = {top: 30, right: 30, bottom: 30, left: 50},
    width = 900 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

var tickFormat = "%b %e";
var timeDomain = [d3.time.day.offset(Date.now(),-5), new Date()];

var x = d3.time.scale().domain(timeDomain).range([0, width]);
var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().ticks(6).tickFormat(d3.time.format(tickFormat)).tickPadding(8).scale(x).orient("bottom");

var yAxis = d3.svg.axis().scale(y).orient("left");

var sell_line = d3.svg.line()
    .x(function(d) { return x(d.updated_time); })
    .y(function(d) { return y(d.sell_price); });

var buy_line = d3.svg.line()
    .x(function(d) { return x(d.updated_time); })
    .y(function(d) { return y(d.buy_price); });  

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

var navWidth = width, 
    navHeight = 100- margin.top - margin.bottom;

var navTickFormat = "%b %y";
var navTimeDomain = [d3.time.month.offset(Date.now(),-12), new Date()];

var navx = d3.time.scale().domain(navTimeDomain).range([0, navWidth]);
var navy = d3.scale.linear().range([navHeight, 0]);

var navxAxis = d3.svg.axis().ticks(6).tickFormat(d3.time.format(navTickFormat)).tickPadding(8).scale(navx).orient("bottom");

// var navyAxis = d3.svg.axis().scale(navy).orient("left");

var navArea = d3.svg.area()
    .x(function(d) { return navx(d.updated_time); })
    .y0(navHeight)
    .y1(function(d) { return navy(d.sell_price); });

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


// draw upper chart
var start_time = timeDomain[0].getTime() / 1000;
var end_time = timeDomain[1].getTime() / 1000;
var data_url = "/price_data?" + start_time + "?" + end_time;

// console.log(data_url);
d3.json(data_url, function(error, json) {
  if (error) throw error;
  // console.log(json);
  data = json;
  // console.log(data);

  data.forEach(function(d) {
    var updated_time = new Date(d.updated_time * 1000);
    // console.log(updated_time);
    d.updated_time = updated_time;
    d.sell_price = +d.sell_price;
    d.buy_price = +d.buy_price;
    // console.log(d.updated_time, d.sell_price);
  });


  // data = data.filter(function(d) {
  //   return d.updated_time >= timeDomain[0];
  // });


  //x.domain(d3.extent(data, function(d) { return d.updated_time; }));
  // y.domain(d3.extent(data, function(d) { return d.sell_price; }));

  var ymin1 =  d3.min(data, function(d) { return d.sell_price; });
  var ymin2 =  d3.min(data, function(d) { return d.buy_price; });

  var ymax1 =  d3.max(data, function(d) { return d.sell_price; });
  var ymax2 =  d3.max(data, function(d) { return d.buy_price; });
  // console.log("min:"+ymin1+";"+ymin2);
  // console.log("max:"+ymax1+";"+ymax2);

  var ymin = ymin1 < ymin2 ? ymin1:ymin2;
  var ymax = ymax1 > ymax2 ? ymax1:ymax2;
  // console.log("final:"+ymin+";"+ymax);

  y.domain([ymin1, ymax1]);
  // console.log(y.domain()[0],y.domain()[1])
  
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Price");

  svg.append("path")
      .data([data])
      .attr("class", "buy line")
      .attr("d", buy_line)
      .style("stroke-dasharray", ("6,3"));

  svg.append("path")
      .datum(data)
      .attr("class", "sell line")   
      .attr("d", sell_line);


  svg.append("line")
     .attr("x1",(width-margin.right-30))
     .attr("y1",0)
     .attr("x2",(width-margin.right-10))
     .attr("y2",0)
     .attr("stroke","steelblue");

  svg.append("line")
     .attr("x1",(width-margin.right-30))
     .attr("y1",15)
     .attr("x2",(width-margin.right-10))
     .attr("y2",15)
     .attr("stroke","steelblue")
     .style("stroke-dasharray", ("6,3"));

  svg.append("text")
     .attr("fill","black")
     .text("Sell")
     .attr("transform", "translate(" + (width-margin.right) + ", 5)");

  svg.append("text")
     .attr("fill","black")
     .text("Buy")
     .attr("transform", "translate(" + (width-margin.right) + ", 20)");
});

// draw Nav chart
d3.json("/price_data_all", function(error, json) {
  if (error) throw error;
  var nav_data = json;
  // console.log(nav_data);

  nav_data.forEach(function(d) {
    var updated_time = new Date(d.updated_time * 1000);
    // console.log(updated_time);
    d.updated_time = updated_time;
    d.sell_price = +d.sell_price;
    // d.buy_price = +d.buy_price;
    // console.log(d.updated_time, d.sell_price);
  });

  navy.domain(d3.extent(nav_data, function(d) { return d.sell_price; }));

  navChart.append("g")
      .attr("class", "navx axis")
      .attr("transform", "translate(0," + navHeight + ")")
      .call(navxAxis)

  navChart.append("path")
    .datum(nav_data)
    .attr("class", "area")
    .attr("d", navArea);

});


function redraw(tickFormat,timeDomain) {
  // console.log(tickFormat);
  // console.log(timeDomain);
  var diff = timeDomain[1] - timeDomain[0];
  // console.log(diff*2.77778e-7);

  if(diff*1.15741e-8 < 1.1){
    tickFormat = "%H:%M";
    xAxis.ticks(6);
  }
  else if(diff*1.15741e-8 >1 && diff*1.15741e-8 < 5){
    tickFormat = "%b %e";
    xAxis.ticks(3);

  }

  x.domain(timeDomain);
  xAxis.tickFormat(d3.time.format(tickFormat));

  //x.domain(d3.extent(data, function(d) { return d.updated_time; }));

  var start_time = timeDomain[0].getTime() / 1000;
  var end_time = timeDomain[1].getTime() / 1000;
  var data_url = "/price_data?" + start_time + "?" + end_time;
  // console.log(data_url);

  d3.json(data_url, function(error, json) {
    if (error) throw error;
    console.log(json);
    var data = json;

    data.forEach(function(d) {
      var updated_time = new Date(d.updated_time * 1000);
      // console.log(updated_time);
      d.updated_time = updated_time;
      d.sell_price = +d.sell_price;
      d.buy_price = +d.buy_price;
      // console.log(d.updated_time, d.sell_price);
    });
    

    // data = data.filter(function(d) {
    //   return d.updated_time >= timeDomain[0];}); 

    var ymin1 =  d3.min(data, function(d) { return d.sell_price; });
    var ymin2 =  d3.min(data, function(d) { return d.buy_price; });

    var ymax1 =  d3.max(data, function(d) { return d.sell_price; });
    var ymax2 =  d3.max(data, function(d) { return d.buy_price; });
    // console.log("min:"+ymin1+";"+ymin2);
    // console.log("max:"+ymax1+";"+ymax2);

    var ymin = ymin1 < ymin2 ? ymin1:ymin2;
    var ymax = ymax1 > ymax2 ? ymax1:ymax2;
    // console.log("final:"+ymin+";"+ymax);

    y.domain([ymin1, ymax1]);
    // console.log(y.domain()[0],y.domain()[1])

    var svg = d3.select(".plot").transition();
    // Make the changes
        svg.select(".sell.line")   // change the line
            .duration(300)
            .attr("d", sell_line(data));
        svg.select(".buy.line")   // change the line
            .duration(300)
            .attr("d", buy_line(data));
        svg.select(".x.axis") // change the x axis
            .duration(300)
            .call(xAxis);
        svg.select(".y.axis") // change the y axis
            .duration(300)
            .call(yAxis);
   });
   
   // if(x.domain() !== viewport.extent()) updateViewportFromChart();
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





