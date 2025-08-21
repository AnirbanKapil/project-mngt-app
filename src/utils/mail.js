import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen(
        {
            theme : "default",
            product : {
                name : "Task Manager",
                link : "https://taskmanagerlink.com"
            }
        }
    )

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)

    const emailHtml = mailGenerator.generate(options.mailgenContent)


    const transporter = nodemailer.createTransport(
        {
            host : process.env.MAILTRAP_SMTP_HOST,
            port : process.env.MAILTRAP_SMTP_PORT,
            auth : {
                user : process.env.MAILTRAP_SMTP_USER,
                pass : process.env.MAILTRAP_SMTP_PASS
            } 
        }
    );

    const mail = {
        from : "mail.taskmanager@example.com",
        to : options.email,
        subject : options.subject,
        text : emailTextual,
        html : emailHtml
    };

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email service failed siliently.Make sure to provide mailtrap credentials");
        console.error("error-",error);
    }
};


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

export {emailVerificationMailgenContent , forgotPasswordMailgenContent , sendEmail}