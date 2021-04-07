'use strict';

const express = require('express');

require('dotenv').config();

const cors = require('cors');

const pg = require('pg');

const server = express();

const superagent = require('superagent');


const PORT = process.env.PORT || 5000;

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
    {
        rejectUnauthorized: false
    }
});


server.use(cors());


server.get('/', homeRouteHandler);
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);
server.get('/movies', movieHandler);
server.get('/yelp', yelpHandler);
server.get('*', erroeHandler);



function homeRouteHandler(request, response) {
    response.status(200).send('you server is alive!!');
}



function locationHandler(req, res) {
    console.log(req.query);
    let cityName = req.query.city;
    console.log(cityName);

    let key = process.env.LOCATION_KEY;
    let LocURL = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
    let SQL = `SELECT * FROM locations WHERE search_query = '${cityName}';`;
    client.query(SQL)
        .then(result => {
            if (result.rows.length === 0) {
                superagent.get(LocURL)
                    .then(geoData => {
                        let gData = geoData.body;
                        const locationData = new Location(cityName, gData);
                        let addLocationData = `INSERT INTO locations (search_query,formatted_query ,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
                        let safeValues = [cityName, locationData.formatted_query, locationData.latitude, locationData.longitude];
                        client.query(addLocationData, safeValues)
                            .then(() => {
                                res.send(locationData);
                            });

                    }).catch(() => {

                        res.status(404).send('Page Not Found.');
                    });
            }


            else {
                res.send(result.rows[0]);
            }
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
        }).catch(error => {
            res.send(error);
        });

}


function parkHandler(req, res) {
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
        }).catch(error => {
            res.send(error);
        });
}

function movieHandler(req, res) {
    console.log(req.query);
    let movieName = req.query.search_query;
    console.log(movieName);
    let key = process.env.MOVIE_KEY;
    let movieURL = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${movieName}`;
    superagent.get(movieURL)
        .then(movieData => {
            let movData = movieData.body.results.map(val => {
                console.log(movieData.body.results);
                return new Movie(val);

            });
            res.send(movData);
        })
        .catch(error => {
            res.send(error);
        });
}

function yelpHandler(req, res) {


    let cityName = req.query.search_query;

    let pageNum = req.query.page;

    let key = process.env.YELP_KEY;

    let numPerPage = 5;

    let index = ((pageNum - 1) * numPerPage + 1);

    let yelpURL = `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${numPerPage}&offset=${index}`;
    superagent.get(yelpURL).set('authorization',`Bearer ${key}`)
        .then(yelpData => {

            let yelpbody = yelpData.body.businesses.map(val => {
                return new Yelp(val);
            });

            res.send(yelpbody);

        }).catch(error => {
            res.send(error);
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
    this.forecast = weatherDay.weather.description;
    this.time = new Date(weatherDay.datetime).toString().slice(0, 15);

}
function Park(parkData) {
    this.name = parkData.fullName;
    this.address = `${parkData.addresses[0].line1}, ${parkData.addresses[0].city}, ${parkData.addresses[0].stateCode}, ${parkData.addresses[0].postalCode} `;
    this.fee = parkData.entranceFees[0].cost;
    this.description = parkData.description;
    this.url = parkData.url;
}

function Movie(movData) {

    this.title = movData.original_title;
    this.overview = movData.overview;
    this.average_votes = movData.vote_average;
    this.total_votes = movData.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${movData.poster_path}`;
    this.popularity = movData.popularity;
    this.released_on = movData.release_date;
}


function Yelp(yelpData) {
    this.name = yelpData.name;
    this.image_url = yelpData.image_url;
    this.price = yelpData.price;
    this.rating = yelpData.rating;
    this.url = yelpData.url;
}


//location:3030/ddddddd
function erroeHandler(req, res) {

    res.status(500).send('Not Found');
}



client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT} `);
        });

    });


