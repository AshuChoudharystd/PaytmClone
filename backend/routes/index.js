const express = require('express')
const {userRouter} = require('./user.js')
const {accountRouter} = require('./account.js')

const router = express.Router();

//user Routes
router.use('/user',userRouter);
//account Routes
router.use('/account', accountRouter);

module.exports=router;
