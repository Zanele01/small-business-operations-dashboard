const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const originalDataDirectory = process.env.DATA_DIRECTORY;

const testDataDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "small-business-dashboard-tests-")
);

const fixtureFiles = [
    "businesses.json",
    "products.json",
    "customers.json",
    "suppliers.json",
    "employees.json",
    "tasks.json",
    "sales.json"
];

for (const fileName of fixtureFiles) {
    fs.copyFileSync(
        path.join(__dirname, "../src/data", fileName),
        path.join(testDataDirectory, fileName)
    );
}

process.env.DATA_DIRECTORY = testDataDirectory;

const app = require("../server");

let server;
let baseUrl;

test.before(async () => {
    server = app.listen(0);

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.once("listening", resolve);
    });

    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    fs.rmSync(testDataDirectory, {
        recursive: true,
        force: true
    });

    if (originalDataDirectory === undefined) {
        delete process.env.DATA_DIRECTORY;
    } else {
        process.env.DATA_DIRECTORY = originalDataDirectory;
    }
});

// Server integration tests
test("GET /health returns the expected health status", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
        status: "OK",
        message: "Small Business Dashboard API running"
    });
});

test("GET /api/business returns the existing businesses", async () => {
    const response = await fetch(`${baseUrl}/api/business`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(body.length > 0);

    assert.ok(
        body.some((business) => business.id === "BUS001")
    );
});

test("POST /api/business creates a business and rejects duplicate IDs", async () => {
    const newBusiness = {
        id: "BUS_TEST_001",
        businessName: "Integration Test Business",
        ownerName: "Test Owner",
        email: "test@example.com",
        phone: "0821234567",
        address: "Johannesburg",
        businessType: "Retail"
    };

    const createResponse = await fetch(
        `${baseUrl}/api/business`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newBusiness)
        }
    );

    const createdBusiness = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createdBusiness.id, newBusiness.id);
    assert.equal(
        createdBusiness.businessName,
        newBusiness.businessName
    );
    assert.equal(createdBusiness.currency, "ZAR");

    const duplicateResponse = await fetch(
        `${baseUrl}/api/business`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newBusiness)
        }
    );

    const duplicateBody = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 409);
    assert.equal(
        duplicateBody.error,
        "Business ID already exists."
    );
});

test("Unknown API routes return HTTP 404", async () => {
    const response = await fetch(
        `${baseUrl}/api/unknown`
    );

    assert.equal(response.status, 404);
});

// Product integration tests

test("GET /api/products/:businessId returns products for that business", async () => {
    const response = await fetch(
        `${baseUrl}/api/products/BUS001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(
        body.some((product) => product.id === "PROD001")
    );

    assert.ok(
        body.every((product) => product.businessId === "BUS001")
    );
});

test("GET /api/products/:businessId returns an empty array when no products exist", async () => {
    const response = await fetch(
        `${baseUrl}/api/products/BUS_TEST_001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
});

test("GET /api/products/:businessId/:productId returns the requested product", async () => {
    const response = await fetch(
        `${baseUrl}/api/products/BUS001/PROD001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, "PROD001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, "Chocolate Cake");
    assert.equal(body.stockQuantity, 8);
});

test("GET /api/products/:businessId/:productId returns 404 for a missing product", async () => {
    const response = await fetch(
        `${baseUrl}/api/products/BUS001/PROD999`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Product not found.");
});

test("GET /api/products/:businessId/:productId does not return another business's product", async () => {
    const response = await fetch(
        `${baseUrl}/api/products/BUS_TEST_001/PROD001`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Product not found.");
});

test("POST /api/products creates a product with default ZAR currency", async () => {
    const newProduct = {
        id: "PROD_TEST_001",
        businessId: "BUS001",
        name: "Test Product",
        description: "Integration test product",
        price: 75,
        stockQuantity: 10,
        category: "Test Category"
    };

    const response = await fetch(
        `${baseUrl}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newProduct)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.id, newProduct.id);
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, newProduct.name);
    assert.equal(body.price, 75);
    assert.equal(body.stockQuantity, 10);
    assert.equal(body.currency, "ZAR");

    assert.ok(!Number.isNaN(Date.parse(body.createdAt)));
    assert.ok(!Number.isNaN(Date.parse(body.updatedAt)));
});

