var express = require('express');
const userHelper = require('../Helpers/userHelper');
var router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const adminHelper = require('../Helpers/adminHelper');
const otpsender = require('../Helpers/otpsender');
const path = require('path');
require('dotenv').config();
const jwtsecret = process.env.JWTSECRET
const mongoUrl = process.env.mongoUrl;
const { MongoClient } = require('mongodb');

//middlewire
const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ error: 'Token is missing' });
    } else {
        jwt.verify(token, jwtsecret, (err, decoded) => {
            if (err) {
                return res.json({ error: 'Error with token' });
            } else {
                if (
                    decoded.role === 'A1' ||
                    decoded.role === 'A2' ||
                    decoded.role === 'A3' ||
                    decoded.role === 'A4' ||
                    decoded.role === 'A5' ||

                    decoded.role === 'S-A1' ||
                    decoded.role === 'S-A2' ||
                    decoded.role === 'S-A3' ||
                    decoded.role === 'S-A3' ||
                    decoded.role === 'main-boy' ||
                    decoded.role === 'captain' ||
                    decoded.role === 'admin'
                ) {
                    next();
                } else {
                    return res.json({ error: 'Not user' });
                }

            }
        });
    }
};
const verifyAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ error: 'Token is missing' })
    } else {
        jwt.verify(token, jwtsecret, (err, decoded) => {
            if (err) {
                return res.json({ error: 'Error with token' });
            } else {
                if (decoded.role === 'admin') {
                    next();
                } else {
                    return res.json({ error: 'Not admin' });
                }
            }
        });
    }
};
const verifyService = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ error: 'Token is missing' });
    } else {
        jwt.verify(token, jwtsecret, (err, decoded) => {
            if (err) {
                return res.json({ error: 'Error with token' });
            } else {
                if (decoded.role === 'admin' ||
                    decoded.role === 'main-boy' ||
                    decoded.role === 'captain') {
                    next();
                } else {
                    return res.json({ error: 'Not admin' });
                }
            }
        });
    }
};


//routers users

router.post('/register', async (req, res) => {
    try {
        const id = await userHelper.register(req.body);

        // Convert base64 strings to buffers
        const imageBuffer = Buffer.from(req.body.image.split(',')[1], 'base64');
        const proofBuffer = Buffer.from(req.body.proof.split(',')[1], 'base64');

        // Save the buffers to MongoDB
        const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        const db = client.db('tafcon');

        // Save image
        const imageCollection = db.collection('images');
        await imageCollection.insertOne({ userId: id, data: imageBuffer, image: 'profile' });

        // Save proof
        const proofCollection = db.collection('proofs');
        await proofCollection.insertOne({ userId: id, data: proofBuffer, image: 'proof' });

        client.close();

        res.json({ status: 'success' });
    } catch (err) {
        console.error('Error in registration:', err);
        res.status(500).json({ error: 'An error occurred during registration' });
    }
});



router.get('/all-images-proofs', async (req, res) => {
    try {
        const combinedArray = await userHelper.findImage();
        const encodedImages = combinedArray.map(item => ({
            userId: item.userId,
            data: item.data.toString('base64'),
            image: item.image
        }));
        res.json({ success: true, data: encodedImages });
    } catch (error) {
        console.error("Error in route '/all-images-proofs':", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});
router.post('/login', (req, res) => {
    userHelper.doLogin(req.body)
        .then((response) => {
            if (response.status) {
                jwt.sign({
                    number: response.user.number,
                    role: response.user.role,
                    name: response.user.name,
                    id: response.user._id
                }, jwtsecret,
                    {},
                    (err, token) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: 'Error generating token' });
                        }
                        res.cookie('token', token, { sameSite: 'none', secure: true });

                        return res.status(200).json({ status: 'success', token, role: response.user.role, id: response.user._id });
                    }
                );


            } else {
                res.json({ status: 'error', message: response.error });
            }
        })
        .catch((error) => {
            res.status(500).json({ status: 'error', message: 'An error occurred during login.' });
        });
});






router.get('/profile', (req, res) => {

    try {
        const token = req.cookies.token;
        if (token) {
            jwt.verify(token, jwtsecret, {}, (err, userData) => {
                if (err) {
                    console.error('JWT Verification Error:', err);
                    res.status(401).json('Invalid token');
                } else {
                    res.json({
                        userData
                    });
                }
            });
        } else {
            res.status(401).json('No token');
        }
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json('Internal Server Error');
    }
});



