SELECT properties.title as name, properties.number_of_bedrooms as bedrooms, properties.number_of_bathrooms as bathrooms, properties.parking_spaces as parking, avg(property_reviews.rating) as average_rating, properties.cost_per_night as per_night
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  GROUP BY properties.id
  HAVING avg(property_reviews.rating) >= 4
  ORDER BY cost_per_night
  LIMIT 10;
