import { application } from 'express';
import connectDB from './db/index.js';
import { configDotenv } from 'dotenv';

configDotenv()
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`server connection successfull at ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('server connection failed', error);
  });

connectDB();
