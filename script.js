

let barsDict = {};
let datesDict = {};
let distancesDict = {};
let durationsDict = {};

const inputYear = document.getElementById('year');
const inputMonth = document.getElementById('month');
const inputDate = document.getElementById('date');
const inputDistance = document.getElementById('distance');
const inputDuration = document.getElementById('duration');


const screenshotButton = document.getElementById('screenshot-btn');

const submitButton = document.getElementById('submit-button');

const monthDatesText = document.getElementById('month-dates-text');
const monthBtnPrev = document.getElementById('month-button-prev');
const monthBtnNext = document.getElementById('month-button-next');

const sliderHandle = document.getElementById('slider-handle');
const sliderContainer = document.getElementById('slider-container');
const sliderDateTexts = document.querySelectorAll('.slider-date-text');

const currentDateText = document.getElementById('current-date-text');

const currentDateDistText = document.getElementById('current-date-dist-text');

const barChart = document.getElementById('bar-chart');
const currentDateLine = document.getElementById('current-date-line');

const totalDistText = document.getElementById('total-dist');
const runCountText = document.getElementById('run-counts');
const totalMinutesText = document.getElementById('total-minutes');
const totalCalsText = document.getElementById('total-cals');
const totalStepsText = document.getElementById('total-steps');
const avgPaceText = document.getElementById('avg-pace');


let daysInMonth;
let currentDate = 1;
let currentMonth = 1;
let currentYear = 2024;

let isDragging = false;
let offsetX = 0;


let highlightBarKey = -1;

let maxDistScale = 6;

let scalesTexts = [];


document.addEventListener('DOMContentLoaded', function () {
    populateYearOptions();
    populateMonthOptions();
    populateDateOptions();

    inputYear.addEventListener('change', function () { populateDateOptions(); updateYearMonthDate(); });
    inputMonth.addEventListener('change', function () { populateDateOptions(); updateYearMonthDate(); });
    inputDate.addEventListener('change', function () {
        currentDate = parseInt(inputDate.value);
        updateCurrentDateText();
        updateDateSlider();
        updateCurrentDateDist();
    });
    document.getElementById('running-form').addEventListener('submit', handleFormSubmit);

    screenshotButton.addEventListener('click', function (event) {
        event.preventDefault();
        html2canvas(document.querySelector('.phone-screen'), { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'screenshot.png';
            link.href = canvas.toDataURL();
            link.click();
        }).catch(err => {
            console.error('Screenshot capture failed:', err);
        });
    });

    document.getElementById("randomize-btn").addEventListener('click', function (event) {
        event.preventDefault();
        createRandomizeData();
    });

    monthBtnPrev.addEventListener('click', reduceMonthValue);
    monthBtnNext.addEventListener('click', increaseMonthValue);


    updateYearMonthDate();
    updateCurrentDateText();
    updateCurrentDateDist();

    setScreenSize('430x932');

    let left = parseFloat(sliderHandle.style.left);
    console.log(`slider handle left: ${left}`)
    let halfWidth = parseFloat(sliderHandle.style.width) * 0.5;

    moveSliderDateTexts(left + halfWidth);

    scalesTexts.push(document.getElementById("scale-0"))
    scalesTexts.push(document.getElementById("scale-1"))
    scalesTexts.push(document.getElementById("scale-2"))
    scalesTexts.push(document.getElementById("scale-3"))
    scalesTexts.push(document.getElementById("scale-4"))



});

function reduceMonthValue() {

    console.log("clicked negative")
    if (inputMonth.value > 1) {
        inputMonth.value = parseInt(inputMonth.value) - 1;
        inputMonth.dispatchEvent(new Event('change'));
    }

}

function increaseMonthValue() {

    console.log("clicked positive")
    if (inputMonth.value < 12) {
        inputMonth.value = parseInt(inputMonth.value) + 1;
        inputMonth.dispatchEvent(new Event('change'));
    }

}

function populateYearOptions() {

    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        inputYear.appendChild(option);
    }
    inputYear.value = currentYear;
}

function populateMonthOptions() {

    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        inputMonth.appendChild(option);
    }
    inputMonth.value = new Date().getMonth() + 1;
}

function populateDateOptions() {

    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const daysInMonth = new Date(year, month, 0).getDate();

    inputDate.innerHTML = '';
    for (let date = 1; date <= daysInMonth; date++) {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        inputDate.appendChild(option);
    }
    if (currentDate > daysInMonth) {
        currentDate = daysInMonth
    }

    inputDate.value = currentDate;
}

