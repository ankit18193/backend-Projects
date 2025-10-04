// import express from 'express';
import connectDB from './db/index.js';
import dotenv from "dotenv";
import { app } from "./app.js"

dotenv.config({
  path:'./env'
})

connectDB()
.then(() => {
  app.listen(process.env.PORT || 5000, () => {
    console.log(`server connection successfull at ${process.env.PORT}`);
  });
})
.catch((error) => {
  console.error('server connection failed', error);
});

