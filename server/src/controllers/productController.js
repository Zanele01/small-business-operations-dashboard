const productService = require("../services/productService");

const getAllProducts = (req, res, next) => {
    try {
        const products = productService.getAllProducts();

        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

const getProductById = (req, res, next) => {
    try {
        const product = productService.getProductById(req.params.id);

        if (!product) {
            const error = new Error("Product not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

const createProduct = (req, res, next) => {
    try {
        const product = productService.createProduct(req.body);

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct
};