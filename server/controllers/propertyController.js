import {
  getAllProperties,
  getPropertyById,
  createProperty,
  deleteProperty,
} from "../models/propertyModel.js";

export async function fetchProperties(req, res) {
  try {
    const properties = await getAllProperties();

    // Convert amenities back into arrays
    const formatted = properties.map((property) => ({
      ...property,
      amenities: property.amenities
  ? property.amenities.split(",").map(item => item.trim())
  : [],
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch properties",
    });
  }
}

export async function fetchProperty(req, res) {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    property.amenities = property.amenities
  ? property.amenities.split(",").map(item => item.trim())
  : [];

    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch property",
    });
  }
}

export async function addProperty(req, res) {
  try {
    const id = await createProperty(req.body);

    res.status(201).json({
      message: "Property created successfully",
      id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create property",
    });
  }
}

export async function removeProperty(req, res) {
  try {
    await deleteProperty(req.params.id);

    res.json({
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete property",
    });
  }
}