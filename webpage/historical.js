/*--------------------------------------*
 *--------- Initial page load ----------*
 *--------------------------------------*/

 // When page loads initially
window.addEventListener('load', async () => {
    
    // Hide map
    // const states = Array.from(document.getElementsByClassName('state'));
    // states.map(elem => elem.style.visibility = 'hidden');

    // Dimensions
    const [ margin, width, height ] = initDimensions();

    // Append svg
    const svg = await initSVG(margin, width, height);

    // Create other 
    createAttrSelection();
    createAttrTypeSelection();
    createDateFilter('1928', '2021');

    // Read and initialize plots
    const dataset = readData('data/us-historical-wide.csv');
    await initPlots(dataset, svg, margin, width, height); 

    // Updates
    await updateTimeAndSlider();
    updateAttrTypeSelection();
});

/*--------------------------------------*
 *------------- Updating ---------------*
 *--------------------------------------*/

function updateAttrTypeSelection(initial = true, checked) {
    const attr = document.getElementById('attr-selection').value;
    const defaults = initial ? ['Total', 'CA', 'NM', 'NC', 'NY', 'Light', 'Circle', 'Sphere'] : checked; 

    console.log(defaults);

    const types = getAttrValues();
    const selection = document.getElementById('filter-types');
    
    if (selection !== null) {
        // Remove old items
        const parent = document.getElementById('filter-types');
        Array.from(parent.childNodes).forEach(child => parent.removeChild(child));

        // Add new items
        types.forEach(type => {
            const label = document.createElement('label');
            label.setAttribute('class', 'dropdown-item');
            label.innerText = type + ' ';

            const input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('name', '');
            input.setAttribute('value', type);
            input.setAttribute('id', 'type-' + type);
            input.setAttribute('class', '')

            // Initial checkboxes are checked at first
            if (defaults.includes(type)) {
                input.setAttribute('checked', 'true');
            }

            label.appendChild(input);
            selection.appendChild(label);
        });
    }    
}

async function updateTimeAndSlider() {
    const slider = document.getElementById('filter-dates');

    if (slider !== undefined) {
        // When there is a change on the range slider for dates, text is updated
        slider.noUiSlider.on('update', (values, handle) => {
            // Starting and ending handles for slider
            const dateValues = [
                document.getElementById('date-start'),
                document.getElementById('date-end')
            ];

            // Update text
            dateValues[handle].innerText = formatDate(new Date(+values[handle]));
        });
    }
}

/*--------------------------------------*
 *---------- Page generation -----------*
 *--------------------------------------*/

function createAttrSelection() {
    // Selection
    const select = document.getElementById('attr-selection')

    // Options
    const optionsList = ['All', 'State', 'Shape'];
    optionsList.forEach(option => {
        const options = document.createElement('option');
        options.setAttribute('value', option);
        options.innerText = option;
        select.appendChild(options);
    });
}

function createAttrTypeSelection() {
    const dropdown = document.getElementById('attr-types');

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
    
    updateAttrTypeSelection();

    dropdown.appendChild(form);
}

function createDateFilter(start, end) {
    // Creates slider
    const slider = document.getElementById('filter-dates');

    noUiSlider.create(slider, {
        start: [timestamp(start), timestamp(end)],
        range: {
            min: timestamp('1928'),
            max: timestamp('2021')
        },
        format: wNumb({ decimals: 0 }),         // No decimals
        step: 12 * 4 * 7 * 24 * 60 * 60 * 1000  // Step every year
    });
}

/*--------------------------------------*
 *------ Pre-plot initialization -------*
 *--------------------------------------*/

function getData(fullData) {
    // Subset and options choosen by user
    const subsetChoosen = $('input:checked').map((i, e) => e.value).toArray();
    const [start, end] = getSelectedDates();

    // Subsets data
    const dataSubset = getSubset(fullData, subsetChoosen, start, end);
    // Stacks data
    const stackedData = d3.stack().keys(subsetChoosen)(dataSubset);

    return [subsetChoosen, dataSubset, stackedData];
}

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


async function initSVG(margin, width, height) {
    const svg = d3.select('#historical-viz')
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .attr('id', 'stacked-area-plot')
                .append('g')
                .attr('transform',
                    'translate(' + margin.left + ',' + margin.top + ')');

    return svg; 
}


function initScales(data, width, height, subset) {
    const xScale = d3.scaleTime()
                    .domain(d3.extent(data, (d) => d.date))
                    .range([0, width]);
    const yScale = d3.scaleLinear()
                    .domain([0, d3.max(data, (d) => {
                        const numList = [];
                        subset.forEach(key => numList.push(+d[key]));
                        return numList.reduce((acc, val) => acc + val, 0);
                    })])
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
        .call(yAxis)
}

function initColorScale(subset) {
    return d3.scaleOrdinal()
            .domain(subset)
            .range(d3.schemeSet2);
}

function initLegend(subset, svg, margin, width, color) {
    const squareSize = 20;
    
    // Create colored squares
    svg.selectAll('rect')
      .data(subset)
      .enter()
      .append('rect')
        .attr('x', width + margin.left)
        .attr('y', (d, i) =>  10 + i * (squareSize + 5)) // 100 is first square. 25 is the distance between them
        .attr('width', squareSize)
        .attr('height', squareSize)
        .style('fill', d => color(d));

    // Create labels
    svg.selectAll('label')
        .data(subset)
        .enter()
        .append('text')
            .attr('x', (width + margin.left) + (squareSize * 1.3))
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
    const timeConv = d3.timeParse('%Y');

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
    return subset.filter(d => d.date >= new Date(+startDate) & d.date <= new Date(+endDate));
}

