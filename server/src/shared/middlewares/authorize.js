import ResponseFormatter from "../utils/responseFormatter.js";

const authorize = (allowedRoles = []) => (req,res,next) => {

   try {
        if (!req.user || !req.user.role) {
            return res.status(403).json(ResponseFormatter.error("Forbidden", 403))
        }

        // skip role check if allowedRoles is empty, meaning any authenticated user can access
        if (allowedRoles.length === 0) {
            next()
        };

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(ResponseFormatter.error("Insufficient permissions", 403))
        }

        next()
    } catch (error) {
        return res.status(403).json(ResponseFormatter.error("Forbidden", 403))
    }
}
export default authorize;