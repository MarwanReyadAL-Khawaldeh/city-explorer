'use strict';

const express = require('express'); // npm i express
require('dotenv').config(); // npm i dotenv
// CORS: Cross Origin Resource Sharing -> for giving the permission for who(clients) can touch my server oe send requests to my server
const cors = require('cors'); // npm i cors

const server = express();

const PORT = process.env.PORT || 5000;

server.use(cors());



// request url (browser): localhost:3030/
server.get('/', (req, res) => {
    res.send('you server is working');
});

// request url (browser): localhost:3030/location
server.get('/location', (req, res) => {

    let geoData = require('./Data/location.json');

    let locationData = new Location(geoData);

    res.send(locationData);
});

function Location(locData) {

    // {
    //     "search_query": "seattle",
    //     "formatted_query": "Seattle, WA, USA",
    //     "latitude": "47.606210",
    //     "longitude": "-122.332071"
    //   }
    // console.log(locData);
    this.search_query = 'Lynwood';
    this.formatted_query = locData[0].display_name;
    this.latitude = locData[0].lat;
    this.longitude = locData[0].lon;

}

server.get('/weather', (req, res) => {
    let data1 = [];
    let weatherData = require('./Data/weather.json');
    // console.log(weatherData);
    weatherData.data.map(val => {
        console.log(val);
        data1.push(new Weather(val));
    });

    res.send(data1);
});


function Weather(locData) {

    console.log(locData);
    this.description = locData.weather.description;
    this.valid_date = locData.valid_date;

}


//location:3030/ddddddd
server.get('*', (req, res) => {
    // res.status(404).send('wrong route')
    // {
    //     status: 500,
    //     responseText: "Sorry, something went wrong",
    //     ...
    //   }
    let errObj = {
        status: 500,
        responseText: "Sorry, something went wrong"
    };
    res.status(500).send(errObj);
});

server.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`);
});



