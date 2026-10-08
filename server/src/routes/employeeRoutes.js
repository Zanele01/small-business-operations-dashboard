const express = require("express");

const {
    getEmployeesByBusiness,
    getEmployeeById,
    createEmployee
} = require("../controllers/employeeController");

const router = express.Router();

router.get("/:businessId", getEmployeesByBusiness);

router.get(
    "/:businessId/:employeeId",
    getEmployeeById
);

router.post("/", createEmployee);

module.exports = router;