router.post('/sendotp', (req, res) => {
    const { email } = req.body;

    otpsender.userOtpsend(email, res)
        .then((result) => {
            res.json({ status: 'ok' });
        })
        .catch((error) => {
            console.error('Error sending OTP:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        });
});
router.post('/enterotp', async (req, res) => {
    try {
        const { otp, email } = req.body;
        await otpsender.userOtpCheck(otp, email);
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Error in /enterotp endpoint:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});
router.post('/changepass', async (req, res) => {
    try {
        const { password, email } = req.body;
        const result = await otpsender.userPasswordchange(password, email);
        console.log(result);
        res.json(result);
    } catch (error) {
        console.error('Error in /changepass endpoint:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});
router.get('/', (req, res) => {
    res.send('something went wrong')
})
router.get('/home', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        try {

            res.json({ id: decoded.id, role: decoded.role });
        } catch (error) {
            console.log(error);
        }
    })

})
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logout successful' });
});

router.get('/profile-image', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        if (err) {
            // Handle the error, e.g., return an error response
            return res.status(500).json({ status: 'error', message: 'Token verification failed' });
        }

        // Generate the image URL based on the user's ID
        const userId = decoded.id;
        const imageExtensions = ['jpg', 'png'];

        // Find the first available image format
        let imageUrl = '';
        for (const extension of imageExtensions) {
            const imagePath = path.join(__dirname, '..', 'public', 'Profile-pictures', `${userId}.${extension}`);
            if (fs.existsSync(imagePath)) {
                // imageUrl = `public/Profile-pictures/${userId}.${extension}`;
                imageUrl = `${userId}.${extension}`;
                break;
            }
        }
        if (imageUrl) {
            res.json({ status: 'success', imageUrl: imageUrl });
        } else {
            res.json({ status: 'success', imageUrl: '' });
        }
    });
});

router.get('/getevents', verifyUser, adminHelper.getAllEventsUser)

router.post('/confirmbooking/:proId', verifyUser, (req, res) => {
    const proId = req.params.proId;
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        const UserId = decoded.id;
        userHelper.Booking(proId, UserId).then((response) => {
            if (response === 'success') {
                res.json({ status: 'success' });
            } else if (response === 'already booked') {
                res.json({ status: 'already booked' });
            }
        });
    });
});
router.post('/confirmbookingMain/:proId', verifyUser, (req, res) => {
    const proId = req.params.proId;
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        const UserId = decoded.id;
        userHelper.BookingMain(proId, UserId).then((response) => {
            if (response === 'success') {
                res.json({ status: 'success' });
            } else if (response === 'already booked') {
                res.json({ status: 'already booked' });
            }
        });
    });
});
router.post('/confirmbookingSuper/:proId', verifyUser, (req, res) => {
    const proId = req.params.proId;
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        const UserId = decoded.id;
        userHelper.BookingSuper(proId, UserId).then((response) => {
            if (response === 'success') {
                res.json({ status: 'success' });
            } else if (response === 'already booked') {
                res.json({ status: 'already booked' });
            }
        });
    });
});

router.get('/bookedevents', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        const UserId = decoded.id;

        userHelper.getEventList(UserId).then((response) => {

            res.json({ status: 'success', response });
        });
    })
})
router.get('/viewSalary', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const UserId = decoded.id;
        try {
            const details = await userHelper.getSalaryDetails(UserId);
            res.json({ status: 'success', details });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve salary details' });
        }
    });
});
router.get('/viewFine', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const UserId = decoded.id;
        try {
            const details = await userHelper.getFineDetails(UserId);
            res.json({ status: 'success', details });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve salary details' });
        }
    });
});
router.get('/ot', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const UserId = decoded.id;
        try {
            const details = await userHelper.getOtDetails(UserId);
            res.json({ status: 'success', details });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve salary details' });
        }
    });
});
router.get('/te', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const UserId = decoded.id;
        try {
            const details = await userHelper.getTeDetails(UserId);
            res.json({ status: 'success', details });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve salary details' });
        }
    });
});
router.get('/withdrawf', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const UserId = decoded.id;
        try {
            const details = await userHelper.getWithdrawDetails(UserId);
            res.json({ status: 'success', details });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve salary details' });
        }
    });
})
router.get('/amount', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const UserId = decoded.id;
        try {
            const fine = await userHelper.getFine(UserId);
            const income = await userHelper.getIncome(UserId)
            const withdraw = await userHelper.getWithdraw(UserId)
            const balance = income.total + withdraw.totalWithdraw + fine.totalFine;
            res.json({ status: 'success', fine, income, withdraw, balance });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve salary details' });
        }
    });
})
router.get('/total', verifyUser, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        const role = decoded.role;
        const userId = decoded.id;
        try {
            res.json({ role });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve role details' });
        }
    });
})
router.get('/notification', verifyUser, (req, res) => {
    userHelper.notification().then((notification) => {

        res.json({ notification })
    })
})
router.get('/isBooked', (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        if (err) {
            console.error("JWT verification error:", err);
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const userId = decoded.id;
        try {
            userHelper.isBooked(userId).then((bookedEvents) => {
                // Use bookedEvents as needed, for example, send it as a JSON response
                res.json({ status: 'success', bookedEvents });
            }).catch((error) => {
                console.error("Error:", error);
                res.status(500).json({ status: 'error', message: 'Failed to retrieve booked events' });
            });
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ status: 'error', message: 'Failed to retrieve role details' });
        }
    });
});








