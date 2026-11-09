const express = require("express");

const {
    getAllExpenses,
    getExpenseById,
    createExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.get("/:businessId", getAllExpenses);

router.get("/:businessId/:expenseId", getExpenseById);

router.post("/", createExpense);

module.exports = router;