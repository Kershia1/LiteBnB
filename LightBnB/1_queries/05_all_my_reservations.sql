-- SELECT reservations.id, reservations.start_date, properties.title, properties.cost_per_night, AVG(property_reviews.rating) AS average_rating
-- FROM reservations
-- JOIN properties ON property_id = properties.id
-- JOIN property_reviews ON properties.id = property_reviews.property_id
-- WHERE user_id = 1
-- GROUP BY reservations.id, properties.title, properties.cost_per_night
-- ORDER BY start_date ASC
-- LIMIT 10;

-- correct answer

SELECT reservations.id, properties.title, properties.cost_per_night, reservations.start_date, avg(rating) as average_rating
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE reservations.guest_id = 1
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
LIMIT 10;