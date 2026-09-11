const Expense = require("../models/expense");
const fileStorage = require("../utils/fileStorage");
const businessService = require("./businessService");

const FILE_NAME = "expenses.json";

class ExpenseService {

    getAllExpenses() {
        return fileStorage.read(FILE_NAME);
    }

    getExpenseById(id) {
        const expenses = fileStorage.read(FILE_NAME);

        return expenses.find(
            (expense) => expense.id === id
        );
    }

    createExpense(expenseData) {

        const requiredFields = [
            "id",
            "businessId",
            "description",
            "amount",
            "category",
            "paymentMethod"
        ];

        for (const field of requiredFields) {
            if (
                expenseData[field] === undefined ||
                expenseData[field] === null ||
                expenseData[field] === ""
            ) {
                const error = new Error(`${field} is required.`);
                error.statusCode = 400;
                throw error;
            }
        }

        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === expenseData.businessId
        );

        if (!businessExists) {
            const error = new Error(
                "Business associated with this expense does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        const expenses = fileStorage.read(FILE_NAME);

        const existingExpense = expenses.find(
            (expense) => expense.id === expenseData.id
        );

        if (existingExpense) {
            const error = new Error("Expense ID already exists.");
            error.statusCode = 409;
            throw error;
        }

        if (
            typeof expenseData.amount !== "number" ||
            expenseData.amount < 0
        ) {
            const error = new Error(
                "Amount must be a number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

        const expense = new Expense(expenseData);

        expenses.push(expense);

        fileStorage.write(FILE_NAME, expenses);

        return expense;
    }
}

module.exports = new ExpenseService();