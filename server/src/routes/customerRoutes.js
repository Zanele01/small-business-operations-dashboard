const express = require("express");

const {
    getCustomersByBusiness,
    getCustomerById,
    createCustomer
} = require("../controllers/customerController");

const router = express.Router();

router.get("/:businessId", getCustomersByBusiness);

router.get(
    "/:businessId/:customerId",
    getCustomerById
);

router.post("/", createCustomer);

module.exports = router;