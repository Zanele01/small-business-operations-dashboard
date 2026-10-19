function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    let message;

    if (err.type === "entity.parse.failed") {
        message = "Invalid JSON request body.";
    } else if (statusCode >= 500) {
        message = "An unexpected server error occurred.";
    } else {
        message = err.message || "An unexpected error occurred.";
    }

    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        error: message
    });
}

module.exports = errorHandler;