const theTimer = document.querySelector(".timer");


let map;

// Game state
let locations = [];
let shuffled = [];
let rectangles = [];
let currentIndex = 0;
let score = 100;
let roundsToPlay = 5;
let currentMistakes = 0;
let wasIncremented = false;

//polyline variables
let polylines = [];
let slope = null;
let pair = {
    first: null,
    second: null
};

//timer variables
let timer = [0, 0, 0]; // minutes, seconds, hundredths
let interval = null;
let timerRunning = false;



// Init map (called by Google Maps API)
function initMap() {


    map = new google.maps.Map(document.getElementById("map"), {

        center: { lat: 34.2410, lng: -118.52752 },
        zoom: 20,

        mapTypeId: "satellite",
        disableDefaultUI: true,
        draggable: false,
        scrollable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        
        


        styles: [
            {
                featureType: "all",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
            ]
    });

    setupLocations();
    setupStartButton();
    setupRetryButton();
}




// 5 locations
function setupLocations() {

    locations = [
        {
            name: "Donald E Bianchi Planetarium",
            topLat:     34.23917,
            bottomLat:  34.23896,
            leftLng:  -118.52860,
            rightLng: -118.52829,
            centerLat: 34.23908,
            centerLng: -118.52847
        },
        {
            name: "Bayramian Hall",
            topLat:     34.24075,
            bottomLat:  34.23986,
            leftLng:  -118.53156,
            rightLng: -118.53012,
            centerLat: 34.24033,
            centerLng: -118.53078

        },
        {
            name: "Eucalyptus Hall",
            topLat:     34.23886,
            bottomLat:  34.23849,
            leftLng:  -118.52891,
            rightLng: -118.52755,
            centerLat: 34.23866,
            centerLng: -118.52824
        },
        {
            name: "Live Oak Hall",
            topLat:     34.23848,
            bottomLat:  34.23811,
            leftLng:  -118.52891,
            rightLng: -118.52755,
            centerLat: 34.23829,
            centerLng: -118.52824
        },
        {
            name: "Matador Tennis Complex",
            topLat:     34.24472,
            bottomLat:  34.24363,
            leftLng:  -118.52465,
            rightLng: -118.52343,
            centerLat: 34.24425,
            centerLng: -118.52402
        }
    ];
}

// Start button
function setupStartButton() {

    document.getElementById("startBtn").addEventListener("click", () => {

        document.getElementById("startBtn").style.display = "none";

        clearRectangles();
        shuffled = shuffle([...locations]);

        currentIndex = 0;
        score = 100;

        updatePrompt();
        enableGame();

        startTimer();
    });
}

// Shuffle array
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// Show current target
function updatePrompt() {
    document.getElementById("status").innerText =
        "Click: " + shuffled[currentIndex].name;
}



function clearRectangles() {

    for (let rect of rectangles) {
        rect.setMap(null);
    }

    rectangles = [];
}



// Enable click gameplay
function enableGame() {

    map.addListener("dblclick", (event) => {

        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        const loc = shuffled[currentIndex];

        const correct =
            lat <= loc.topLat &&
            lat >= loc.bottomLat &&
            lng >= loc.leftLng &&
            lng <= loc.rightLng;

        const centerPoint = new google.maps.LatLng(loc.centerLat, loc.centerLng);
        

        if (!correct) {
            score-=5;
            currentMistakes++;

            slope = Math.atan2((event.latLng.lat()-loc.centerLat),(event.latLng.lng()-loc.centerLng));
            pair.first =  event.latLng.lat()-Math.sin(slope)*0.0003;
            pair.second = event.latLng.lng()-Math.cos(slope)*0.0003;

            
            const line = new google.maps.Polyline({
                path: [event.latLng, new google.maps.LatLng(pair.first,pair.second)],
                geodesic: true,
                strokeColor: "#00BFFF",
                strokeOpacity: 1.0,
                strokeWeight: 3,
                icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                    },
                    offset: "100%"
                }]
        })
        line.setMap(map);
        polylines.push(line);
        }
        else {
            currentMistakes=0;
            currentIndex++;
            wasIncremented=true;
        }

        if (currentMistakes>=4) {
            currentIndex++;
            currentMistakes=0;
            wasIncremented=true;
        }

        if (wasIncremented) {
            // Draw result box
            const rect = new google.maps.Rectangle({
                map: map,
                bounds: {
                    north: loc.topLat,
                    south: loc.bottomLat,
                    west: loc.leftLng,
                    east: loc.rightLng
                },
                fillColor: correct ? "green" : "red",
                strokeColor: correct ? "green" : "red"
            });
            rectangles.push(rect);
            wasIncremented = false;

            //erase polylines
            clearPolylines();
        }
        

        if (currentIndex < roundsToPlay) {
            updatePrompt();
        } else {
            endGame();
        }
    });
}

function clearPolylines() {
  for (let i = 0; i < polylines.length; i++) {
    polylines[i].setMap(null);
  }

  polylines = [];
}

// End game
function endGame() {
    if (score<0) {
        document.getElementById("status").innerText =
        `Game Over! Score: 0 / 100`;
    }
    else {
        document.getElementById("status").innerText =
        `Game Over! Score: ${score} / 100`;
    }
    document.getElementById("retryBtn").style.display = "inline-block";
    showEndImage();
    timerRunning = false;
    clearInterval(interval);
}

function setupRetryButton() {

    document.getElementById("retryBtn").addEventListener("click", () => {

        document.getElementById("retryBtn").style.display = "none";
        
        clearRectangles();
        shuffled = shuffle([...locations]);
        currentIndex = 0;
        score = 100;
        const images = document.querySelectorAll(".img");
        images.forEach(img => {img.style.display = "none";});
        clearInterval(interval);
        interval = null;
        timer = [0,0,0];
        theTimer.textContent = "00:00:00"
        startTimer();

        updatePrompt();
    });
}

function pad(unit) {
    return unit < 10 ? "0" + unit : unit;
}

function runTimer() {
    let current = `${timer[0]}:${timer[1]}:${timer[2]}`;

    theTimer.textContent =
        `${pad(timer[0])}:${pad(timer[1])}:${pad(timer[2])}`;

    timer[2]++;

    if (timer[2] === 100) {
        timer[2] = 0;
        timer[1]++;
    }

    if (timer[1] === 60) {
        timer[1] = 0;
        timer[0]++;
    }
}

function startTimer() {
    console.log("startTimer called");

    if (!timerRunning) {
        timerRunning = true;
        interval = setInterval(runTimer, 10);
    }
}

function showEndImage() {

    const images = document.querySelectorAll(".img");
    let index;
    if (score >=90) {
        index=0;
    }
    else if (score >=80) {
        index=1;
    }
    else if (score >=70) {
        index=2;
    }
    else if (score >=60) {
        index=3;
    }
    else  {
        index=4;
    }

    images[index].style.display = "block";
}
