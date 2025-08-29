import { Router } from "express";
import { registerUser , loginUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegisterValidator } from "../validators/index.js";


const router = Router();

router.route("/register").post(userRegisterValidator() , validate , registerUser);
router.route("/login").post(loginUser);

export default router;