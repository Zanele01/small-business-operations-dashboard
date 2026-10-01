const express = require("express");

const {
    getSuppliersByBusiness,
    getSupplierById,
    createSupplier
} = require("../controllers/supplierController");

const router = express.Router();

router.get("/:businessId", getSuppliersByBusiness);

router.get(
    "/:businessId/:supplierId",
    getSupplierById
);

router.post("/", createSupplier);

module.exports = router;