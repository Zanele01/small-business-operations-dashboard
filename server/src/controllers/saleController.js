const saleService = require("../services/saleService");

const getAllSales = (req, res, next) => {
    try {
        const sales = saleService.getAllSales();

        res.status(200).json(sales);
    } catch (error) {
        next(error);
    }
};

const getSaleById = (req, res, next) => {
    try {
        const sale = saleService.getSaleById(req.params.id);

        if (!sale) {
            const error = new Error("Sale not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(sale);
    } catch (error) {
        next(error);
    }
};

const createSale = (req, res, next) => {
    try {
        const sale = saleService.createSale(req.body);

        res.status(201).json(sale);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSales,
    getSaleById,
    createSale
};