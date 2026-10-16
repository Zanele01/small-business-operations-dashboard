const Sale = require("../models/sale");
const fileStorage = require("../utils/fileStorage");
const businessService = require("./businessService");
const productService = require("./productService");

const FILE_NAME = "sales.json";

class SaleService {

    getAllSales() {
        return fileStorage.read(FILE_NAME);
    }

    getSaleById(id) {
        const sales = fileStorage.read(FILE_NAME);

        return sales.find(
            (sale) => sale.id === id
        );
    }

    createSale(saleData) {

        // Validate the request body
        if (
            !saleData ||
            typeof saleData !== "object" ||
            Array.isArray(saleData)
        ) {
            const error = new Error(
                "Sale data must be an object."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate required fields
        const requiredFields = [
            "id",
            "businessId",
            "productId",
            "quantity",
            "unitPrice",
            "paymentMethod"
        ];

        for (const field of requiredFields) {
            if (
                saleData[field] === undefined ||
                saleData[field] === null ||
                saleData[field] === ""
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
            "productId",
            "paymentMethod"
        ];

        for (const field of stringFields) {
            if (
                typeof saleData[field] !== "string" ||
                !saleData[field].trim()
            ) {
                const error = new Error(
                    `${field} must be a non-empty string.`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        // Validate quantity
        if (
            !Number.isInteger(saleData.quantity) ||
            saleData.quantity <= 0
        ) {
            const error = new Error(
                "Quantity must be a whole number greater than 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate unit price
        if (
            typeof saleData.unitPrice !== "number" ||
            !Number.isFinite(saleData.unitPrice) ||
            saleData.unitPrice < 0
        ) {
            const error = new Error(
                "Unit price must be a finite number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Verify that the associated business exists
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === saleData.businessId
        );

        if (!businessExists) {
            const error = new Error(
                "Business associated with this sale does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        // Verify that the associated product exists
        const product = productService.getProductById(
            saleData.productId
        );

        if (!product) {
            const error = new Error(
                "Product associated with this sale does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        // Ensure the product belongs to the specified business
        if (product.businessId !== saleData.businessId) {
            const error = new Error(
                "Product does not belong to the specified business."
            );

            error.statusCode = 400;
            throw error;
        }

        // Check for duplicate sale IDs
        const sales = fileStorage.read(FILE_NAME);

        const existingSale = sales.find(
            (sale) => sale.id === saleData.id
        );

        if (existingSale) {
            const error = new Error(
                "Sale ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create the sale
        const sale = new Sale(saleData);

        // Save the sale to JSON storage
        sales.push(sale);

        fileStorage.write(FILE_NAME, sales);

        return sale;
    }
}

module.exports = new SaleService();