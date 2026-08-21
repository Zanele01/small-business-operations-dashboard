const businessService = require("../services/businessService");

const getAllBusinesses = (req, res, next) => {
    try {
        const businesses = businessService.getAllBusinesses();

        res.status(200).json(businesses);
    } catch (error) {
        next(error);
    }
};

const createBusiness = (req, res, next) => {
    try {
        const business = businessService.createBusiness(req.body);

        res.status(201).json(business);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBusinesses,
    createBusiness
};