const Supplier = require("../models/supplier");
const businessService = require("./businessService");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "suppliers.json";

class SupplierService {

    getAllSuppliers() {
        return fileStorage.read(FILE_NAME);
    }

    getSuppliersByBusiness(businessId) {
        const suppliers = this.getAllSuppliers();

        return suppliers.filter(
            (supplier) => supplier.businessId === businessId
        );
    }

    getSupplierById(supplierId) {
        const suppliers = this.getAllSuppliers();

        return suppliers.find(
            (supplier) => supplier.id === supplierId
        );
    }

    createSupplier(
        id,
        businessId,
        name,
        email,
        phone
    ) {

        // Validate required string fields
        const requiredFields = {
            id,
            businessId,
            name,
            email,
            phone
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (
                typeof value !== "string" ||
                !value.trim()
            ) {
                const error = new Error(
                    `${field} must be a non-empty string.`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        // Verify that the associated business exists
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate supplier IDs
        const suppliers = this.getAllSuppliers();

        const duplicate = suppliers.find(
            (supplier) => supplier.id === id
        );

        if (duplicate) {
            const error = new Error(
                "Supplier with this ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create the supplier
        const supplier = new Supplier(
            id,
            businessId,
            name,
            email,
            phone
        );

        // Persist the validated supplier
        suppliers.push(supplier);

        fileStorage.write(FILE_NAME, suppliers);

        return supplier;
    }
}

module.exports = new SupplierService();