//admin routers

router.get('/viewevents', (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        if (err) {
            return res.json({ error: 'Error with token' });
        } else {
            if (decoded.role === 'admin') {
                res.status(200).json({ status: "success" })
            } else {
                res.json({ error: 'Not admin' });
            }
        }
    });
});

router.get('/viewevent', adminHelper.getAllEvents);
router.delete('/admin/delete-event/:eventId', verifyAdmin, (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        if (err) {
            return res.json({ error: 'Error with token' });
        } else {
            if (decoded.role === 'admin') {
                const eventId = req.params.eventId;
                adminHelper.deleteEvent(eventId)
                    .then((response) => {
                        res.json({ status: 'ok' });
                    })
            } else {
                res.json({ error: 'Not admin' });
            }
        }
    });

});
router.delete('/notification/:eventId', verifyAdmin, (req, res) => {
    const eventId = req.params.eventId;
    adminHelper.deleteNotification(eventId)
        .then((response) => {
            res.json({ status: 'ok' });
        })
});
router.delete('/deleteverifiy/:userId', verifyAdmin, (req, res) => {
    const userId = req.params.userId;
    adminHelper.deleteverifiy(userId)

    res.json({ status: 'ok' });
});
router.delete('/deleteemp/:userId', verifyAdmin, (req, res) => {
    const userId = req.params.userId;
    adminHelper.deleteemp(userId)

    res.json({ status: 'ok' });
});
router.get('/editbutton/:eventId', async (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, async (err, decoded) => {
        if (err) {
            return res.json({ error: 'Error with token' });
        } else {
            if (decoded.role === 'admin') {
                let event = await adminHelper.getEventDetails(req.params.eventId)
                if (event) {
                    res.json({ event, status: 'ok' })
                }
            } else {
                res.json({ error: 'Not admin' });
            }
        }
    });

})
router.post('/editbutton/:eventId', (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        if (err) {
            return res.json({ error: 'Error with token' });
        } else {
            if (decoded.role === 'admin') {
                adminHelper.updateEvent(req.params.eventId, req.body).then((response) => {
                    res.json({ status: 'updated' })
                })
            } else {
                res.json({ error: 'Not admin' });
            }
        }
    });

})
router.post('/addevent', async (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token, jwtsecret, (err, decoded) => {
        if (err) {
            return res.json({ error: 'Error with token' });
        } else {
            if (decoded.role === 'admin') {
                try {

                    adminHelper.addEvent(req.body);
                    res.json({ status: 'ok' });
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ error: 'An error occurred while adding the event' });
                }
            } else {
                res.json({ error: 'Not admin' });
            }
        }
    });


});
router.get('/viewuser', verifyAdmin, adminHelper.getEmpInfo)
router.get('/edituser/:userId', verifyAdmin, async (req, res) => {

    let user = await adminHelper.getUserDetails(req.params.userId)
    if (user) {
        res.json({ user, status: 'ok' })
    }
});
router.post('/edituser/:userId', verifyAdmin, (req, res) => {

    adminHelper.updateUser(req.params.userId, req.body).then((response) => {
        res.json({ status: 'updated' })

    })
})
router.get('/captain/:proId', verifyService, (req, res) => {
    const proId = req.params.proId;
    adminHelper.viewCaptains(proId)
        .then((userData) => {
            res.json({ users: userData });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        });
});
router.get('/confirmedpdf/:proId', verifyService, (req, res) => {
    const proId = req.params.proId;
    adminHelper.confirmedPdf(proId)
        .then((userData) => {
            res.json({ users: userData });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        });
});
router.get('/isfine/:proId', verifyService, (req, res) => {
    const proId = req.params.proId;
    adminHelper.isFine(proId).then((response) => {

        res.json({
            usersWithFine: response.usersWithFines,
            Onsite: response.Onsite,
            OtGiven: response.OtGiven,
            TeGiven: response.TeGiven
        });
    });
});

