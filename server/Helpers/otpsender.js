const db = require('../config/connection');
const collection = require('../config/collection');
const nodemailer = require('nodemailer'); // Add this line
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
    }
});
const sendMail = (mailOptions) => {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
};

module.exports = {
    userOtpsend: async (email, res) => {
        if (!email) {
            res.json({ error: "Please Enter Your Email" });
            return;
        }

        try {
            const presuer = await db.get().collection(collection.userCollection).findOne({ email: email });
            console.log('2');

            if (presuer) {
                const OTP = Math.floor(100000 + Math.random() * 900000);
                const existEmail = await db.get().collection(collection.otpCollection).findOne({ email: email });
                console.log('3');

                if (existEmail) {
                    const updateData = await db.get().collection(collection.otpCollection).findOneAndUpdate(
                        { _id: existEmail._id },
                        { $set: { otp: OTP } },
                        { returnOriginal: false }
                    );
                    console.log('4');

                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: email,
                        subject: "OTP Validation for TAFCON EVENTS Password Update",
                        text: `Dear User,\n\nThank you for using TAFCON EVENTS. To update your password, please use the following OTP validation code:\n\nOTP: ${OTP}\n\nThis OTP is valid for a limited time.\n\nBest regards,\nThe TAFCON EVENTS Team`
                    };
                    console.log('5');

                    await sendMail(mailOptions);
                    console.log('6');

                } else {
                    userDetails = {
                        email,
                        otp: OTP
                    };
                    const data = await db.get().collection(collection.otpCollection).insertOne(userDetails);

                    const mailOptions = {
                        from: process.env.EMAIL,
                        to: email,
                        subject: "Sending Email For Otp Validation",
                        text: `OTP:- ${OTP}`
                    };

                    await sendMail(mailOptions);
                    console.log('6');
                }

                // Move the response outside the if-else blocks
                res.status(200).json({ message: "Email sent Successfully" });

            } else {
                res.status(400).json({ error: "This User Not Exist In our Db" });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal server error" });
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