test("POST /api/products rejects duplicate product IDs", async () => {
    const duplicateProduct = {
        id: "PROD001",
        businessId: "BUS001",
        name: "Duplicate Product",
        price: 50,
        stockQuantity: 5,
        category: "Test Category"
    };

    const response = await fetch(
        `${baseUrl}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duplicateProduct)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.error, "Product ID already exists.");
});

test("POST /api/products rejects negative prices", async () => {
    const invalidProduct = {
        id: "PROD_TEST_002",
        businessId: "BUS001",
        name: "Invalid Price Product",
        price: -10,
        stockQuantity: 5,
        category: "Test Category"
    };

    const response = await fetch(
        `${baseUrl}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidProduct)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Price must be a finite number greater than 0."
    );
});

test("POST /api/products rejects zero prices", async () => {
    const invalidProduct = {
        id: "PROD_TEST_ZERO_PRICE",
        businessId: "BUS001",
        name: "Zero Price Product",
        price: 0,
        stockQuantity: 5,
        category: "Test Category"
    };

    const response = await fetch(
        `${baseUrl}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidProduct)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Price must be a finite number greater than 0."
    );
});

test("POST /api/products rejects decimal stock quantities", async () => {
    const invalidProduct = {
        id: "PROD_TEST_003",
        businessId: "BUS001",
        name: "Invalid Stock Product",
        price: 50,
        stockQuantity: 2.5,
        category: "Test Category"
    };

    const response = await fetch(
        `${baseUrl}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidProduct)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Stock quantity must be a whole number greater than or equal to 0."
    );
});

test("POST /api/products rejects products linked to nonexistent businesses", async () => {
    const invalidProduct = {
        id: "PROD_TEST_004",
        businessId: "BUS999",
        name: "Unlinked Product",
        price: 50,
        stockQuantity: 5,
        category: "Test Category"
    };

    const response = await fetch(
        `${baseUrl}/api/products`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidProduct)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(
        body.error,
        "Business associated with this product does not exist."
    );
});

// Customer integration tests

test("GET /api/customers/:businessId returns customers for that business", async () => {
    const response = await fetch(
        `${baseUrl}/api/customers/BUS001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 3);

    assert.ok(
        body.every((customer) => customer.businessId === "BUS001")
    );
});

test("GET /api/customers/:businessId returns an empty array when no customers exist", async () => {
    const response = await fetch(
        `${baseUrl}/api/customers/BUS_TEST_001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
});

test("GET /api/customers/:businessId/:customerId returns the requested customer", async () => {
    const response = await fetch(
        `${baseUrl}/api/customers/BUS001/CUS001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, "CUS001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, "Alice Johnson");
    assert.equal(body.email, "alice.johnson@example.com");
});

test("GET /api/customers/:businessId/:customerId returns 404 for a missing customer", async () => {
    const response = await fetch(
        `${baseUrl}/api/customers/BUS001/CUS999`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Customer not found.");
});

test("GET /api/customers/:businessId/:customerId does not return another business's customer", async () => {
    const response = await fetch(
        `${baseUrl}/api/customers/BUS_TEST_001/CUS001`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Customer not found.");
});

test("POST /api/customers creates a customer and normalises the email address", async () => {
    const newCustomer = {
        id: "CUS_TEST_001",
        businessId: "BUS001",
        name: "  Integration Test Customer  ",
        email: "  TEST.CUSTOMER@EXAMPLE.COM  ",
        phone: "  0821234567  "
    };

    const response = await fetch(
        `${baseUrl}/api/customers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newCustomer)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.id, "CUS_TEST_001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, "Integration Test Customer");
    assert.equal(body.email, "test.customer@example.com");
    assert.equal(body.phone, "0821234567");
    assert.ok(!Number.isNaN(Date.parse(body.createdAt)));
});

test("POST /api/customers rejects duplicate customer IDs", async () => {
    const duplicateCustomer = {
        id: "CUS001",
        businessId: "BUS001",
        name: "Duplicate Customer",
        email: "duplicate@example.com",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/customers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duplicateCustomer)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(
        body.error,
        "Customer with this ID already exists."
    );
});

test("POST /api/customers rejects invalid email addresses", async () => {
    const invalidCustomer = {
        id: "CUS_TEST_002",
        businessId: "BUS001",
        name: "Invalid Email Customer",
        email: "invalid-email",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/customers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidCustomer)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Please provide a valid email address."
    );
});

