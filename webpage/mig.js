window.addEventListener("load", async () => {
  // set the dimensions of the canvas
  const margin = { top: 20, right: 20, bottom: 70, left: 40 },
    width = 600 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

  // set the ranges
  // var x = d3.scaleOrdinal().rangeRoundBands([0, width], 0.05);
  var x = d3.scaleBand().rangeRound([0, width]).padding(0.05);

  var y = d3.scaleLinear().range([height, 0]);

  // define the axis
  var xAxis = d3.axisBottom().scale(x);

  var yAxis = d3.axisLeft().scale(y).ticks(10);

  // add the SVG element
  var svg = d3
    .select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  function drawPlot(data, range, selected_state) {
    const low_year = range[0],
      high_year = range[1];
    function isInYearRange(year) {
      return year >= low_year && year <= high_year;
    }

    function isInState(state) {
      return state === selected_state;
    }

    let year_filtered = data.reduce(
      (acc, el) => (isInYearRange(el.year) ? [...acc, ...el.yeardata] : acc),
      []
    );

    let state_filtered = year_filtered.reduce(
      (acc, el) => (isInState(el.state) ? [...acc, ...el.statedata] : acc),
      []
    );

    let final_data = state_filtered.reduce(function (acc, el) {
      if (acc[el.shape]) {
        acc[el.shape] += el.frequency;
      } else {
        acc[el.shape] = el.frequency;
      }
      return acc;
    }, []);

    let final_array = [];
    console.log(final_array);
    for (var shape in final_data) {
      final_array.push({ shape: shape, frequency: final_data[shape] });
      console.log(shape);
    }
    //let final_data2 = final_data.reduce((acc, el) => [...acc, {"shape": el}])

    console.log(final_array);

    data = final_array;

    console.log(data);

    data.forEach(function (d) {
      d.shape = d.shape;
      d.frequency = +d.frequency;
    });

    // scale the range of the data
    x.domain(
      data.map(function (d) {
        return d.shape;
      })
    );
    y.domain([
      0,
      d3.max(data, function (d) {
        return d.frequency;
      }),
    ]);

    // add axis
    svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.55em")
      .attr("transform", "rotate(-90)");

    svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 5)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

    // Add bar chart
    svg
      .selectAll("bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", function (d) {
        return x(d.shape);
      })
      .attr("width", x.bandwidth())
      .attr("y", function (d) {
        return y(d.frequency);
      })
      .attr("height", function (d) {
        return height - y(d.frequency);
      });
  }

  // load the data
  d3.json("data/mig_data.json").then(function (data) {
    console.log(data);

    drawPlot(data, [2000, 2021], "MA");
  });
});