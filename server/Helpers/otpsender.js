const db = require('../config/connection');
const collection = require('../config/collection');
const nodemailer = require('nodemailer');
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
});

module.exports = {
    userOtpsend: async (email) => {
        if (!email) {
            return { status: 400, json: { error: "Please Enter Your Email" } };
        }

        try {
            const presuer = await db.get().collection(collection.userCollection).findOne({ email: email });

            if (presuer) {
                const OTP = Math.floor(100000 + Math.random() * 900000);
                const existEmail = await db.get().collection(collection.otpCollection).findOne({ email: email });

                if (existEmail) {
                    await db.get().collection(collection.otpCollection).findOneAndUpdate(
                        { _id: existEmail._id },
                        { $set: { otp: OTP } },
                        { returnOriginal: false }
                    );

                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: email,
                        subject: "OTP Validation for TAFCON EVENTS Password Update",
                        text: `Dear User,\n\nThank you for using TAFCON EVENTS. To update your password, please use the following OTP validation code:\n\nOTP: ${OTP}\n\nThis OTP is valid for a limited time.\n\nBest regards,\nThe TAFCON EVENTS Team`
                    };

                    await transporter.sendMail(mailOptions);

                    return { status: 200, json: { message: "Email sent Successfully" } };

                } else {
                    const userDetails = {
                        email,
                        otp: OTP
                    };
                    await db.get().collection(collection.otpCollection).insertOne(userDetails);

                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: email,
                        subject: "Sending Email For Otp Validation",
                        text: `OTP:- ${OTP}`
                    };

                    await transporter.sendMail(mailOptions);

                    return { status: 200, json: { message: "Email sent Successfully" } };
                }

            } else {
                return { status: 400, json: { error: "This User Not Exist In our Db" } };
            }
        } catch (error) {
            console.error(error);
            return { status: 500, json: { error: "Internal server error" } };
        }
    },


    userOtpCheck: (otp, email) => {
        return new Promise(async (resolve, reject) => {
            try {
                const verify = await db.get().collection(collection.otpCollection).findOne({ email: email });
                if (verify) {
                    const checkotp = await db.get().collection(collection.otpCollection).findOne({ otp: parseInt(otp) });
                    if (checkotp) {
                        resolve();
                    } else {
                        reject({ status: 'error', message: 'Invalid OTP' });
                    }
                } else {
                    reject({ status: 'error', message: 'Email not found' });
                }
            } catch (error) {
                console.error('Error finding email or OTP:', error);
                reject({ status: 'error', message: 'Error finding email or OTP', error });
            }
        });
    },
    userPasswordchange: async (password, email) => {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await db
                .get()
                .collection(collection.userCollection)
                .findOneAndUpdate(
                    { email: email },
                    { $set: { password: hashedPassword } },
                    { returnDocument: 'after' }
                );

            if (result) {
                return { status: 'ok' };
            } else {
                return { status: 'error', message: 'Error updating password' };
            }
        } catch (error) {
            return { status: 'error', message: 'Error updating password', error: error };
        }
    },


}
