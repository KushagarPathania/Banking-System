const transactionModel=require('../models/transaction.model');
const ledgerModel=require('../models/ledger.model');
const emailService=require('../services/email.service');
const accountModel=require('../models/account.model');
const mongoose=require('mongoose');


async function createTransaction(req,res){
    const {fromAccount,toAccount,amount,idempotencyKey}=req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"Missing required fields for creating transaction"
        })
    }

    const fromUserAccount=await accountModel.findOne({
        _id:fromAccount,

    })

    const toUserAccount=await accountModel.findOne({
        _id:toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({
            message:"From account or to account not found"
        })
    }

    const isTransactionAlreadyExists=await transactionModel.findOne({
        idempotencyKey:idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status==="COMPLETED"){
            return res.status(200).json({
                message:"Transaction already completed",
                transaction:isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status==="PENDING"){
            return res.status(200).json({
                message:"Transaction is already in progress",
                transaction:isTransactionAlreadyExists
            })
        }
        if(isTransactionAlreadyExists.status==="FAILED"){
            return res.status(500).json({
                message:"Transaction has already failed, please try again"
            })
        }
        if(isTransactionAlreadyExists.status==="REVERSED"){
            return res.status(500).json({
                message:"Transaction has already been reversed, please try again"
            })
        }

    }

    if(fromUserAccount.status!=="ACTIVE" || toUserAccount.status!=="ACTIVE"){
        return res.status(400).json({
            message:"From account and to account should be active for creating transaction"
        })
    }

    const balance=await fromUserAccount.getBalance();

    if(balance<amount){
        return res.status(400).json({
            message:"Insufficient balance in from account"
        })
    }

    const session=await transactionModel.startSession();
    session.startTransaction();

    const transaction= await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    },{session})

    const debitLedger=await ledgerModel.create({
        account:fromAccount,
        type:"DEBIT",
        amount:amount,
        transaction:transaction._id
    },{session})

    const creditLedger=await ledgerModel.create({
        account:toAccount,
        type:"CREDIT",
        amount:amount,
        transaction:transaction._id
    },{session})

    transaction.status="COMPLETED";
    await transaction.save({session});

    await session.commitTransaction();
    session.endSession();

    await emailService.sendTransactionEmail(req.user.email,req.user.name,amount,toAccount);
    return res.status(201).json({
        message:"Transaction created successfully",
        transaction:transaction
    })

    
}

async function createInitialFundsTransaction(req,res){
    const {toAccount,amount,idempotencyKey}=req.body;
    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"Missing required fields for creating initial funds transaction"
        })
    }

    const toUserAccount=await accountModel.findOne({
        _id:toAccount,

    })

    if(!toUserAccount){
        return res.status(400).json({
            message:"To account not found"
        })
    }

    const fromUserAccount=await accountModel.findOne({
        
        user:req.user._id
    })

    if(!fromUserAccount){
        return res.status(400).json({
            message:"System user account not found"
        })
    }

    const session= await mongoose.startSession();
    session.startTransaction();


    

    const transaction= new transactionModel({
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    })
    
    const debitLedgerEntry=await ledgerModel.create([{
        account:fromUserAccount._id,
        amount:amount,
        type:"DEBIT",
        transaction:transaction._id
    }],{session})
    
    const creditLedgerEntry=await ledgerModel.create([{
        account:toAccount,
        amount:amount,
        type:"CREDIT",
        transaction:transaction._id
    }],{session})

    transaction.status="SUCCESS";
    await transaction.save({session});

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
        message:"Initial funds transaction created successfully",
        transaction:transaction
    })




}

module.exports={
    createTransaction,createInitialFundsTransaction
}