router.post('/fine/:userId', verifyService, async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await adminHelper.addFine(userId, req.body);
        res.json({ status: 'ok', message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the fine', message: error });
    }
});
router.get('/viewfine/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;
    let fine = await adminHelper.viewFine(userId, eventId)

    res.json({ fine })
})
router.get('/viewot/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;
    let ot = await adminHelper.viewOt(userId, eventId)

    res.json({ ot })
})
router.get('/viewsalary/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;
    let salary = await adminHelper.viewSalary(userId, eventId)

    res.json({ salary })
})
router.get('/viewte/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;
    let te = await adminHelper.viewTe(userId, eventId)

    res.json({ te })
})
router.post('/viewfine/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;

    let fine = await adminHelper.updateFine(userId, eventId, req.body)

    res.json({ fine })
})
router.post('/viewsalary/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;

    let salary = await adminHelper.updateSalary(userId, eventId, req.body)

    res.json({ salary })
})
router.post('/viewot/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;

    let ot = await adminHelper.updateOt(userId, eventId, req.body)

    res.json({ ot })
})
router.post('/viewte/:userId', verifyService, async (req, res) => {
    userId = req.params.userId
    const eventId = req.query.eventId;

    let te = await adminHelper.updateTe(userId, eventId, req.body)

    res.json({ te })
})
router.post('/te/:userId', verifyService, async (req, res) => {
    try {
        const userId = req.params.userId
        const eventId = req.query.eventId;
        const result = await adminHelper.addTe(userId, eventId, req.body);
        res.json({ status: 'ok', message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the fine', message: error });
    }
});
router.post('/ot/:userId', verifyService, async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await adminHelper.addOt(userId, req.body);
        res.json({ status: 'ok', message: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the fine', message: error });
    }
});
router.post('/salary/:userId', verifyService, async (req, res) => {
    const userId = req.params.userId;
    const eventId = req.body.eventId; // Access the event ID from the request body
    try {
        const result = await adminHelper.addSalary(eventId, userId); // Pass the event ID to the addSalary function
        res.json({ status: 'success', result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error });
    }
});
router.post('/captain/:userId', verifyService, async (req, res) => {
    const userId = req.params.userId;
    const eventId = req.body.eventId;

    try {
        const result = await adminHelper.addCaptain(eventId, userId);

        if (result === "user already a captain") {
            res.json({ status: 'alreadyCaptain', message: 'User is already a captain.' });
        } else {
            res.json({ status: 'success', result });
        }
    } catch (error) {
        res.status(400).json({ status: 'error', message: error });
    }
});

router.post('/withdraw', verifyAdmin, (req, res) => {
    adminHelper.withDraw(req.body).then((response) => {
        if (response) {

            res.json({ status: "success" })
        }
    })
})
router.get('/withdraw', verifyAdmin, adminHelper.viewWithraw)
router.delete('/delete-withdraw/:id', verifyAdmin, (req, res) => {
    const withId = req.params.id;
    adminHelper.deleteWithdraw(withId).then((response) => {
        res.json({ status: 'ok' });
    })
})
router.post('/verify/:id', verifyAdmin, (req, res) => {
    userId = req.params.id;

    userHelper.doVerify(userId)
    res.json('success');
})
router.get('/viewverifyuser', verifyAdmin, adminHelper.getEmpveriInfo)
router.get('/calendar', verifyAdmin, adminHelper.getcalander)
router.post('/notification', verifyAdmin, (req, res) => {
    adminHelper.notification(req.body).then((response) => {
        res.json({ status: 'ok' })
    })
})
router.post('/adddateevent', verifyAdmin, (req, res) => {
    adminHelper.addDateEvent(req.body)
        .then((response) => {
            res.json({ status: 'ok' });
        })
        .catch((error) => {
            console.error('Error adding date event:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        });
});
module.exports = router;