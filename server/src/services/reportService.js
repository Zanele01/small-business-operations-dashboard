const businessService = require("./businessService");
const saleService = require("./saleService");
const expenseService = require("./expenseService");

class ReportService {

    getBusinessReport(businessId, from, to) {

        // Validate date parameters
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (from && !datePattern.test(from)) {
            const error = new Error("Invalid from date.");
            error.statusCode = 400;
            throw error;
        }

        if (to && !datePattern.test(to)) {
            const error = new Error("Invalid to date.");
            error.statusCode = 400;
            throw error;
        }

        // Create UTC date boundaries
        const fromDate = from
            ? new Date(`${from}T00:00:00.000Z`)
            : null;

        const toDate = to
            ? new Date(`${to}T23:59:59.999Z`)
            : null;

        // Validate actual calendar dates and date range
        if (
            (fromDate && isNaN(fromDate.getTime())) ||
            (toDate && isNaN(toDate.getTime()))
        ) {
            const error = new Error(
                fromDate && isNaN(fromDate.getTime())
                    ? "Invalid from date."
                    : "Invalid to date."
            );

            error.statusCode = 400;
            throw error;
        }

        // Reject impossible calendar dates
        if (
            (from && fromDate.toISOString().slice(0, 10) !== from) ||
            (to && toDate.toISOString().slice(0, 10) !== to)
        ) {
            const error = new Error(
                from && fromDate.toISOString().slice(0, 10) !== from
                    ? "Invalid from date."
                    : "Invalid to date."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate date range
        if (fromDate && toDate && fromDate > toDate) {
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

        // Load sales and expenses
        const sales = saleService.getAllSales();
        const expenses = expenseService.getAllExpenses();

        // Filter sales by business and date range
        const businessSales = sales.filter((sale) => {

            if (sale.businessId !== businessId) {
                return false;
            }

        const saleDate = new Date(sale.createdAt);
			
			if (isNaN(saleDate.getTime())) {
				return false;
			}

            if (fromDate && saleDate < fromDate) {
                return false;
            }

            if (toDate && saleDate > toDate) {
                return false;
            }

            return true;
        });

        // Filter expenses by business and date range
        const businessExpenses = expenses.filter((expense) => {

            if (expense.businessId !== businessId) {
                return false;
            }

        const expenseDate = new Date(expense.createdAt);
			
			if (isNaN(expenseDate.getTime())) {
				return false;
			}

            if (fromDate && expenseDate < fromDate) {
                return false;
            }

            if (toDate && expenseDate > toDate) {
                return false;
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

        // Calculate sale statistics
        const saleAmounts = businessSales.map(
            (sale) => sale.totalAmount
        );

        const averageSaleAmount =
            saleAmounts.length > 0
                ? totalSales / saleAmounts.length
                : 0;

        const highestSaleAmount =
            saleAmounts.length > 0
                ? Math.max(...saleAmounts)
                : 0;

        const lowestSaleAmount =
            saleAmounts.length > 0
                ? Math.min(...saleAmounts)
                : 0;

        return {
            businessId: businessId,
            businessName: business.businessName,
            from: from || null,
            to: to || null,
            totalSales: totalSales,
            totalExpenses: totalExpenses,
            netPosition: netPosition,
            salesCount: businessSales.length,
            expenseCount: businessExpenses.length,
            averageSaleAmount: averageSaleAmount,
            highestSaleAmount: highestSaleAmount,
            lowestSaleAmount: lowestSaleAmount
        };
    }
}

module.exports = new ReportService();