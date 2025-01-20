const express = require('express');

const userRouter = express.Router();
const zod = require('zod');
const jwt = require('jsonwebtoken');
const {User,Account} = require('../db.js');
const {authMiddleware,JWT_SECRET} = require('../middleware.js')

const signupSchema = zod.object({
    username: zod.string().email(),
    firstname: zod.string(),
    lastname: zod.string(),
    password: zod.string()
})

const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

const updateSchema = zod.object({
    password: zod.string().optional(),
    firstname: zod.string().optional(),
    lastname: zod.string().optional()
})


userRouter.post('/signup',async (req,res)=>{

    //getting user inputs
    const body = req.body;
    const {success} = signupSchema.safeParse(body);
    // if entered incorrectly 
    if(!success){
        return res.json({
            message: "Incorrect inputs"
        })
    }

    // finding if it is a existing user 
    const user = User.findOne({
        username: body.username
    })

    if(user._id){
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    
    // if new user then create a new-user db entry
    const dbUser = await User.create({
        username: body.username,
        firstname: body.firstname,
        lastname: body.lastname,
        password: body.password
    })

    // initializing random balance for the user
    const userId = dbUser._id;
    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })

    // user token to keep them signed-in
    const token = jwt.sign({
        userId: dbUser._id
    }, JWT_SECRET)

    return res.json({
        message: "User created successfully",
        token:token
    })
})

userRouter.post('/signin', async (req, res) => {
    const body = req.body;
    
    // Validate inputs using zod (assuming you're using zod for schema validation)
    const { success } = signinSchema.safeParse(body);

    // If inputs are incorrect
    if (!success) {
        return res.status(400).json({
            message: "Invalid inputs provided"
        });
    }

    try {
        // Finding the user based on the provided username and password (no bcrypt comparison, direct password match)
        const user = await User.findOne({
            username: body.username,
            password: body.password // Directly matching plaintext password (not recommended for production)
        });

        // If user is not found
        if (!user) {
            return res.status(404).json({
                message: "Invalid username or password"
            });
        }

        // Generate a JWT token for the authenticated user
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        return res.json({
            message: "User signed-in successfully",
            token: token
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error while logging in",
            error: error.message
        });
    }
});


// user info update route

userRouter.put('/', authMiddleware, async (req, res) => {
    const body = req.body;

    // Validate the body using zod (assuming you're using zod for validation)
    const { success } = updateSchema.safeParse(body);

    // If validation fails
    if (!success) {
        return res.status(411).json({
            message: "Error while updating information"
        });
    }

    try {
        // Ensure req.userId exists and update user information based on userId
        const result = await User.updateOne(
            { _id: req.userId },  // Match by userId from authMiddleware
            { $set: body }        // Update the fields from body
        );

        if (result.nModified === 0) {
            return res.status(404).json({
                message: "User not found or no changes made"
            });
        }

        return res.json({
            message: "Updated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error while updating information",
            error: error.message
        });
    }
});


userRouter.get('/bulk', async (req, res) => {
    const filter = req.query.filter || "";

    try {
        // Searching users with either firstName or lastName matching the filter (case-insensitive)
        const users = await User.find({
            $or: [
                { firstname: { "$regex": filter, "$options": "i" } },  // Case-insensitive search
                { lastname: { "$regex": filter, "$options": "i" } }
            ]
        });

        return res.json({
            users: users.map(user => ({
                username: user.username,
                firstName: user.firstname,  // Ensure consistent naming with DB schema
                lastName: user.lastname,
                _id: user._id
            }))
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error while fetching users",
            error: error.message
        });
    }
});


module.exports = {
    userRouter
};