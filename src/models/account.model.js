const mongoose=require('mongoose');

const accountSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"User is required for creating account"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["ACTIVE","FROZEN","CLOSED"],
            message:"Status should be either ACTIVE,FROZEN or CLOSED"
        },
        default:"ACTIVE"
    },
    currency:{
        type:String,
        required:[true,"Currency is required for creating account"],
        default:'INR'
    },

},{
    timestamps:true
})

accountSchema.index({user:1,status:1});

const accountModel=mongoose.model("Account",accountSchema);

module.exports=accountModel;
