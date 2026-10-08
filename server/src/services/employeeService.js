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
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        if (
            !id ||
            !businessId ||
            !name ||
            !email ||
            !phone ||
            !role
        ) {
            const error = new Error(
                "ID, businessId, name, email, phone, and role are required."
            );

            error.statusCode = 400;
            throw error;
        }

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

        const employee = new Employee(
            id,
            businessId,
            name,
            email,
            phone,
            role
        );

        employees.push(employee);

        fileStorage.write(FILE_NAME, employees);

        return employee;
    }
}

module.exports = new EmployeeService();