function handleFormSubmit(event) {
    event.preventDefault();

    const duration = parseFloat(inputDuration.value);

    const distance = parseFloat(inputDistance.value);

    addRunDataSingle(currentDate, distance, duration);
}


function updateYearMonthDate() {
    currentYear = parseInt(inputYear.value);
    currentMonth = parseInt(inputMonth.value);
    currentDate = parseInt(inputDate.value);

    console.log(`current date: ${inputDate.value}`);

    const startDate = `${currentYear}年${currentMonth}月1日`;

    daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const endDate = `${currentYear}年${currentMonth}月${daysInMonth}日`;

    monthDatesText.textContent = `${startDate} 至 ${endDate}`;

    for (let i = 0; i < sliderDateTexts.length; i++) {

        text = sliderDateTexts[i];
        let t = i / (sliderDateTexts.length - 1);
        const day = Math.floor((daysInMonth - 1) * t) + 1;
        text.textContent = `${currentMonth}月${day}日`;

    }

    currentDateText.textContent = `${currentMonth}月${currentDate}日`;


}


// document.getElementById('set-screen-size').addEventListener('click', function () {
//     const screenSize = document.getElementById('screen-size').value;
//     setScreenSize(screenSize);
// });

function setScreenSize(size) {
    const [width, height] = size.split('x').map(Number);
    const phoneScreen = document.getElementById('phone-screen');
    phoneScreen.style.width = `${width}px`;
    phoneScreen.style.height = `${height}px`;
}



// // Set default screen size
// document.addEventListener('DOMContentLoaded', function () {
//     setScreenSize('430x932'); // Default to iPhone 15 pro max screen size
// });


function addRunDataSingle(date, distance, duration) {

    if (distance > maxDistScale) {
        maxDistScale = Math.floor(distance + 1);
        updateBarHeightsScale();
        updateMaxScaleTexts();
    }
    // Calculate height of the bar as a percentage of the parent's height
    const barHeight = (distance / maxDistScale) * 100; // Adjust as needed for scaling
    // Calculate left position of the bar as a percentage of the parent's width

    const barLeft = (date / daysInMonth) * 100;

    let bar;


    distancesDict[date] = distance;
    durationsDict[date] = duration;

    if (date in barsDict) {

        bar = barsDict[date]
        bar.style.height = `${barHeight}%`;
        bar.style.left = `${barLeft}%`;
    } else {
        bar = document.createElement('div');
        bar.className = 'bar highlight';
        barsDict[date] = bar;
        bar.style.height = `${barHeight}%`;
        bar.style.left = `${barLeft}%`;
        barChart.appendChild(bar);
        highlightBarKey = date;
    }

    updateCurrentDateDist();
    updateRunsMetrics();
}




function updateBarHeightsScale() {

    for (key in distancesDict) {
        const dist = distancesDict[key];
        const percentage = dist / maxDistScale;

        barsDict[key].style.height = `${percentage * 100}%`
    }

}


sliderHandle.addEventListener('mousedown', function (e) {
    isDragging = true;
    offsetX = e.clientX - sliderHandle.getBoundingClientRect().left;
});

document.addEventListener('mousemove', function (e) {
    if (isDragging) {
        let newLeft = e.clientX - offsetX - sliderContainer.getBoundingClientRect().left;
        const rightEdge = sliderContainer.offsetWidth - sliderHandle.offsetWidth;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > rightEdge) newLeft = rightEdge;

        sliderHandle.style.left = newLeft + 'px';
        let halfWidth = parseFloat(sliderHandle.style.width) * 0.5;

        moveSliderDateTexts(newLeft + halfWidth);
        let t = newLeft / rightEdge;
        currentDate = Math.floor(t * (daysInMonth - 1)) + 1;
        updateCurrentDateText();
        updateDateInput();
        updateCurrentDateDist();
    }
});

document.addEventListener('mouseup', function () {
    isDragging = false;
});

sliderHandle.addEventListener('touchstart', function (e) {
    isDragging = true;
    offsetX = e.touches[0].clientX - sliderHandle.getBoundingClientRect().left;
});

document.addEventListener('touchmove', function (e) {
    if (isDragging) {
        let newLeft = e.touches[0].clientX - offsetX - sliderContainer.getBoundingClientRect().left;
        const rightEdge = sliderContainer.offsetWidth - sliderHandle.offsetWidth;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > rightEdge) newLeft = rightEdge;

        sliderHandle.style.left = newLeft + 'px';
        let halfWidth = parseFloat(sliderHandle.style.width) * 0.5;

        moveSliderDateTexts(newLeft + halfWidth);
        let t = newLeft / rightEdge;
        currentDate = Math.floor(t * (daysInMonth - 1)) + 1;
        updateCurrentDateText();
        updateDateInput();
        updateCurrentDateDist();
    }
});