test("POST /api/customers rejects missing required fields", async () => {
    const invalidCustomer = {
        id: "CUS_TEST_003",
        businessId: "BUS001",
        name: "Missing Phone Customer",
        email: "missing.phone@example.com"
    };

    const response = await fetch(
        `${baseUrl}/api/customers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidCustomer)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "ID, businessId, name, email, and phone must be non-empty strings."
    );
});

test("POST /api/customers rejects customers linked to nonexistent businesses", async () => {
    const invalidCustomer = {
        id: "CUS_TEST_004",
        businessId: "BUS999",
        name: "Unlinked Customer",
        email: "unlinked@example.com",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/customers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidCustomer)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Business not found.");
});

// Supplier integration tests
test("GET /api/suppliers/:businessId returns suppliers for that business", async () => {
    const response = await fetch(
        `${baseUrl}/api/suppliers/BUS001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 3);

    assert.ok(
        body.every((supplier) => supplier.businessId === "BUS001")
    );

    assert.ok(
        body.some((supplier) => supplier.id === "SUP001")
    );
});

test("GET /api/suppliers/:businessId returns an empty array when no suppliers exist", async () => {
    const response = await fetch(
        `${baseUrl}/api/suppliers/BUS_TEST_001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
});

test("GET /api/suppliers/:businessId/:supplierId returns the requested supplier", async () => {
    const response = await fetch(
        `${baseUrl}/api/suppliers/BUS001/SUP001`
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, "SUP001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, "ABC Flour Suppliers");
    assert.equal(body.email, "orders@abcflour.example.com");
});

test("GET /api/suppliers/:businessId/:supplierId returns 404 for a missing supplier", async () => {
    const response = await fetch(
        `${baseUrl}/api/suppliers/BUS001/SUP999`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Supplier not found.");
});

test("GET /api/suppliers/:businessId/:supplierId does not return another business's supplier", async () => {
    const response = await fetch(
        `${baseUrl}/api/suppliers/BUS_TEST_001/SUP001`
    );
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Supplier not found.");
});

test("POST /api/suppliers creates a supplier and normalises its fields", async () => {
    const newSupplier = {
        id: "SUP_TEST_001",
        businessId: "BUS001",
        name: "  Integration Test Supplier  ",
        email: "  TEST.SUPPLIER@EXAMPLE.COM  ",
        phone: "  0821234567  "
    };

    const response = await fetch(
        `${baseUrl}/api/suppliers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newSupplier)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.id, "SUP_TEST_001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, "Integration Test Supplier");
    assert.equal(body.email, "test.supplier@example.com");
    assert.equal(body.phone, "0821234567");
    assert.ok(!Number.isNaN(Date.parse(body.createdAt)));
});

test("POST /api/suppliers rejects duplicate supplier IDs", async () => {
    const duplicateSupplier = {
        id: "SUP001",
        businessId: "BUS001",
        name: "Duplicate Supplier",
        email: "duplicate@example.com",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/suppliers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duplicateSupplier)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(
        body.error,
        "Supplier with this ID already exists."
    );
});

test("POST /api/suppliers rejects invalid email addresses", async () => {
    const invalidSupplier = {
        id: "SUP_TEST_002",
        businessId: "BUS001",
        name: "Invalid Email Supplier",
        email: "invalid-email",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/suppliers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSupplier)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Please provide a valid email address."
    );
});

test("POST /api/suppliers rejects missing required fields", async () => {
    const invalidSupplier = {
        id: "SUP_TEST_003",
        businessId: "BUS001",
        name: "Missing Phone Supplier",
        email: "missing.phone@example.com"
    };

    const response = await fetch(
        `${baseUrl}/api/suppliers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSupplier)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "phone must be a non-empty string."
    );
});

test("POST /api/suppliers rejects suppliers linked to nonexistent businesses", async () => {
    const invalidSupplier = {
        id: "SUP_TEST_004",
        businessId: "BUS999",
        name: "Unlinked Supplier",
        email: "unlinked@example.com",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/suppliers`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSupplier)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Business not found.");
});


// Employee integration tests

test("GET /api/employees/:businessId returns employees for the business", async () => {
    const response = await fetch(
        `${baseUrl}/api/employees/BUS001`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 3);
    assert.ok(body.every(
        (employee) => employee.businessId === "BUS001"
    ));
});

