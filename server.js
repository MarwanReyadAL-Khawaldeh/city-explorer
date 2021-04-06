'use strict';

const express = require('express'); // npm i express
require('dotenv').config(); // npm i dotenv
// CORS: Cross Origin Resource Sharing -> for giving the permission for who(clients) can touch my server oe send requests to my server
const cors = require('cors'); // npm i cors

const server = express();

const superagent = require('superagent');


const PORT = process.env.PORT || 5000;

server.use(cors());


server.get('/', homeRouteHandler);
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);
server.get('*', erroeHandler);



function homeRouteHandler(request, response) {
    response.status(200).send('you server is alive!!');
}

// https://%20localhost:3000/location?city=seattle
function locationHandler(req, res) {
    console.log(req.query);
    let cityName = req.query.city;
    console.log(cityName);
    let key = process.env.LOCATION_KEY;
    let LocURL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
    superagent.get(LocURL)
        .then(geoData => {
            let gData = geoData.body;
            const locationData = new Location(cityName, gData);
            res.send(locationData);
        })
        .catch(error => {
            res.send(error);
        });
}


function weatherHandler(req, res) {
    console.log(req.query);
    let cityName = req.query.search_query;
    let key = process.env.WEATHER_KEY;
    let weaURL = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;
    superagent.get(weaURL)
        .then(day => {
            let weadata = day.body.data.map(val => {
                return new Weather(val);
            });
            res.send(weadata);
        });
}


function parkHandler(req, res) {
    let data2 = [];
    console.log(req.query);
    let parkeName = req.query.search_query;
    console.log(parkeName);
    let key = process.env.PARK_KEY;
    let parURL = `https://developer.nps.gov/api/v1/parks?q=${parkeName}&api_key=${key}`;
    superagent.get(parURL)
        .then(parkData => {
            let parData = parkData.body.data.map(val => {
                console.log(parkData.body.data);
                return new Park(val);
            });
            res.send(parData);
            console.log(data2);
        });
}

function Location(cityName, geoData) {
    this.search_query = cityName;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}




function Weather(weatherDay) {

    console.log(weatherDay);
    this.description = weatherDay.weather.description;
    this.valid_date = new Date(weatherDay.datetime).toString().slice(0, 15);

}
function Park(parkData) {
    this.name = parkData.fullName;
    this.address = `${parkData.addresses[0].line1},${parkData.addresses[0].city},${parkData.addresses[0].stateCode},${parkData.addresses[0].postalCode}`;
    this.fee = parkData.entranceFees[0].cost;
    this.description = parkData.description;
    this.url = parkData.url;
}


//location:3030/ddddddd
function erroeHandler(req, res) {

    res.status(500).send('Not Found');
}

server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});



