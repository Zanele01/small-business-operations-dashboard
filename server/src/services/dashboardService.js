const businessService = require("./businessService");
const productService = require("./productService");
const saleService = require("./saleService");
const expenseService = require("./expenseService");

class DashboardService {

    getDashboardSummary(businessId) {

        const businesses = businessService.getAllBusinesses();

        const business = businesses.find(
            (business) => business.id === businessId
        );

        if (!business) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        const products = productService.getAllProducts();

        const sales = saleService.getAllSales();

        const expenses = expenseService.getAllExpenses();

        const businessProducts = products.filter(
            (product) => product.businessId === businessId
        );

        const businessSales = sales.filter(
            (sale) => sale.businessId === businessId
        );

        const businessExpenses = expenses.filter(
            (expense) => expense.businessId === businessId
        );

        const totalSales = businessSales.reduce(
            (total, sale) => total + sale.totalAmount,
            0
        );

        const totalExpenses = businessExpenses.reduce(
            (total, expense) => total + expense.amount,
            0
        );

        const netPosition = totalSales - totalExpenses;

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