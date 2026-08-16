const express=require('express');
const cors = require('cors');
const authRouter=require('./routes/auth.route');
const cookieParser=require("cookie-parser");
const accountRouter=require('./routes/account.route');
const transactionRouter=require('./routes/transaction.route');



const app= express();

app.use(cors({                              
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.use('/api/auth',authRouter);
app.use('/api/accounts',accountRouter);
app.use('/api/transactions',transactionRouter);



module.exports=app;