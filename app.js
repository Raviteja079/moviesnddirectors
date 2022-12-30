const conversion = (dbObject) => {
  return [
    {
      movieId: dbObject.movie_id,
      directorId: dbObject.director_id,
      movieName: dbObject.movie_name,
      leadActor: dbObject.lead_actor,
    },
  ];
};
const convert_movies = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const get_directors = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};
const get_director_movies = (dbObject) => {
  return {
    moiveName: dbObject.movie_name,
  };
};

const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "moviesData.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// get movies

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name
    FROM 
     movie
    ORDER BY 
      movie_id;`;

  const moviesResponse = await db.all(getMoviesQuery);
  const new_list = [];
  for (let i of moviesResponse) {
    new_list.push(convert_movies(i));
  }
  response.send(new_list);
});
// post movie

app.post("/movies/", async (request, response) => {
  const movie_details = request.body;
  const { directorId, movieName, leadActor } = movie_details;
  const postNewMovieQuery = `
    INSERT INTO
        movie(director_id, movie_name, lead_actor)
    VALUES
        (
            ${directorId},
            '${movieName}',
            '${leadActor}'
        ); `;
  const dbResponse = await db.run(postNewMovieQuery);
  response.send("Movie Successfully Added");
});

// Get movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
  SELECT 
    *
  FROM 
     movie
  WHERE
      movie_id = ${movieId};`;
  const movieDetails = await db.get(getMovieQuery);
  response.send(conversion(movieDetails));
});

// Update movie
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  console.log(request.body);

  const postMovie = `
    UPDATE 
       movie
    SET 
       director_id = ${directorId},
       movie_name = '${movieName}',
       lead_actor = '${leadActor}'
    WHERE 
       movie_id = ${movieId};`;
  const dbResponse = await db.run(postMovie);
  response.send("Movie Details Updated");
});
//delete
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteQuery = `
    DELETE FROM 
       movie
    WHERE
       movie_id = ${movieId};`;
  const dbResponse = await db.run(deleteQuery);
  response.send("Movie Removed");
});
// get from director
app.get("/directors/", async (request, response) => {
  const getDirectors = `
    SELECT *
    FROM 
      director;`;
  const dbResponse = await db.all(getDirectors);
  const new_list = [];
  for (let i of dbResponse) {
    new_list.push(get_directors(i));
  }
  response.send(new_list);
});
//get movies by a director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getmoviesbyDirector = `
    SELECT movie_name
    FROM 
      movie NATURAL JOIN director
    WHERE
      movie.director_id = ${directorId};`;
  const dbResponse = await db.all(getmoviesbyDirector);
  const new_list = [];
  for (let i of dbResponse) {
    new_list.push(get_director_movies(i));
  }
  response.send(new_list);
});

module.exports = app;
