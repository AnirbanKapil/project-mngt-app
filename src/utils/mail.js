import Mailgen from "mailgen";



const emailVerificationMailgenContent = (username , verificationUrl) => {
    return {
        body : {
            name : username,
            intro : "Welcome to our platform! We're excited to have you on board.",
            action : {
                instructions : "To get started, please verify your email address by clicking the button below.",
                button : {
                    color : "#22BC66",
                    text : "Verify your email",
                    link : verificationUrl
                }
            },
            outro : "If you did not create an account, no further action is required."
        }
    }
}


const forgotPasswordMailgenContent = (username , passwordVerificationUrl) => {
    return {
        body : {
            name : username,
            intro : "We received a request to reset your password.",
            action : {
                instructions : "To reset your password, please click the button below.",
                button : {
                    color : "#22BC66",
                    text : "Reset your password",
                    link : passwordVerificationUrl
                }
            },
            outro : "If you did not request a password reset, no further action is required."
        }
    }
}