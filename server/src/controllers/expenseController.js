const expenseService = require("../services/expenseService");

const getAllExpenses = (req, res, next) => {
    try {
        const expenses = expenseService.getAllExpenses();

        res.status(200).json(expenses);
    } catch (error) {
        next(error);
    }
};

const getExpenseById = (req, res, next) => {
    try {
        const expense = expenseService.getExpenseById(req.params.id);

        if (!expense) {
            const error = new Error("Expense not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(expense);
    } catch (error) {
        next(error);
    }
};

const createExpense = (req, res, next) => {
    try {
        const expense = expenseService.createExpense(req.body);

        res.status(201).json(expense);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllExpenses,
    getExpenseById,
    createExpense
};