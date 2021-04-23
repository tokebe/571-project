/*--------------------------------------*
 *-------- User interface side ---------*
 *--------------------------------------*/

// Historical button clicked
document.getElementById('historical-btn').addEventListener('click', () => {
    
    // Hide map
    const states = Array.from(document.getElementsByClassName('state'));
    states.map(elem => elem.style.visibility = 'hidden');

    // Dimensions
    const [ margin, width, height ] = initDimensions();

    // Append svg
    const svg = initSVG(margin, width, height);

    // Read and initialize plots
    const dataset = readData('data/us-historical-sightings-shapes.csv');
    initPlots(dataset, svg, margin, width, height); 
});

/*--------------------------------------*
 *------ Pre-plot initialization -------*
 *--------------------------------------*/

function initDimensions() {
    // Dimensions
    const margin = { 
        top: 50, 
        right: 250, 
        bottom: 50, 
        left: 50
    },
    width = 960,
    height = 500;
    
    return [ margin, width, height ];
}


function initSVG(margin, width, height) {
    const svg = d3.select('#historical-viz')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('transform',
                    'translate(' + margin.left + ',' + margin.top + ')');

    return svg; 
}


function initScales(data, width, height, subset) {
    const xScale = d3.scaleTime()
                    .domain(d3.extent(data, (d) => d.date))
                    .nice()
                    .range([0, width]);
    const yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, (d) => {
                        const numList = [];
                        subset.forEach(key => numList.push(+d[key]));
                        return Math.max(...numList) + 5;
                    })])
                    .nice()
                    .range([height, 0]);
    
    return [ xScale, yScale ];
}


function initAxes(svg, xScale, yScale, margin, width, height) {
    const xAxis = d3.axisBottom()
                    .scale(xScale);
                        
    const yAxis = d3.axisLeft()
                    .scale(yScale);
    
    // Axis labels
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + (margin.bottom - 10))
        .text("Dates");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", -40)
        .attr("y", -20)
        .text("Number of Sightings")
        .attr("text-anchor", "start")
    
    // Axes themselves 
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);

    return [ xAxis, yAxis ];
}


function initColorScale(subset, colors) {
    return d3.scaleOrdinal()
            .domain(subset)
            .range(colors)
}

/*--------------------------------------*
 *--- Procesing and reading in data ----*
 *--------------------------------------*/

const readData = (file) => d3.csv(file);

function getSubset(data, keys, startDate, endDate) {
    // Convert to proper time
    const timeConv = d3.timeParse('%Y-%m-%d');

    // Goes through each historical entry
    const subset = data.map(obj => {
        // Default template of result has a Date Time key
        const result = { date: timeConv(obj['Date/Time']) }; 
        // Retrieves a subset of the object in the data array
        keys.forEach((key) => {
            if (obj.hasOwnProperty(key)) {
              result[key] = obj[key];
            }
        });
        return result;
    });
    // Returns filtered by keys and time
    return subset.filter(d => d.date > new Date(startDate) & d.date < new Date(endDate));
}

/*--------------------------------------*
 *---- User filtering / tool tips ------*
 *--------------------------------------*/

function areaHighlight(d) {
    // Reduce opacity of all groups
    d3.selectAll(".area").style("opacity", 0.1)
    // Make selected area stand out more
    d3.select('.' + d.toElement.className['baseVal'].slice(5))
        .style("opacity", 1);
}

function resetHighlight(d) {
    d3.selectAll(".area").style("opacity", 0.7)
}

/*--------------------------------------*
 *-------- Plot initialization ---------*
 *--------------------------------------*/

function initPlots(dataset, svg, margin, width, height) {
    dataset.then((data) => {
        
        // TODO: Retrieve key subset and date filter from user and set color scheme
        const subsetChoosen = ['Light', 'Circle', 'Other']
        const colors = ['red', 'blue', 'green', 'black']
        const dataSubset = getSubset(data, subsetChoosen, '2020-01-01', '2020-12-31');
        
        const stackedData = d3.stack().keys(subsetChoosen)(dataSubset);

        // Scales 
        const [ xScale, yScale ] = initScales(dataSubset, width, height, subsetChoosen);

        // Add axes
        const [ xAxis, yAxis ] = initAxes(svg, xScale, yScale, margin, width, height);

        // Create color pallete
        const colorScale = initColorScale(subsetChoosen, colors);

        // Helps create area
        const areaGenerator = d3.area()
                                .x((d) => xScale(d.data.date))
                                .y0((d) => yScale(d[0])) 
                                .y1((d) => yScale(d[1]))
                                .curve(d3.curveBasis);

        // Create stacked area plot
        svg.selectAll(".areas")
            .data(stackedData)
            .join("path")
            .attr("d", areaGenerator)
            .attr('class', (d) => 'area ' + d.key)
            .attr("fill", (d) => colorScale(d.key))
            .attr('opacity', 0.7)
            .on('mouseover', areaHighlight)
            .on('mouseleave', resetHighlight);            
    });
}