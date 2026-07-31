const userModel=require("../models/user.model");

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

}

module.exports={userRegisteration};