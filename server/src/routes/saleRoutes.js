const express = require("express");

const {
    getAllSales,
    getSaleById,
    createSale
} = require("../controllers/saleController");

const router = express.Router();

router.get("/:businessId", getAllSales);
router.get("/:businessId/:saleId", getSaleById);
router.post("/", createSale);

module.exports = router;