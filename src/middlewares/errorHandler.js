export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

export function errorHandler(err, req, res, next) {
    console.error("Server Error:", err);

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate record conflict.",
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
}