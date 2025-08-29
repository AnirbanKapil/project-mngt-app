import { Router } from "express";
import { registerUser , loginUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userLoginValidator, userRegisterValidator } from "../validators/index.js";


const router = Router();

router.route("/register").post(userRegisterValidator() , validate , registerUser);
router.route("/login").post(userLoginValidator() , validate , loginUser);

export default router;