document.addEventListener('touchend', function () {
    isDragging = false;
});



function moveSliderDateTexts(handleLeft) {
    const parent = document.querySelector('.slider-date-text').parentElement;
    const containerWidth = parent.style.width;
    const maxDistance = 60; // Maximum distance to affect the text
    const maxMoveUp = 15; // Maximum move up value in px

    let baseLeft = 0;

    for (let i = 0; i < sliderDateTexts.length; i++) {
        const textRect = sliderDateTexts[i].getBoundingClientRect();
        const width = textRect.width;

        const textHalfWidth = width / 2;

        const distance = Math.abs(baseLeft + textHalfWidth - handleLeft);

        if (distance < maxDistance) {
            const moveUp = maxMoveUp * (1 - distance / maxDistance);
            sliderDateTexts[i].style.top = `${- moveUp}px`; // Original top is 12px
        } else {
            sliderDateTexts[i].style.top = '0px'; // Reset to original position
        }

        baseLeft += width;

        //console.log(`text ${i} left: ${baseLeft}, text ${i} width: ${width}, handle left: ${handleLeft}`)
    }


    // sliderDateTexts.forEach(text => {
    //     const textRect = text.getBoundingClientRect();
    //     const textLeft = textRect.left - parentRect.left;
    //     const textHalfWidth = textRect.width / 2;
    //     const distance = Math.abs(textLeft + textHalfWidth - handleLeft);
    //     const maxDistance = 60; // Maximum distance to affect the text
    //     const maxMoveUp = 15; // Maximum move up value in px

    //     //console.log(`handle left: ${handleLeft},text left: ${textLeft}`);

    //     if (distance < maxDistance) {
    //         const moveUp = maxMoveUp * (1 - distance / maxDistance);
    //         text.style.top = `${- moveUp}px`; // Original top is 12px
    //     } else {
    //         text.style.top = '0px'; // Reset to original position


    //     }

    //     //console.log(`handle left: ${handleLeft}, distance: ${distance}, text top: ${text.style.top}`)


    // });
}


function updateCurrentDateText() {
    currentDateText.textContent = `${currentMonth}月${currentDate}日`;
    const percentage = (currentDate / daysInMonth) * 100;
    currentDateLine.style.left = `calc(${percentage}% + 2px`;


    if (highlightBarKey in barsDict && highlightBarKey != currentDate) {
        const bar = barsDict[highlightBarKey];
        bar.className = 'bar';
        console.log(`Class name set to 'bar' for key: ${highlightBarKey}`)
        highlightBarKey = -1;
        submitButton.textContent = "添加数据"
    }

    if (currentDate in barsDict) {
        const bar = barsDict[currentDate];

        bar.className = 'bar highlight';
        highlightBarKey = currentDate;

        inputDistance.value = distancesDict[currentDate];
        inputDuration.value = durationsDict[currentDate];

        submitButton.textContent = "修改数据"

        console.log(`Class name set to 'bar highlight' for key: ${currentDate}`)
    }

    //currentDateLine.style.left=`${percentage}%`;
}

function updateCurrentDateDist() {
    if (currentDate in distancesDict) {

        let number = distancesDict[currentDate];
        number = number.toFixed(2);
        currentDateDistText.textContent = number;
    } else {
        currentDateDistText.textContent = "--";
    }
}

function updateDateInput() {
    inputDate.value = currentDate;
}

function updateDateSlider() {
    const rightEdge = sliderContainer.offsetWidth - sliderHandle.offsetWidth;

    let t = (currentDate - 1) / (daysInMonth - 1);

    let newLeft = rightEdge * t;

    sliderHandle.style.left = newLeft + 'px';
    let halfWidth = parseFloat(sliderHandle.style.width) * 0.5;

    moveSliderDateTexts(newLeft + halfWidth);
}


