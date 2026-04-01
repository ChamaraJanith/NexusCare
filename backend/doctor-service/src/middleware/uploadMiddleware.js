// Re-export the multer upload instance from the centralized config
// so existing route imports (`from "../middleware/uploadMiddleware.js"`) keep working.
export { upload } from "../config/multer.js";
