const supplierService = require("../services/supplierService");

const getSuppliersByBusiness = (req, res, next) => {
    try {
        const suppliers =
            supplierService.getSuppliersByBusiness(
                req.params.businessId
            );

        res.status(200).json(suppliers);
    } catch (error) {
        next(error);
    }
};

const getSupplierById = (req, res, next) => {
    try {
        const supplier =
            supplierService.getSupplierById(
                req.params.supplierId
            );

        if (!supplier) {
            const error = new Error("Supplier not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(supplier);
    } catch (error) {
        next(error);
    }
};

const createSupplier = (req, res, next) => {
    try {
        const {
            id,
            businessId,
            name,
            email,
            phone
        } = req.body;

        const supplier =
            supplierService.createSupplier(
                id,
                businessId,
                name,
                email,
                phone
            );

        res.status(201).json(supplier);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSuppliersByBusiness,
    getSupplierById,
    createSupplier
};