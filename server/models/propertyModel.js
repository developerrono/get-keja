import db from "../config/db.js";

export async function getAllProperties() {
  const [rows] = await db.query(
  "SELECT * FROM properties ORDER BY id DESC"
);

  return rows;
}

export async function getPropertyById(id) {
  const [rows] = await db.query(
    "SELECT * FROM properties WHERE id = ?",
    [id]
  );

  return rows[0];
}

export async function createProperty(property) {
  const {
    landlord_id,
    title,
    description,
    image,
    price,
    location,
    type,
    bedrooms,
    bathrooms,
    area,
    available,
    amenities,
  } = property;

  const [result] = await db.query(
    `INSERT INTO properties
    (
      landlord_id,
      title,
      description,
      image,
      price,
      location,
      type,
      bedrooms,
      bathrooms,
      area,
      available,
      amenities
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      landlord_id,
      title,
      description,
      image,
      price,
      location,
      type,
      bedrooms,
      bathrooms,
      area,
      available,
      JSON.stringify(amenities),
    ]
  );

  return result.insertId;
}

export async function deleteProperty(id) {
  await db.query(
    "DELETE FROM properties WHERE id = ?",
    [id]
  );
}