/*--------------------------------------*
 *---- User filtering / tool tips ------*
 *--------------------------------------*/

// function areaHighlight(d) {
//     // Reduce opacity of all groups
//     d3.selectAll('.area').style('opacity', 0.1)
//     console.log('.' + d.srcElement.className['baseVal'].slice(5));

//     // Make selected area stand out more
//     d3.select('.' + d.srcElement.className['baseVal'].slice(5))
//         .style('opacity', 0.7);
// }

// function resetHighlight(d) {
//     d3.selectAll('.area').style('opacity', 0.7)
// }

/*--------------------------------------*
 *-------- Plot init and update --------*
 *--------------------------------------*/

async function initPlots(dataset, svg, margin, width, height, initialArea = undefined) {
    dataset.then(async (data) => {
        // Updates plot and returns area generator (using for transitions)
        let areaGenerator = await updatePlot(data, svg, margin, width, height, initialArea);
        
        // Changing between attributes
        document.getElementById('attr-selection').addEventListener('change', async () => {
            areaGenerator = await initUpdate(data, margin, width, height, areaGenerator);
        });

        // Slider events
        document.getElementById('filter-dates').addEventListener('mouseup', async () => {
            const checked = $('input:checked').map((i, e) => e.value).toArray(); 
            areaGenerator = await initUpdate(data, margin, width, height, areaGenerator, false, checked);
        });

        // Changing between attribute types
        document.getElementById('confirm-attr-types').addEventListener('click', async () => {
            const checked = $('input:checked').map((i, e) => e.value).toArray(); 
            areaGenerator = await initUpdate(data, margin, width, height, areaGenerator, false, checked);
        });
    });
}

function createPlot(svg, stackedData, initialArea, areaGenerator, colorScale) {
    // Create stacked area plot
    svg.selectAll('.areas')
        .data(stackedData)
        .join('path')
        .attr('d', initialArea)
        .transition()
        .duration(1000)
        .attr('d', areaGenerator)
        .attr('class', (d) => 'area ' + d.key)
        .attr('fill', (d) => colorScale(d.key))
        .attr('opacity', 0.7);
        // .on('mouseover', areaHighlight)
        // .on('mouseleave', resetHighlight)   
}

async function initUpdate(data, margin, width, height, initialArea, initial = true, checked) {
    updateAttrTypeSelection(initial, checked);
    await d3.selectAll('#stacked-area-plot').remove();
    const newSvg = await initSVG(margin, width, height);
    return await updatePlot(data, newSvg, margin, width, height, initialArea);
}

async function updatePlot(data, svg, margin, width, height, initialArea) {
    const [subsetChoosen, dataSubset, stackedData] = getData(data);
    
    // Scales 
    const [ xScale, yScale ] = initScales(dataSubset, width, height, subsetChoosen);

    // Add axes
    initAxes(svg, xScale, yScale, margin, width, height);

    // Create color pallete
    const colorScale = initColorScale(subsetChoosen);

    // Initial area
    if (initialArea === undefined) {
        initialArea = d3.area()
                        .x((d) => xScale(d.data.date))
                        .y0((d) => yScale(d[0])) 
                        .y1(height)
                        .curve(d3.curveBasis);
    }

    // Helps create area
    const areaGenerator = d3.area()
                            .x((d) => xScale(d.data.date))
                            .y0((d) => yScale(d[0])) 
                            .y1((d) => yScale(d[1]))
                            .curve(d3.curveBasis);
    
    // Create plot itself
    createPlot(svg, stackedData, initialArea, areaGenerator, colorScale);

    // Create legend
    initLegend(subsetChoosen, svg, margin, width, colorScale);

    return areaGenerator;
}

/*--------------------------------------*
 *-------------- Utilities -------------*
 *--------------------------------------*/

function getAttrValues() {
    const attr = document.getElementById('attr-selection').value;
    
    switch (attr) {
        case 'State': 
            return ['CA', 'NM', 'NC', 'NY', 'MO', 'ID', 'ND', 'AL', 'IN', 'GA', 'KY', 'FL', 'LA',
                    'MD', 'WA', 'ME', 'TX', 'VA', 'WI', 'OK', 'MI', 'OR', 'TN', 'WY', 'AK', 'DE',
                    'MN', 'MS', 'CO', 'PA', 'MA', 'AZ', 'OH', 'NE', 'IL', 'KS', 'WV', 'AR', 'SC',
                    'NJ', 'IA', 'CT', 'UT', 'MT', 'SD', 'NV', 'NH', 'HI', 'VT', 'RI', 'DC']; 
        case 'Shape':
            return ['Light', 'Circle', 'Sphere', 'Disk', 'Fireball', 'Formation', 
                    'Unknown', 'Rectangle', 'Other', 'Oval', 'Cylinder', 'Cigar',
                    'Triangle', 'Cone', 'Chevron', 'Diamond', 'Teardrop', 'Egg',
                    'Changing', 'Flash', 'Cross'];
        default: 
            return ['Total']; 
    }
}

function getSelectedDates() {
    const slider = document.getElementById('filter-dates');
    return slider.noUiSlider.get();
}

function timestamp(str) {
    return new Date(str).getTime();
}

// Format correct date for slider
function formatDate(date) {
    return date.getFullYear();
}