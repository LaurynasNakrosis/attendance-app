//import react from "react"
import express from  'express';
import database from './database.js';
import cors from 'cors';
import AttendanceRouter from './routers/attendance-router.js';
import UsersRouter from './routers/users-router.js';
import ClassRouter from './routers/class-router.js';
import RoomRouter from './routers/room-router.js';
import UsersModulesRouter from './routers/usersModules-router.js';
import ModulesRouter from './routers/modules-router.js';
import ClassTypesRouter from'./routers/classTypes-router.js';
import UserTypeRouter from './routers/userType-router.js';

import Moment from 'moment'; 

//Express app configuration-------------------
const app = new express();

//Configure middleware------------------------
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let formatDate = Moment().format("'YYYY-MM-DD'");

//Endpoints---------------------------------
app.use('/api/class', ClassRouter)
app.use('/api/users', UsersRouter);
app.use('/api/attendance', AttendanceRouter);
app.use('/api/room', RoomRouter);
app.use('/api/usersmodules', UsersModulesRouter);
app.use('/api/modules', ModulesRouter)
app.use('/api/classTypes',ClassTypesRouter);
app.use('/api/userType', UserTypeRouter);

// Start server---------------------------------
    const PORT = process.env.PORT || 5003;
    app.listen(PORT,() => console.log(`Server started on port ${PORT}`)); 
  

