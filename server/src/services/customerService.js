
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

    getCustomerById(businessId, customerId) {
        const customers = this.getAllCustomers();

        return customers.find(
            (customer) =>
                customer.businessId === businessId &&
                customer.id === customerId
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

        // Normalise input values.
        const normalizedId = id.trim();
        const normalizedBusinessId = businessId.trim();
        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone.trim();

        // Validate email format.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            const error = new Error(
                "Please provide a valid email address."
            );

            error.statusCode = 400;
            throw error;
        }

        // Confirm that the business exists.
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === normalizedBusinessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate customer IDs.
        const customers = this.getAllCustomers();

        const duplicate = customers.find(
            (customer) => customer.id === normalizedId
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
            normalizedId,
            normalizedBusinessId,
            normalizedName,
            normalizedEmail,
            normalizedPhone
        );

        customers.push(customer);

        fileStorage.write(FILE_NAME, customers);

        return customer;
    }
}

module.exports = new CustomerService();
