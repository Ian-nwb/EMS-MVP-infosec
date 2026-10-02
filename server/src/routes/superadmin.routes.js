import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/rbac.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  unlockUser,
  createUserSchema,
  updateUserSchema,
} from "../controllers/superadmin.controller.js";

const router = express.Router();

// All routes require superadmin
router.use(authenticate, authorizeRoles("superadmin"));

router.get("/users", listUsers);
router.post("/users", validate({ body: createUserSchema }), createUser);
router.put("/users/:id", validate({ body: updateUserSchema }), updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/unlock", unlockUser);

export default router;
