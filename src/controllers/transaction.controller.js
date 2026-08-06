const transactionModel=require('../models/transaction.model');
const ledgerModel=require('../models/ledger.model');
const emailService=require('../services/email.service');
const accountModel=require('../models/account.model');


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

module.exports={
    createTransaction
}