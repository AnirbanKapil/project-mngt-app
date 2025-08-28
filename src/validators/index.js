import { body } from "express-validator";


const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLowercase()
            .withMessage("username must be in lower case")
            .isLength({min : 3})
            .withMessage("username name must be atleast 2 characters"),
        body("password")
            .trim()
            .notEmpty()  
            .withMessage("password is required"),
        body("fullName")
            .optional()
            .trim()           
    ]
};


export { userRegisterValidator };