const express=require('express');
const authController=require('../controllers/auth.controller');

const router=express.Router();


router.post("/register",authController.userRegisteration);
router.post("/login",authController.loginUser);
router.post("/logout",authController.userLogout);

module.exports=router;