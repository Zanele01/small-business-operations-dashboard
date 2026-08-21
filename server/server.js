const express = require("express");
const cors = require("cors");

const businessRoutes = require("./src/routes/businessRoutes");
const errorHandler = require("./src/middleware/errorHandler");

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

app.use(errorHandler);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});