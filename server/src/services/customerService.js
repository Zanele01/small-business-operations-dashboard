const Customer = require("../models/customer");
const businessService = require("./businessService");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "customers.json";

class CustomerService {

    getAllCustomers() {
        return fileStorage.read(FILE_NAME);
    }

    getCustomersByBusiness(businessId) {
        const customers = this.getAllCustomers();

        return customers.filter(
            (customer) => customer.businessId === businessId
        );
    }

    getCustomerById(customerId) {
        const customers = this.getAllCustomers();

        return customers.find(
            (customer) => customer.id === customerId
        );
    }

    createCustomer(
        id,
        businessId,
        name,
        email,
        phone
    ) {
        // Validate required fields.
        const requiredFields = {
            id,
            businessId,
            name,
            email,
            phone
        };

        const invalidField = Object.entries(
            requiredFields
        ).find(
            ([, value]) =>
                typeof value !== "string" ||
                value.trim().length === 0
        );

        if (invalidField) {
            const error = new Error(
                "ID, businessId, name, email, and phone must be non-empty strings."
            );

            error.statusCode = 400;
            throw error;
        }

        // Confirm that the business exists.
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId.trim()
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate customer IDs.
        const customers = this.getAllCustomers();

        const duplicate = customers.find(
            (customer) => customer.id === id.trim()
        );

        if (duplicate) {
            const error = new Error(
                "Customer with this ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create and save the customer after validation.
        const customer = new Customer(
            id.trim(),
            businessId.trim(),
            name.trim(),
            email.trim(),
            phone.trim()
        );

        customers.push(customer);

        fileStorage.write(FILE_NAME, customers);

        return customer;
    }
}

module.exports = new CustomerService();