const userModel=require("../models/user.model");
const jwt=require("jsonwebtoken");
const emialService=require("../services/email.service")



async function userRegisteration(req,res){
    const {email,password,name}=req.body;

    const isExists=await userModel.findOne({
        email:email
    })

    if(isExists){
        return res.status(422).json({
            message:"User already exists with this email",
            status:"failed"

        })
    }

    const user=await userModel.create({
        email,password,name
    })

    const token=jwt.sign({userID:user._id},process.env.JWT_SECRET)
    res.cookie("token",token)

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

    await emialService.sendRegistrationEmail(user.email,user.name);

}

async function loginUser(req,res){
    const {email,password}=req.body;
    const user=await userModel.findOne({
        email
    }).select("+password")
    if(!user){
        return res.status(401).json({
            message:"Email or password is invalid"
        })
    }

    const isValidPassword=await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message:"Email or password is invalid"
        })
    }

    const token=jwt.sign({userID:user._id},process.env.JWT_SECRET)
    res.cookie("token",token)

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })

    
   

}

module.exports={userRegisteration,loginUser};