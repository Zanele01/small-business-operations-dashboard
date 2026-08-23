const Product = require("../models/product");
const fileStorage = require("../utils/fileStorage");
const businessService = require("./businessService");

const FILE_NAME = "products.json";

class ProductService {

    getAllProducts() {
        return fileStorage.read(FILE_NAME);
    }

    getProductById(id) {
        const products = fileStorage.read(FILE_NAME);

        return products.find(
            (product) => product.id === id
        );
    }

    createProduct(productData) {

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
                const error = new Error(`${field} is required.`);
                error.statusCode = 400;
                throw error;
            }
        }

        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === productData.businessId
        );

        if (!businessExists) {
            const error = new Error(
                "Business associated with this product does not exist."
            );

            error.statusCode = 404;
            throw error;
        }

        const products = fileStorage.read(FILE_NAME);

        const existingProduct = products.find(
            (product) => product.id === productData.id
        );

        if (existingProduct) {
            const error = new Error("Product ID already exists.");
            error.statusCode = 409;
            throw error;
        }

        if (
            typeof productData.price !== "number" ||
            productData.price < 0
        ) {
            const error = new Error(
                "Price must be a number greater than or equal to 0."
            );

            error.statusCode = 400;
            throw error;
        }

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

        const product = new Product(productData);

        products.push(product);

        fileStorage.write(FILE_NAME, products);

        return product;
    }
}

module.exports = new ProductService();