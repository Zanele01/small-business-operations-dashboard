const express = require("express");
const cors = require("cors");

const businessRoutes = require("./src/routes/businessRoutes");
const productRoutes = require("./src/routes/productRoutes");
const errorHandler = require("./src/middleware/errorHandler");
const saleRoutes = require("./src/routes/saleRoutes");
const expenseRoutes = require("./src/routes/expenseRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Small Business Dashboard API running"
    });
});

app.use("/api/business", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});