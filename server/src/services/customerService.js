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
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        if (!id || !businessId || !name || !email || !phone) {
            const error = new Error(
                "ID, businessId, name, email, and phone are required."
            );

            error.statusCode = 400;
            throw error;
        }

        const customers = this.getAllCustomers();

        const duplicate = customers.find(
            (customer) => customer.id === id
        );

        if (duplicate) {
            const error = new Error(
                "Customer with this ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        const customer = new Customer(
            id,
            businessId,
            name,
            email,
            phone
        );

        customers.push(customer);

        fileStorage.write(FILE_NAME, customers);

        return customer;
    }
}

module.exports = new CustomerService();