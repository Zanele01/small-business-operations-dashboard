const Product = require("../models/product");
const fileStorage = require("../utils/fileStorage");
const businessService = require("./businessService");

const FILE_NAME = "products.json";

class ProductService {

    getAllProducts() {
        return fileStorage.read(FILE_NAME);
    }

    getProductsByBusiness(businessId) {
        const products = fileStorage.read(FILE_NAME);

        return products.filter(
            (product) => product.businessId === businessId
        );
    }

    getProductById(businessId, productId) {
        const products = fileStorage.read(FILE_NAME);

        return products.find(
            (product) =>
                product.id === productId &&
                product.businessId === businessId
        );
    }

    createProduct(productData) {

        // Validate the request body
        if (
            !productData ||
            typeof productData !== "object" ||
            Array.isArray(productData)
        ) {
            const error = new Error(
                "Product data must be an object."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate required fields
        const requiredFields = [
            "id",
            "businessId",
            "name",
            "price",
            "stockQuantity",
            "category"
        ];

        for (const field of requiredFields) {
            if (
                productData[field] === undefined ||
                productData[field] === null ||
                productData[field] === ""
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
            "name",
            "category"
        ];

        for (const field of stringFields) {
            if (
                typeof productData[field] !== "string" ||
                !productData[field].trim()
            ) {
                const error = new Error(
                    `${field} must be a non-empty string.`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        // Validate optional description
        if (
            productData.description !== undefined &&
            typeof productData.description !== "string"
        ) {
            const error = new Error(
                "Description must be a string."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate optional currency
        if (
            productData.currency !== undefined &&
            (
                typeof productData.currency !== "string" ||
                !productData.currency.trim()
            )
        ) {
            const error = new Error(
                "Currency must be a non-empty string."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate price
        if (
            typeof productData.price !== "number" ||
            !Number.isFinite(productData.price) ||
            productData.price < 0
        ) {
            const error = new Error(
                "Price must be a finite number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate stock quantity
        if (
            !Number.isInteger(productData.stockQuantity) ||
            productData.stockQuantity < 0
        ) {
            const error = new Error(
                "Stock quantity must be a whole number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

        // Normalise string fields
        const normalisedData = {
            ...productData,
            id: productData.id.trim(),
            businessId: productData.businessId.trim(),
            name: productData.name.trim(),
            category: productData.category.trim(),
            description: productData.description === undefined
                ? undefined
                : productData.description.trim(),
            currency: productData.currency === undefined
                ? "ZAR"
                : productData.currency.trim().toUpperCase()
        };

        // Verify that the associated business exists
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === normalisedData.businessId
        );

        if (!businessExists) {
            const error = new Error(
                "Business associated with this product does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate product IDs
        const products = fileStorage.read(FILE_NAME);

        const existingProduct = products.find(
            (product) => product.id === normalisedData.id
        );

        if (existingProduct) {
            const error = new Error(
                "Product ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create the product
        const product = new Product(normalisedData);

        // Save the product to JSON storage
        products.push(product);

        fileStorage.write(FILE_NAME, products);

        return product;
    }

    reduceStock(businessId, productId, quantity) {

        // Validate quantity
        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            const error = new Error(
                "Stock reduction quantity must be a whole number greater than 0."
            );

            error.statusCode = 400;
            throw error;
        }

        const products = fileStorage.read(FILE_NAME);

        const productIndex = products.findIndex(
            (product) =>
                product.id === productId &&
                product.businessId === businessId
        );

        if (productIndex === -1) {
            const error = new Error("Product not found.");
            error.statusCode = 404;
            throw error;
        }

        const product = products[productIndex];

        if (product.stockQuantity < quantity) {
            const error = new Error(
                "Insufficient stock available."
            );

            error.statusCode = 400;
            throw error;
        }

        // Reduce stock and update timestamp
        product.stockQuantity -= quantity;
        product.updatedAt = new Date().toISOString();

        products[productIndex] = product;

        fileStorage.write(FILE_NAME, products);

        return product;
    }
}

module.exports = new ProductService();