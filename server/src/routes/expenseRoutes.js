const express = require("express");

const {
    getAllExpenses,
    getExpenseById,
    createExpense
} = require("../controllers/expenseController");

const router = express.Router();

router.get("/", getAllExpenses);

router.get("/:id", getExpenseById);

router.post("/", createExpense);

module.exports = router;