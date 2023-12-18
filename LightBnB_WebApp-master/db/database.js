const properties = require("./json/properties.json");
const users = require("./json/users.json");

//connecting postgres to the database
const { Pool } = require('pg');

//connection with more specific routing and security
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {

  return pool 
  .query(`SELECT * FROM users WHERE email = $1`, [email])
  .then((result) => {
    console.log(result.rows);
    return result.rows[0];// only 1st user with matching email found
  })
  .catch((err) => {
    console.log("Error running query: ", err.message);
  });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {

  return pool 
  .query(`SELECT * FROM users WHERE id = $1`, [id])
  .then((result) => {
    console.log(result.rows)
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
  // return Promise.resolve(users[id]);
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  return pool 
  .query(`INSERT INTO users (name, email, password) 
    VALUES ($1,$2,$3) 
    RETURNING *;`, [user.name, user.email, user.password]) //THIS IS A CLAUSE TO RETURN EXECUTED DATA 
  .then((results) => {
    return results.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  })
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */


const getAllReservations = function(guest_id, limit = 10) {

  return pool
  .query(`SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
  FROM ( SELECT DISTINCT ON (property_id) * FROM reservations
    WHERE guest_id = $1
    ORDER BY property_id, guest_id
  ) AS reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY properties.title
  LIMIT $2;`, [guest_id, limit])
.then((results) => {
    console.log(results.rows);
    return results.rows.slice(0, 10);
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {

  // SELECT properties.id, title, cost_per_night, avg(property_reviews.rating) as average_rating
  // FROM properties
  // LEFT JOIN property_reviews ON properties.id = property_id
  // WHERE city LIKE '%ancouv%'
  // GROUP BY properties.id
  // HAVING avg(property_reviews.rating) >= 4
  // ORDER BY cost_per_night
  // LIMIT 10;

  return pool 
  .query(`SELECT * FROM properties LIMIT $1`, [limit])
  .then((result) => {
    console.log(result.rows);
    return result.rows;
  })
  .catch((err) => {
    console.log("Error running query: ", err.message);
  });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
