const businessService = require("./businessService");
const productService = require("./productService");
const saleService = require("./saleService");
const expenseService = require("./expenseService");

class DashboardService {

    getDashboardSummary(businessId, from, to) {

        // Validate date parameters
        if (from && isNaN(Date.parse(from))) {
            const error = new Error("Invalid from date.");
            error.statusCode = 400;
            throw error;
        }

        if (to && isNaN(Date.parse(to))) {
            const error = new Error("Invalid to date.");
            error.statusCode = 400;
            throw error;
        }

        if (from && to && new Date(from) > new Date(to)) {
            const error = new Error(
                "From date cannot be later than to date."
            );

            error.statusCode = 400;
            throw error;
        }

        // Find the business
        const businesses = businessService.getAllBusinesses();

        const business = businesses.find(
            (business) => business.id === businessId
        );

        if (!business) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Load existing business data
        const products = productService.getAllProducts();
        const sales = saleService.getAllSales();
        const expenses = expenseService.getAllExpenses();

        // Filter products by business
        const businessProducts = products.filter(
            (product) => product.businessId === businessId
        );

        // Filter sales by business and date range
        const businessSales = sales.filter((sale) => {

            if (sale.businessId !== businessId) {
                return false;
            }

            const saleDate = new Date(sale.createdAt);

            if (from && saleDate < new Date(from)) {
                return false;
            }

            if (to) {
                const endDate = new Date(to);
                endDate.setHours(23, 59, 59, 999);

                if (saleDate > endDate) {
                    return false;
                }
            }

            return true;
        });

        // Filter expenses by business and date range
        const businessExpenses = expenses.filter((expense) => {

            if (expense.businessId !== businessId) {
                return false;
            }

            const expenseDate = new Date(expense.createdAt);

            if (from && expenseDate < new Date(from)) {
                return false;
            }

            if (to) {
                const endDate = new Date(to);
                endDate.setHours(23, 59, 59, 999);

                if (expenseDate > endDate) {
                    return false;
                }
            }

            return true;
        });

        // Calculate totals
        const totalSales = businessSales.reduce(
            (total, sale) => total + sale.totalAmount,
            0
        );

        const totalExpenses = businessExpenses.reduce(
            (total, expense) => total + expense.amount,
            0
        );

        const netPosition = totalSales - totalExpenses;

        // Return dashboard summary
        return {
            businessId: businessId,
            businessName: business.businessName,
            totalSales: totalSales,
            totalExpenses: totalExpenses,
            netPosition: netPosition,
            productCount: businessProducts.length,
            salesCount: businessSales.length,
            expenseCount: businessExpenses.length
        };
    }
}

module.exports = new DashboardService();
