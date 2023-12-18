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
      console.log(result.rows);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
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
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */


const getAllReservations = function (guest_id, limit = 10) {

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
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  LEFT JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
`;
  //city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  //owner_id
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length} `;
  }

  //minimum_price_per_night
  if (options.minimum_price_per_night) {
    let minimumCost = options.minimum_price_per_night / 100;
    queryParams.push(`${minimumCost}`);
    queryString += `AND cost_per_night >= $${queryParams.length} `;
  }
  //maximum_price_per_night
  if (options.maximum_price_per_night) {
    let maximumCost = options.maximum_price_per_night / 100;
    queryParams.push(`${maximumCost}`);
    queryString += `AND cost_per_night <= $${queryParams.length} `;
  }

  //minimum_rating
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= $${queryParams.length} 
ORDER BY cost_per_night
LIMIT $${queryParams.length};
`;
  } else {
    queryParams.push(limit);
    queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  }

  return pool.query(queryString, queryParams)
    // .query(`SELECT * FROM properties LIMIT $1`, [limit])
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
  const queryParams = [];

  let queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code) 
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING *;
  `;

  queryParams.push(property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code);

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log("Error running query: ", err.message);
    });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
