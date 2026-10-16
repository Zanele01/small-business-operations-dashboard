const Employee = require("../models/employee");
const businessService = require("./businessService");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "employees.json";

class EmployeeService {

    getAllEmployees() {
        return fileStorage.read(FILE_NAME);
    }

    getEmployeesByBusiness(businessId) {
        const employees = this.getAllEmployees();

        return employees.filter(
            (employee) => employee.businessId === businessId
        );
    }

    getEmployeeById(employeeId) {
        const employees = this.getAllEmployees();

        return employees.find(
            (employee) => employee.id === employeeId
        );
    }

    createEmployee(
        id,
        businessId,
        name,
        email,
        phone,
        role
    ) {

        // Validate required string fields
        const requiredFields = {
            id,
            businessId,
            name,
            email,
            phone,
            role
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

        // Check for duplicate employee IDs
        const employees = this.getAllEmployees();

        const duplicate = employees.find(
            (employee) => employee.id === id
        );

        if (duplicate) {
            const error = new Error(
                "Employee with this ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create the employee
        const employee = new Employee(
            id,
            businessId,
            name,
            email,
            phone,
            role
        );

        // Persist the validated employee
        employees.push(employee);

        fileStorage.write(FILE_NAME, employees);

        return employee;
    }
}

module.exports = new EmployeeService();