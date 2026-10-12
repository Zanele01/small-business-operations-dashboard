function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    const message =
        statusCode >= 500
            ? "An unexpected server error occurred."
            : err.message || "An unexpected error occurred.";

    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        error: message
    });
}

module.exports = errorHandler;