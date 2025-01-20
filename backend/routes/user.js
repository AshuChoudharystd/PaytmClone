const express = require('express');

const userRouter = express.Router();
const zod = require('zod');
const jwt = require('jsonwebtoken');
const {User,Account} = require('../db.js');
const {authMiddleware,JWT_SECRET} = require('../middleware.js')

const signupSchema = zod.object({
    username: zod.string().email(),
    firstName: zod.string(),
    lastName: zod.string(),
    password: zod.string()
})

const signinSchema = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

const updateSchema = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional()
})


userRouter.post('/signup',async (res,req)=>{

    //getting user inputs
    const body = req.body;
    const {success} = signupSchema.safeParse(body);
    // if entered incorrectly 
    if(!success){
        return res.json({
            message: "Email already taken / Incorrect inputs"
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
        firstName: body.firstName,
        lastName: body.lastName,
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

userRouter.post('/signin',async (res, req)=>{
    const body = req.body;
    const {success} = signinSchema.safeParse(body);
    // if entered incorrectly
    if(!success){
        return res.json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    // finding if it is a existing user
    const user = User.findOne({
        username: body.username,
        password: body.password
    })

    if(user._id){
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET)
        return res.json({
            message: "User signed-in successfully",
            token: token
        })
    }

    return res.json({
        message: "Error while logging in"
    })
})

// user info update route

userRouter.put('/',authMiddleware,async (res, req)=>{
    const body = req.body;
    const {success} = updateSchema.safeParse(body);
    // if entered incorrectly
    if(!success){
        return res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne(body,{
        id: req.userId
    })

    return res.json({
        message: "Updated successfully"
    })
})

// searching user in mongodb using their firstname and lastname

userRouter.get('/bulk',async (res, req)=>{
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    return res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = {
    userRouter
};