test("GET /api/employees/:businessId returns an empty array when no employees exist", async () => {
    const response = await fetch(
        `${baseUrl}/api/employees/BUS002`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
});

test("GET /api/employees/:businessId/:employeeId returns an employee", async () => {
    const response = await fetch(
        `${baseUrl}/api/employees/BUS001/EMP001`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, "EMP001");
    assert.equal(body.name, "Sarah Williams");
    assert.equal(body.role, "Sales Assistant");
});

test("GET /api/employees/:businessId/:employeeId returns 404 for a missing employee", async () => {
    const response = await fetch(
        `${baseUrl}/api/employees/BUS001/EMP999`
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Employee not found.");
});

test("GET /api/employees/:businessId/:employeeId does not return employees belonging to another business", async () => {
    const response = await fetch(
        `${baseUrl}/api/employees/BUS002/EMP001`
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Employee not found.");
});

test("POST /api/employees creates an employee and normalises its fields", async () => {
    const newEmployee = {
        id: " EMP_TEST_001 ",
        businessId: " BUS001 ",
        name: "  Integration Test Employee  ",
        email: "  TEST.EMPLOYEE@EXAMPLE.COM  ",
        phone: " 0821234567 ",
        role: "  Assistant Manager  "
    };

    const response = await fetch(
        `${baseUrl}/api/employees`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newEmployee)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.id, "EMP_TEST_001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.name, "Integration Test Employee");
    assert.equal(body.email, "test.employee@example.com");
    assert.equal(body.phone, "0821234567");
    assert.equal(body.role, "Assistant Manager");
    assert.ok(!Number.isNaN(Date.parse(body.createdAt)));
});

test("POST /api/employees rejects duplicate employee IDs", async () => {
    const duplicateEmployee = {
        id: "EMP001",
        businessId: "BUS001",
        name: "Duplicate Employee",
        email: "duplicate@example.com",
        phone: "0821234567",
        role: "Assistant"
    };

    const response = await fetch(
        `${baseUrl}/api/employees`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duplicateEmployee)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(
        body.error,
        "Employee with this ID already exists."
    );
});

test("POST /api/employees rejects invalid email addresses", async () => {
    const invalidEmployee = {
        id: "EMP_TEST_002",
        businessId: "BUS001",
        name: "Invalid Email Employee",
        email: "invalid-email",
        phone: "0821234567",
        role: "Assistant"
    };

    const response = await fetch(
        `${baseUrl}/api/employees`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidEmployee)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Please provide a valid email address."
    );
});

test("POST /api/employees rejects missing required fields", async () => {
    const invalidEmployee = {
        id: "EMP_TEST_003",
        businessId: "BUS001",
        name: "Missing Role Employee",
        email: "missing.role@example.com",
        phone: "0821234567"
    };

    const response = await fetch(
        `${baseUrl}/api/employees`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidEmployee)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "role must be a non-empty string."
    );
});

test("POST /api/employees rejects employees linked to nonexistent businesses", async () => {
    const invalidEmployee = {
        id: "EMP_TEST_004",
        businessId: "BUS999",
        name: "Unlinked Employee",
        email: "unlinked@example.com",
        phone: "0821234567",
        role: "Assistant"
    };

    const response = await fetch(
        `${baseUrl}/api/employees`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidEmployee)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Business not found.");
});


// Task integration tests

// GET task endpoints

test("GET /api/tasks/:businessId returns tasks for the business", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 4);
    assert.ok(body.every(
        (task) => task.businessId === "BUS001"
    ));
});

test("GET /api/tasks/:businessId returns an empty array when no tasks exist", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS002`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
});

test("GET /api/tasks/:businessId/:taskId returns the requested task", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, "TASK001");
    assert.equal(body.title, "Check bakery stock");
    assert.equal(body.status, "In Progress");
    assert.equal(body.priority, "High");
});

test("GET /api/tasks/:businessId/:taskId returns 404 for a missing task", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK999`
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Task not found.");
});

