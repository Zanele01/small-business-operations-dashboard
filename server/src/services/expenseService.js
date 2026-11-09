const Expense = require("../models/expense");
const fileStorage = require("../utils/fileStorage");
const businessService = require("./businessService");

const FILE_NAME = "expenses.json";

class ExpenseService {

    getAllExpenses() {
        return fileStorage.read(FILE_NAME);
    }

    getExpensesByBusiness(businessId) {
        const expenses = this.getAllExpenses();

        return expenses.filter(
            (expense) => expense.businessId === businessId
        );
    }

    getExpenseById(businessId, expenseId) {
        const expenses = this.getAllExpenses();

        return expenses.find(
            (expense) =>
                expense.businessId === businessId &&
                expense.id === expenseId
        );
    }

    createExpense(expenseData) {

        // Validate the request body
        if (
            !expenseData ||
            typeof expenseData !== "object" ||
            Array.isArray(expenseData)
        ) {
            const error = new Error(
                "Expense data must be an object."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate required fields
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
                const error = new Error(
                    `${field} is required.`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        // Validate required string fields
        const stringFields = [
            "id",
            "businessId",
            "description",
            "category",
            "paymentMethod"
        ];

        for (const field of stringFields) {
            if (
                typeof expenseData[field] !== "string" ||
                !expenseData[field].trim()
            ) {
                const error = new Error(
                    `${field} must be a non-empty string.`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        // Validate amount
        if (
            typeof expenseData.amount !== "number" ||
            !Number.isFinite(expenseData.amount) ||
            expenseData.amount < 0
        ) {
            const error = new Error(
                "Amount must be a finite number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Normalise string values
        const normalizedData = {
            ...expenseData,
            id: expenseData.id.trim(),
            businessId: expenseData.businessId.trim(),
            description: expenseData.description.trim(),
            category: expenseData.category.trim(),
            paymentMethod: expenseData.paymentMethod.trim()
        };

        // Verify that the associated business exists
        const businesses = businessService.getAllBusinesses();

        const business = businesses.find(
            (business) => business.id === normalizedData.businessId
        );

        if (!business) {
            const error = new Error(
                "Business associated with this expense does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate expense IDs
        const expenses = this.getAllExpenses();

        const existingExpense = expenses.find(
            (expense) => expense.id === normalizedData.id
        );

        if (existingExpense) {
            const error = new Error(
                "Expense ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create the expense using the business currency
        const expense = new Expense({
            ...normalizedData,
            currency: business.currency || "ZAR"
        });

        // Save the expense to JSON storage
        expenses.push(expense);

        fileStorage.write(FILE_NAME, expenses);

        return expense;
    }
}

module.exports = new ExpenseService();