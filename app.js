const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const request = require('request');

mongoose
  .connect(
    'mongodb+srv://rkravikr9102:ravi9102@cluster0.ks6f15g.mongodb.net/',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'movie',
    }
  )
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err.message);
  });

const favouriteMovie = require('./models/favouriteModel');

app.use(bodyParser.json());

app.use(
  cors({
    origin: '*',
  })
);

// api for homepage movies
app.get('/movies', async (req, res) => {
  var url = 'https://www.omdbapi.com/?s=fast&furious&apikey=7abae3ab';
  request(url, async function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data = JSON.parse(body);
      // Define a function that checks if a movie is a favorite
      const checkFavourite = async (id) => {
        const isFavorite = await favouriteMovie.exists({ movieId: id });
        return isFavorite ? true : false;
      };
      // Use Promise.all to asynchronously check favorites for all movies
      if (data.Search) {
        var newData = await Promise.all(
          data.Search?.map(async (movie) => ({
            ...movie,
            favourite: await checkFavourite(movie.imdbID),
          }))
        );
        res.send({ Search: newData });
      } else {
        res.send(data);
      }
    } else {
      res.send({ message: error });
    }
  });
});

// api for search query
app.get('/api/movies/search', async (req, res) => {
  var query = req.query.query;
  console.log(query, 'query');
  var url = 'https://www.omdbapi.com/?s=' + query + '&apikey=7abae3ab';
  request(url, async function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(response, body);
      var data = JSON.parse(body);
      // Define a function that checks if a movie is a favorite
      const checkFavourite = async (id) => {
        const isFavorite = await favouriteMovie.exists({ movieId: id });
        return isFavorite ? true : false;
      };

      // Use Promise.all to asynchronously check favorites for all movies
      if (data.Search) {
        var newData = await Promise.all(
          data.Search?.map(async (movie) => ({
            ...movie,
            favourite: await checkFavourite(movie.imdbID),
          }))
        );
        res.send({ Search: newData });
      } else {
        res.send(data);
      }
    } else {
      res.send({ message: error });
    }
  });
});

// api for get avourite movies
app.get('/api/movies/favourite', async (req, res) => {
  await favouriteMovie
    .find()
    .then((data) => {
      res.send(data);
    })
    .catch((error) => {
      res.send({
        msg: error.message,
      });
    });
});

// api for add from favourite
app.post('/api/movies/favourite', async (req, res) => {
  const { movieId } = req.body;
  const favourite = new favouriteMovie({
    movieId: movieId,
  });
  console.log('checkmovie id', movieId);
  await favourite
    .save()
    .then((resData) => {
      res.send({
        msg: 'Added to favourite successfully',
        data: resData,
      });
    })
    .catch((error) => {
      res.send({
        msg: error.message,
      });
    });
});

// api for remove from favourite
app.delete('/api/movies/favourite/:id', async (req, res) => {
  const id = req.params.id;
  console.log('removeid', id);
  await favouriteMovie
    .findOneAndRemove({ movieId: id })
    .then((resData) => {
      res.send({
        msg: 'Removed favourite movie successfully',
        data: resData,
      });
    })
    .catch((error) => {
      res.send({
        msg: error.message,
      });
    });
});

const port = 8000;
app.listen(port, function () {
  console.log('backend listen on' + port);
});
