const customerService = require("../services/customerService");

const getCustomersByBusiness = (req, res, next) => {
    try {
        const customers =
            customerService.getCustomersByBusiness(
                req.params.businessId
            );

        res.status(200).json(customers);
    } catch (error) {
        next(error);
    }
};

const getCustomerById = (req, res, next) => {
    try {
        const customer =
            customerService.getCustomerById(
                req.params.customerId
            );

        if (!customer) {
            const error = new Error("Customer not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(customer);
    } catch (error) {
        next(error);
    }
};

const createCustomer = (req, res, next) => {
    try {
        const {
            id,
            businessId,
            name,
            email,
            phone
        } = req.body;

        const customer =
            customerService.createCustomer(
                id,
                businessId,
                name,
                email,
                phone
            );

        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCustomersByBusiness,
    getCustomerById,
    createCustomer
};