function updateRunsMetrics() {

    let sumDist = 0;
    let runCount = 0;
    let sumMinutes = 0;
    for (let key in distancesDict) {
        sumDist += distancesDict[key];
        runCount += 1;

        if (key in durationsDict) {
            sumMinutes += durationsDict[key];
        }
    }

    totalDistText.textContent = sumDist.toFixed(2);
    console.log(`sum minutes: ${sumMinutes}`);
    totalMinutesText.textContent = sumMinutes.toFixed(2);
    runCountText.textContent = runCount;

    const bodyHeight = parseFloat(document.getElementById('body-height').value);
    const bodyWeight = parseFloat(document.getElementById('body-weights').value);;


    const runStrideLength = bodyHeight * 0.42;; // 跑步步长（米）
    const walkStrideLength = bodyHeight * 0.4; // 走路步长（米）
    const runPercentage = 0.7; // 跑步的百分比
    const walkPercentage = 0.3; // 走路的百分比
    const runCaloriesPerKm = bodyWeight * 1.036; // 每公里跑步消耗的卡路里
    const walkCaloriesPerKm = bodyWeight * 0.75; // 每公里走路消耗的卡路里

    // 计算跑步和走路的距离
    const runDistance = sumDist * runPercentage * 1000; // 跑步距离（米）
    const walkDistance = sumDist * walkPercentage * 1000; // 走路距离（米）



    // 计算跑步和走路的步数
    const runSteps = runDistance / runStrideLength;
    const walkSteps = walkDistance / walkStrideLength;
    // 总步数
    const totalSteps = runSteps + walkSteps;


    // 计算跑步和走路的时间（分钟）
    const runMinutes = sumMinutes * runPercentage;
    const walkMinutes = sumMinutes * walkPercentage;


    // 平均配速（每公里分钟数）
    const averagePace = sumMinutes / sumDist;


    const totalRunCalories = (runDistance / 1000) * runCaloriesPerKm;
    const totalWalkCalories = (walkDistance / 1000) * walkCaloriesPerKm;
    const totalCalories = totalRunCalories + totalWalkCalories;


    // 转换平均配速为分钟和秒钟
    const paceMinutes = Math.floor(averagePace);
    const paceSeconds = Math.round((averagePace - paceMinutes) * 60);

    avgPaceText.textContent = `${paceMinutes}'${paceSeconds}''`;
    totalStepsText.textContent = Math.round(totalSteps).toLocaleString();
    totalCalsText.textContent = Math.round(totalCalories).toLocaleString()
}


function updateMaxScaleTexts() {

    const count = scalesTexts.length;

    let increment = maxDistScale / (count - 1);

    for (let i = 0; i < scalesTexts.length; i++) {

        const scale = Math.round(i * increment);

        scalesTexts[i].textContent = scale;
    }

}

function createRandomizeData() {


    clearRunData();
    let count = getRandomInt(8, 13);

    dates = getRandomNonRepeatingNumbers(1, daysInMonth, count);

    console.log(dates);

    let maxDist=0;

    dates.forEach(date => {

        const distance = Math.floor(getRandomFloat(4.0, 6.0)*100)/100;
        const pace=Math.floor(getRandomFloat(7.5,8.8)*100)/100;
        const duration = Math.floor(distance*pace*100)/100;

        if(distance>maxDist){
            maxDist=distance;
        }

        distancesDict[date] = distance;
        durationsDict[date] = duration;

    });

    if (maxDist > maxDistScale) {
        maxDistScale = Math.floor(maxDist + 1);
        
    }


    dates.forEach(date => {

        const bar = document.createElement('div');


        if (currentDate == date) {
            bar.className = 'bar highlight';
            highlightBarKey = date;

        } else {
            bar.className = 'bar';
        }

        const distance=distancesDict[date];

        const barHeight = (distance / maxDistScale) * 100;
        const barLeft = (date / daysInMonth) * 100;

        barsDict[date] = bar;
        bar.style.height = `${barHeight}%`;
        bar.style.left = `${barLeft}%`;
        barChart.appendChild(bar);
    
    });

    updateMaxScaleTexts();
    updateCurrentDateDist();
    updateCurrentDateText();
    updateRunsMetrics();

}


function clearRunData() {


    maxDistScale = 6;
    updateMaxScaleTexts();

    distancesDict = {};
    durationsDict = {};

    for (key in barsDict) {
        barsDict[key].remove();
        delete barsDict[key];
    }



    updateCurrentDateDist();
    updateRunsMetrics();
}

function getRandomInt(min, max) {
    // Ensure min and max are included
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
    // Ensure min and max are included
    return Math.random() * (max - min + 1) + min;
}



function getRandomNonRepeatingNumbers(min, max, count) {
    // Generate an array containing all numbers within the specified range
    const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);

    // Shuffle the array using the Fisher-Yates algorithm
    for (let i = range.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [range[i], range[j]] = [range[j], range[i]];
    }

    // Return the first 'count' numbers from the shuffled array
    return range.slice(0, count);
}

