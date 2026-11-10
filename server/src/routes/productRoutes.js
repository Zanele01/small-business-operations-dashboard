const express = require("express");

const {
    getAllProducts,
    getProductById,
    createProduct
} = require("../controllers/productController");

const router = express.Router();

// Get all products belonging to a business
router.get("/:businessId", getAllProducts);

// Get one product belonging to a business
router.get("/:businessId/:productId", getProductById);

// Create a product
router.post("/", createProduct);

module.exports = router;