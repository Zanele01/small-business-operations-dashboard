const Sale = require("../models/sale");
const fileStorage = require("../utils/fileStorage");
const businessService = require("./businessService");
const productService = require("./productService");

const FILE_NAME = "sales.json";
const PRODUCT_FILE_NAME = "products.json";

const ALLOWED_PAYMENT_METHODS = ["Card"];

class SaleService {

    getAllSales() {
        return fileStorage.read(FILE_NAME);
    }

    getSalesByBusiness(businessId) {
        const sales = fileStorage.read(FILE_NAME);

        return sales.filter(
            (sale) => sale.businessId === businessId
        );
    }

    getSaleById(businessId, saleId) {
        const sales = fileStorage.read(FILE_NAME);

        return sales.find(
            (sale) =>
                sale.id === saleId &&
                sale.businessId === businessId
        );
    }

    createSale(saleData) {

        // Validate the request body.
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

        // Validate required fields.
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

        // Validate required string fields.
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

        // Normalise string fields.
        const normalisedData = {
            ...saleData,
            id: saleData.id.trim(),
            businessId: saleData.businessId.trim(),
            productId: saleData.productId.trim(),
            paymentMethod: saleData.paymentMethod.trim()
        };

        // Validate the payment method for the first deployment.
        normalisedData.paymentMethod =
            normalisedData.paymentMethod.toLowerCase() === "card"
                ? "Card"
                : normalisedData.paymentMethod;

        if (
            !ALLOWED_PAYMENT_METHODS.includes(
                normalisedData.paymentMethod
            )
        ) {
            const error = new Error(
                "Unsupported payment method. Only Card payments are accepted."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate quantity.
        if (
            !Number.isInteger(normalisedData.quantity) ||
            normalisedData.quantity <= 0
        ) {
            const error = new Error(
                "Quantity must be a whole number greater than 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate unit price.
        if (
            typeof normalisedData.unitPrice !== "number" ||
            !Number.isFinite(normalisedData.unitPrice) ||
            normalisedData.unitPrice < 0
        ) {
            const error = new Error(
                "Unit price must be a finite number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate the calculated sale total.
        const totalAmount =
            normalisedData.quantity * normalisedData.unitPrice;

        if (!Number.isFinite(totalAmount)) {
            const error = new Error(
                "Sale total amount must be a finite number."
            );

            error.statusCode = 400;
            throw error;
        }

        // Verify that the associated business exists.
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === normalisedData.businessId
        );

        if (!businessExists) {
            const error = new Error(
                "Business associated with this sale does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        // Verify that the product belongs to the specified business.
        const product = productService.getProductById(
            normalisedData.businessId,
            normalisedData.productId
        );

        if (!product) {
            const error = new Error(
                "Product associated with this sale does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        // Validate the product's stored stock quantity.
        if (
            !Number.isInteger(product.stockQuantity) ||
            product.stockQuantity < 0
        ) {
            const error = new Error(
                "Product stock data is invalid."
            );

            error.statusCode = 500;
            throw error;
        }

        // Check whether sufficient stock is available.
        if (product.stockQuantity < normalisedData.quantity) {
            const error = new Error(
                "Insufficient stock available."
            );

            error.statusCode = 400;
            throw error;
        }

        // Check for duplicate sale IDs.
        const sales = fileStorage.read(FILE_NAME);

        const existingSale = sales.find(
            (sale) => sale.id === normalisedData.id
        );

        if (existingSale) {
            const error = new Error(
                "Sale ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create the sale using the submitted unit price.
        // Currency is taken from the associated product.
        const sale = new Sale({
            ...normalisedData,
            currency: product.currency || "ZAR"
        });

        // Prepare the updated sales collection.
        const updatedSales = [...sales, sale];

        // Read all products so that other businesses' products
        // remain unchanged.
        const products = productService.getAllProducts();

        const now = new Date().toISOString();

        // Prepare the updated product collection.
        const updatedProducts = products.map((item) => {

            if (
                item.id === normalisedData.productId &&
                item.businessId === normalisedData.businessId
            ) {
                return {
                    ...item,
                    stockQuantity:
                        item.stockQuantity - normalisedData.quantity,
                    updatedAt: now
                };
            }

            return item;
        });

        // Save both files using the coordinated storage operation.
        fileStorage.writeMultiple([
            {
                fileName: FILE_NAME,
                data: updatedSales
            },
            {
                fileName: PRODUCT_FILE_NAME,
                data: updatedProducts
            }
        ]);

        return sale;
    }
}

module.exports = new SaleService();