test("GET /api/tasks/:businessId/:taskId does not return another business's task", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS002/TASK001`
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Task not found.");
});

// POST task endpoints

test("POST /api/tasks creates a task and normalises its fields", async () => {
    const newTask = {
        id: " TASK_TEST_001 ",
        businessId: " BUS001 ",
        title: "  Integration Test Task  ",
        description: "  Testing task creation and normalisation.  ",
        status: "  pending  ",
        priority: "  hIgH  "
    };

    const response = await fetch(
        `${baseUrl}/api/tasks`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTask)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.id, "TASK_TEST_001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.title, "Integration Test Task");
    assert.equal(
        body.description,
        "Testing task creation and normalisation."
    );
    assert.equal(body.status, "Pending");
    assert.equal(body.priority, "High");
    assert.ok(!Number.isNaN(Date.parse(body.createdAt)));
});

test("POST /api/tasks rejects duplicate task IDs", async () => {
    const duplicateTask = {
        id: "TASK001",
        businessId: "BUS001",
        title: "Duplicate Task",
        description: "Testing duplicate task IDs.",
        status: "Pending",
        priority: "Low"
    };

    const response = await fetch(
        `${baseUrl}/api/tasks`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duplicateTask)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(
        body.error,
        "Task with this ID already exists."
    );
});

test("POST /api/tasks rejects unsupported task statuses", async () => {
    const invalidTask = {
        id: "TASK_TEST_002",
        businessId: "BUS001",
        title: "Invalid Status Task",
        description: "Testing invalid task status.",
        status: "On Hold",
        priority: "Medium"
    };

    const response = await fetch(
        `${baseUrl}/api/tasks`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidTask)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Invalid task status. Allowed values: Pending, In Progress, Completed, Cancelled."
    );
});

test("POST /api/tasks rejects unsupported task priorities", async () => {
    const invalidTask = {
        id: "TASK_TEST_003",
        businessId: "BUS001",
        title: "Invalid Priority Task",
        description: "Testing invalid task priority.",
        status: "Pending",
        priority: "Urgent"
    };

    const response = await fetch(
        `${baseUrl}/api/tasks`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidTask)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Invalid task priority. Allowed values: Low, Medium, High."
    );
});

test("POST /api/tasks rejects missing required fields", async () => {
    const invalidTask = {
        id: "TASK_TEST_004",
        businessId: "BUS001",
        title: "Missing Priority Task",
        description: "Testing missing required fields.",
        status: "Pending"
    };

    const response = await fetch(
        `${baseUrl}/api/tasks`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidTask)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "priority must be a non-empty string."
    );
});

test("POST /api/tasks rejects tasks linked to nonexistent businesses", async () => {
    const invalidTask = {
        id: "TASK_TEST_005",
        businessId: "BUS999",
        title: "Unlinked Task",
        description: "Testing a nonexistent business.",
        status: "Pending",
        priority: "Low"
    };

    const response = await fetch(
        `${baseUrl}/api/tasks`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidTask)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Business not found.");
});

// PATCH task endpoints

test("PATCH /api/tasks/:businessId/:taskId updates task title and description", async () => {
    const updates = {
        title: "  Updated Task Title  ",
        description: "  Updated task description.  "
    };

    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK_TEST_001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updates)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.title, "Updated Task Title");
    assert.equal(
        body.description,
        "Updated task description."
    );
    assert.equal(body.status, "Pending");
    assert.equal(body.priority, "High");
});

test("PATCH /api/tasks normalises task status", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "  cOmPlEtEd  "
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "Completed");
});

test("PATCH /api/tasks normalises task priority", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK002`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                priority: "  lOw  "
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.priority, "Low");
});

test("PATCH /api/tasks rejects an empty update object", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "At least one field must be provided for update."
    );
});

test("PATCH /api/tasks rejects unsupported update fields", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: "TASK999"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Unsupported update fields: id."
    );
});

test("PATCH /api/tasks rejects unsupported task statuses", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "On Hold"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Invalid task status. Allowed values: Pending, In Progress, Completed, Cancelled."
    );
});

test("PATCH /api/tasks rejects unsupported task priorities", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                priority: "Urgent"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Invalid task priority. Allowed values: Low, Medium, High."
    );
});

test("PATCH /api/tasks rejects empty update values", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: "   "
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "title must be a non-empty string."
    );
});

