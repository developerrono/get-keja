import express from "express";
import {
  fetchProperties,
  fetchProperty,
  addProperty,
  removeProperty,
} from "../controllers/propertyController.js";

const router = express.Router();

// Get all properties
router.get("/", fetchProperties);

// Get one property
router.get("/:id", fetchProperty);

// Create property
router.post("/", addProperty);

// Delete property
router.delete("/:id", removeProperty);

export default router;