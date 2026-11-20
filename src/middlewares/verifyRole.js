export function verifyStudent(req, res, next) {
    if (!req.user || req.user.role !== "student") {
        return res.status(403).json({ message: "Forbidden: Student access required." });
    }
    next();
}

export function verifyTutor(req, res, next) {
    if (!req.user || req.user.role !== "tutor") {
        return res.status(403).json({ message: "Forbidden: Tutor access required." });
    }
    next();
}

export function verifyAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access required." });
    }
    next();
}