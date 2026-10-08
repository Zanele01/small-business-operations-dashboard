const employeeService = require("../services/employeeService");

const getEmployeesByBusiness = (req, res, next) => {
    try {
        const employees =
            employeeService.getEmployeesByBusiness(
                req.params.businessId
            );

        res.status(200).json(employees);
    } catch (error) {
        next(error);
    }
};

const getEmployeeById = (req, res, next) => {
    try {
        const employee =
            employeeService.getEmployeeById(
                req.params.employeeId
            );

        if (!employee) {
            const error = new Error("Employee not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(employee);
    } catch (error) {
        next(error);
    }
};

const createEmployee = (req, res, next) => {
    try {
        const {
            id,
            businessId,
            name,
            email,
            phone,
            role
        } = req.body;

        const employee =
            employeeService.createEmployee(
                id,
                businessId,
                name,
                email,
                phone,
                role
            );

        res.status(201).json(employee);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEmployeesByBusiness,
    getEmployeeById,
    createEmployee
};