test("PATCH /api/tasks returns 404 for a missing task", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS001/TASK999`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "Completed"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Task not found.");
});

test("PATCH /api/tasks does not update a task belonging to another business", async () => {
    const response = await fetch(
        `${baseUrl}/api/tasks/BUS002/TASK001`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "Completed"
            })
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Task not found.");
});

test("GET /api/sales/:businessId returns sales for that business", async () => {
    const response = await fetch(
        `${baseUrl}/api/sales/BUS001`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.length, 2);
    assert.ok(
        body.every((sale) => sale.businessId === "BUS001")
    );
});

test("GET /api/sales/:businessId returns an empty array when no sales exist", async () => {
    const response = await fetch(
        `${baseUrl}/api/sales/BUS002`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, []);
});

test("GET /api/sales/:businessId/:saleId returns the requested sale", async () => {
    const response = await fetch(
        `${baseUrl}/api/sales/BUS001/SALE005`
    );

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.id, "SALE005");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.productId, "PROD001");
    assert.equal(body.unitPrice, 120);
    assert.equal(body.totalAmount, 120);
});

test("GET /api/sales/:businessId/:saleId returns 404 for a missing sale", async () => {
    const response = await fetch(
        `${baseUrl}/api/sales/BUS001/SALE999`
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Sale not found.");
});

test("GET /api/sales/:businessId/:saleId does not return another business's sale", async () => {
    const response = await fetch(
        `${baseUrl}/api/sales/BUS002/SALE005`
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error, "Sale not found.");
});

test("POST /api/sales rejects a supplied unit price", async () => {
    const invalidSale = {
        id: "SALE_TEST_PRICE",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 1,
        unitPrice: 100,
        paymentMethod: "Card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "unitPrice must not be provided. Sale prices are taken from the product catalogue."
    );
});

test("POST /api/sales rejects unsupported payment methods", async () => {
    const invalidSale = {
        id: "SALE_TEST_CASH",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 1,
        paymentMethod: "Cash"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Unsupported payment method. Only Card payments are accepted."
    );
});

test("POST /api/sales rejects zero quantities", async () => {
    const invalidSale = {
        id: "SALE_TEST_ZERO_QTY",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 0,
        paymentMethod: "Card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Quantity must be a whole number greater than 0."
    );
});

test("POST /api/sales rejects missing required fields", async () => {
    const invalidSale = {
        id: "SALE_TEST_MISSING",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 1
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "paymentMethod is required."
    );
});

test("POST /api/sales rejects sales linked to nonexistent businesses", async () => {
    const invalidSale = {
        id: "SALE_TEST_BUSINESS",
        businessId: "BUS999",
        productId: "PROD001",
        quantity: 1,
        paymentMethod: "Card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(
        body.error,
        "Business associated with this sale does not exist."
    );
});

test("POST /api/sales rejects products belonging to another business", async () => {
    const invalidSale = {
        id: "SALE_TEST_PRODUCT",
        businessId: "BUS002",
        productId: "PROD001",
        quantity: 1,
        paymentMethod: "Card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(
        body.error,
        "Product associated with this sale does not exist."
    );
});

test("POST /api/sales rejects duplicate sale IDs", async () => {
    const invalidSale = {
        id: "SALE005",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 1,
        paymentMethod: "Card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 409);
    assert.equal(body.error, "Sale ID already exists.");
});

test("POST /api/sales rejects sales when stock is insufficient", async () => {
    const invalidSale = {
        id: "SALE_TEST_STOCK",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 100,
        paymentMethod: "Card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(invalidSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        body.error,
        "Insufficient stock available."
    );
});

test("POST /api/sales creates a sale using the catalogue price and updates stock", async () => {
    const newSale = {
        id: "SALE_TEST_001",
        businessId: "BUS001",
        productId: "PROD001",
        quantity: 2,
        paymentMethod: "card"
    };

    const response = await fetch(
        `${baseUrl}/api/sales`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newSale)
        }
    );

    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.id, "SALE_TEST_001");
    assert.equal(body.businessId, "BUS001");
    assert.equal(body.productId, "PROD001");
    assert.equal(body.quantity, 2);
    assert.equal(body.unitPrice, 120);
    assert.equal(body.totalAmount, 240);
    assert.equal(body.paymentMethod, "Card");
    assert.equal(body.currency, "ZAR");
    assert.ok(body.createdAt);
    assert.ok(body.updatedAt);

    const productResponse = await fetch(
        `${baseUrl}/api/products/BUS001/PROD001`
    );

    const updatedProduct = await productResponse.json();

    assert.equal(productResponse.status, 200);
    assert.equal(updatedProduct.stockQuantity, 6);

    const saleResponse = await fetch(
        `${baseUrl}/api/sales/BUS001/SALE_TEST_001`
    );

    const savedSale = await saleResponse.json();

    assert.equal(saleResponse.status, 200);
    assert.equal(savedSale.id, "SALE_TEST_001");
    assert.equal(savedSale.totalAmount, 240);
});