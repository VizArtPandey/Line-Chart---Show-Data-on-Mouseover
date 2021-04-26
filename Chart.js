async function drawLineChart() {
  //1. Load your Dataset
  const dataset = await d3.csv("./../../Internet Usage.csv");

  //Check the sample values available in the dataset
  //console.table(dataset[0]);

  const yAccessor = (d) => d.InternetUsage;
  const dateParser = d3.timeParse("%d/%m/%Y");
  const xAccessor = (d) => dateParser(d["Bill Date"]);

  // Note : Unlike "natural language" date parsers (including JavaScript's built-in parse),
  // this method is strict: if the specified string does not exactly match the
  // associated format specifier, this method returns null.
  // For example, if the associated format is the full ISO 8601
  // string "%Y-%m-%dT%H:%M:%SZ", then the string "2011-07-01T19:15:28Z"
  // will be parsed correctly, but "2011-07-01T19:15:28", "2011-07-01 19:15:28"
  // and "2011-07-01" will return null, despite being valid 8601 dates.

  //Check the value of xAccessor function now
  //console.log(xAccessor(dataset[0]));

  // 2. Create a chart dimension by defining the size of the Wrapper and Margin

  let dimensions = {
    width: window.innerWidth * 0.8,
    height: 600,
    margin: {
      top: 115,
      right: 20,
      bottom: 40,
      left: 160,
    },
  };
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // 3. Draw Canvas

  const wrapper = d3
    .select("#wrapper")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  //Log our new Wrapper Variable to the console to see what it looks like
  //console.log(wrapper);

  // 4. Create a Bounding Box

  const bounds = wrapper
    .append("g")
    .style(
      "transform",
      `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
    );

  // 5. Define Domain and Range for Scales

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.boundedHeight, 0]);

  // console.log(yScale(100));
  const referenceBandPlacement = yScale(100);
  const referenceBand = bounds
    .append("rect")
    .attr("x", 0)
    .attr("width", dimensions.boundedWidth)
    .attr("y", referenceBandPlacement)
    .attr("height", dimensions.boundedHeight - referenceBandPlacement)
    .attr("fill", "#ffece6");

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.boundedWidth]);

  //6. Convert a datapoints into X and Y value
  // Note : d3.line() method will create a generator that converts
  // a data points into a d string
  // This will transform our datapoints with both the Accessor function
  // and the scale to get the Scaled value in Pixel Space

  const lineGenerator = d3
    .line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)));
  //.curve(d3.curveBasis);

  // 7. Convert X and Y into Path

  const line = bounds
    .append("path")
    .attr("d", lineGenerator(dataset))
    .attr("fill", "none")
    .attr("stroke", "Red")
    .attr("stroke-width", 2);

  //8. Create X axis and Y axis
  // Generate Y Axis

  const yAxisGenerator = d3.axisLeft().scale(yScale);
  const yAxis = bounds.append("g").call(yAxisGenerator);

  const yAxisLabel = yAxis
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -dimensions.boundedHeight / 2)
    .attr("y", -dimensions.margin.left + 110)
    .html("Internet Usage (GB)");

  //9. Generate X Axis
  const xAxisGenerator = d3.axisBottom().scale(xScale);
  const xAxis = bounds
    .append("g")
    .call(xAxisGenerator.tickFormat(d3.timeFormat("%b,%y")))
    .style("transform", `translateY(${dimensions.boundedHeight}px)`);

  //10. Add a Chart Header

  wrapper
    .append("g")
    .style("transform", `translate(${50}px,${15}px)`)
    .append("text")
    .attr("class", "title")
    .attr("x", dimensions.width / 2)
    .attr("y", dimensions.margin.top / 2)
    .attr("text-anchor", "middle")
    .text("My 2020 Internet Usage(in GB)")
    .style("font-size", "36px")
    .style("text-decoration", "underline");

  // 11. Set up interactions

  const listeningRect = bounds
    .append("rect")
    .attr("class", "listening-rect")
    .attr("width", dimensions.boundedWidth)
    .attr("height", dimensions.boundedHeight)
    .on("mousemove", onMouseMove)
    .on("mouseleave", onMouseLeave);

  const xAxisLine = bounds
    .append("g")
    .append("rect")
    .attr("class", "dotted")
    .attr("stroke-width", "1px")
    .attr("width", ".5px")
    .attr("height", dimensions.boundedHeight);

  //.style("transform", `translate(${0}px,${-5}px)`);
  function onMouseMove() {
    const mousePosition = d3.mouse(this);
    const hoveredDate = xScale.invert(mousePosition[0]);

    const getDistanceFromHoveredDate = (d) =>
      Math.abs(xAccessor(d) - hoveredDate);
    const closestIndex = d3.scan(
      dataset,
      (a, b) => getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)
    );
    const closestDataPoint = dataset[closestIndex];
    console.table(closestDataPoint);

    const closestXValue = xAccessor(closestDataPoint);
    const closestYValue = yAccessor(closestDataPoint);

    const formatDate = d3.timeFormat("%B %A %-d, %Y");
    tooltip.select("#date").text(formatDate(closestXValue));

    const formatInternetUsage = (d) => `${d3.format(".1f")(d)} GB`;
    tooltip.select("#internet").html(formatInternetUsage(closestYValue));

    const x = xScale(closestXValue) + dimensions.margin.left;
    const y = yScale(closestYValue) + dimensions.margin.top;

    //Grab the x and y position of our closest point,
    //shift our tooltip, and hide/show our tooltip appropriately

    tooltip.style(
      "transform",
      `translate(` + `calc( -50% + ${x}px),` + `calc(-100% + ${y}px)` + `)`
    );

    tooltip.style("opacity", 1);

    tooltipCircle
      .attr("cx", xScale(closestXValue))
      .attr("cy", yScale(closestYValue))
      .style("opacity", 1);

    xAxisLine.attr("x", xScale(closestXValue));
  }

  function onMouseLeave() {
    tooltip.style("opacity", 0);

    tooltipCircle.style("opacity", 0);
  }

  // Add a circle under our tooltip, right over the “hovered” point
  const tooltip = d3.select("#tooltip");
  const tooltipCircle = bounds
    .append("circle")
    .attr("class", "tooltip-circle")
    .attr("r", 4)
    .attr("stroke", "#af9358")
    .attr("fill", "white")
    .attr("stroke-width", 2)
    .style("opacity", 0);
}

drawLineChart();
