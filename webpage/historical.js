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

    // Create other 
    createAttrSelection();
    createAttrTypeSelection(['None']);
    createDateFilter('2020-01-01', '2020-02-01');
});



/*--------------------------------------*
 *---------- Page generation -----------*
 *--------------------------------------*/

function createAttrSelection() {
    // Selection
    const select = document.createElement('select');
    select.setAttribute('name', 'dropdown')
    document.getElementById('attr-selection').appendChild(select);

    // Options
    const optionsList = ['All', 'State', 'Shape'];
    optionsList.forEach(option => {
        const options = document.createElement('option');
        options.setAttribute('value', option);
        options.innerText = option;
        select.appendChild(options);
    });
}

function createAttrTypeSelection(types) {
    // Dropdown holder
    const dropdown = document.createElement('div');
    dropdown.setAttribute('class', 'dropdown');

    // Button to display dropdown
    const button = document.createElement('button');
    button.setAttribute('class', 'btn dropdown-toggle');
    button.setAttribute('type', 'button');
    button.setAttribute('data-toggle', 'dropdown');
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.innerText = 'Filter by Attribute Type';
    dropdown.appendChild(button);

    // Form hosting items
    const form = document.createElement('form');
    form.setAttribute('class', 'dropdown-menu');
    form.setAttribute('aria-labelledby', 'dropdownMenuButton');
    form.setAttribute('id', 'filter-types');

    // Items
    types.forEach(type => {
        const label = document.createElement('label');
        label.setAttribute('class', 'dropdown-item');
        label.innerText = type + ' ';

        const input = document.createElement('input');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('name', '');
        input.setAttribute('value', type);
        label.appendChild(input);

        form.appendChild(label);
    });
    
    dropdown.appendChild(form);
    document.getElementById('historical-viz').appendChild(dropdown);
}

function createDateFilter(start, end) {
    // Creates slider
    const slider = document.getElementById('filter-dates');

    noUiSlider.create(slider, {
        start: [timestamp('2019'), timestamp('2020')],
        range: {
            min: timestamp('1928-07-12'),
            max: timestamp('2021-03-02')
        },
        format: wNumb({ decimals: 0 }),     // No decimals
        step: 24 * 60 * 60 * 1000           // Step every day
    });

    // When there is a change on the range slider for dates, text is updated
    slider.noUiSlider.on('update', (values, handle) => {
        // Starting and ending handles for slider
        const dateValues = [
            document.getElementById('event-start'),
            document.getElementById('event-end')
        ];

        // Update text
        dateValues[handle].innerText = formatDate(new Date(+values[handle]));
    });
}

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
    const svg = d3.select('#stacked-area-plot')
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
    svg.append('text')
        .attr('text-anchor', 'end')
        .attr('x', width)
        .attr('y', height + (margin.bottom - 10))
        .text('Dates');

    svg.append('text')
        .attr('text-anchor', 'end')
        .attr('x', -40)
        .attr('y', -20)
        .text('Number of Sightings')
        .attr('text-anchor', 'start')
    
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


function initLegend(subset, svg, margin, width, color) {
    const squareSize = 20;
    
    // Create colored squares
    svg.selectAll('rect')
      .data(subset)
      .enter()
      .append('rect')
        .attr('x', width - margin.left)
        .attr('y', (d, i) =>  10 + i * (squareSize + 5)) // 100 is first square. 25 is the distance between them
        .attr('width', squareSize)
        .attr('height', squareSize)
        .style('fill', d => color(d));

    // Create labels
    svg.selectAll('label')
        .data(subset)
        .enter()
        .append('text')
            .attr('x', (width - margin.left) + (squareSize * 1.3))
            .attr('y', (d, i) => 10 + i * (squareSize + 5) + (squareSize / 1.8)) // 100 is first square. 25 is the distance between them
            .style('fill', d => color(d))
            .text(function(d){ return d})
            .attr('text-anchor', 'left')
            .style('alignment-baseline', 'middle')
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
    d3.selectAll('.area').style('opacity', 0.1)
    // Make selected area stand out more
    d3.select('.' + d.toElement.className['baseVal'].slice(5))
        .style('opacity', 0.7);
}

function resetHighlight(d) {
    d3.selectAll('.area').style('opacity', 0.7)
}

/*--------------------------------------*
 *-------- Plot initialization ---------*
 *--------------------------------------*/

function initPlots(dataset, svg, margin, width, height) {
    dataset.then((data) => {
        
        // TODO: Retrieve key subset and date filter from user and set color scheme
        const subsetChoosen = ['Light', 'Circle', 'Other']
        const colors = ['red', 'blue', 'green', 'black']
        const dataSubset = getSubset(data, subsetChoosen, '2020-01-01', '2020-02-01');
        
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
        svg.selectAll('.areas')
            .data(stackedData)
            .join('path')
            .attr('d', areaGenerator)
            .attr('class', (d) => 'area ' + d.key)
            .attr('fill', (d) => colorScale(d.key))
            .attr('opacity', 0.7)
            .on('mouseover', areaHighlight)
            .on('mouseleave', resetHighlight);   
            
        // Create legend
        initLegend(subsetChoosen, svg, margin, width, colorScale);
    });
}

/*--------------------------------------*
 *-------------- Utilities -------------*
 *--------------------------------------*/

function timestamp(str) {
    return new Date(str).getTime();
}

// Retrieves correct suffix of a day in a month
function correctSuffix(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
        case 1:
            return "st"; // Ex: 1 => 1st
        case 2:
            return "nd"; // Ex: 22 => 2nd
        case 3:
            return "rd"; // Ex: 3 => 3rd
        default:
            return "th"; // Ex: 25 => 25th, 30 => 30th
    }
}

// Format correct date for slider
function formatDate(date) {
    const weekdays = [
        "Sunday", "Monday", "Tuesday",
        "Wednesday", "Thursday", "Friday",
        "Saturday"
    ];

    const months = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    return weekdays[date.getDay()] + ", " +
        date.getDate() + correctSuffix(date.getDate()) + " " +
        months[date.getMonth()] + " " +
        date.getFullYear();
}