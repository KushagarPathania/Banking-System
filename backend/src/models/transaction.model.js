const mongoose=require("mongoose");


const transactionSchema=new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true,"From account is required for creating transaction"],
        index:true
    },
    toAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:[true,"To account is required for creating transaction"],
        index:true
    },
    status:{
        type:String,
        enum:{
            values:["PENDING","SUCCESS","FAILED","REVERSED"],
            message:"Status should be either PENDING, SUCCESS, FAILED or REVERSED"
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating transaction"],
        min:[0,"Amount should be greater than or equal to 0"]
    },
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required for creating transaction"],
        unique:[true,"Idempotency key already exists"],
        index:true

    }
},{
    timestamps:true
})

const transactionModel=mongoose.model("Transaction",transactionSchema);

module.exports=transactionModel;