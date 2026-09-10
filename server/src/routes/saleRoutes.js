const express = require("express");

const {
    getAllSales,
    getSaleById,
    createSale
} = require("../controllers/saleController");

const router = express.Router();

router.get("/", getAllSales);

router.get("/:id", getSaleById);

router.post("/", createSale);

module.exports = router;