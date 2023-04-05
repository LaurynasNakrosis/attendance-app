import react from "react"
import express from  'express';
import database from './database.js';
import cors from 'cors';
import Moment from 'moment'; 

//Express app configuration-------------------
const app = new express();

//Configure middleware------------------------
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let formatDate = Moment().format("'YYYY-MM-DD'");

//Helpers
// Field build helper
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );

//Read helper
const read = async (query) => {
    try {
        const [result] = await database.query(query.sql, query.data);
        return (result.length === 0)
        ? {isSuccess: false, result: null, message: 'No record(s) found'}
        : {isSuccess: true, result: result, message: 'Record(s) successfully recovered'};
    }
    catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}`};
    }
        };
        
const updateClass = async (updateQuery) => 
{
    try
    {
        const  status  = await database.query( updateQuery.sql, updateQuery.data );

        if ( status[0].affectedRows === 0 )
            return { isSuccess: false, result: null, message: "Failed to update record: no rows affected" };

        const readQuery = buildClassReadQuery(updateQuery.data.classScheduleID, null);

        const{ isSuccess, result, message } = await read(readQuery); 

        return isSuccess
            ? {isSuccess: true, result: result, message:  'Record(s) Successfully recovered'}
            : {isSuccess: false, result: null, message: `Failed to recover the inserted record: ${message}`};
    }
    catch (error)
    {
        return {isSuccess: false, result: null, message: `Failed to execute the query: ${error.message}`}; 
    }  
        };
     
//Get controllers and build sql controllers

const usersModulesController = async (req, res) => {
    const id = req.params.id; 
    //Build SQL 
    const table = 'usersModules';
    const whereField = 'userModulesID';
    const fields = ['userModulesID','userID','modulesID','firstName','lastName'];
    const extendedTable = `${table} left JOIN  userType ON users.userTypeID=userType.userTypeID`; 
    const extendedFields = `${fields},CONCAT(firstName," ",lastName) AS FullName` ;
    let sql = `SELECT ${extendedFields} FROM ${extendedTable} `;
    if (id) sql +=  `WHERE ${whereField}=${id}`;
    // execute query
    let isSuccess = false;
    let message = "";
    let result = null;
    try {
        [result] = await database.query(sql);
        if (result.length === 0) message = 'No record(s)'; 
        else{
            isSuccess = true;
            message ='record(s) succesfully recovered';
            }
        }
        catch(error) {  
            message = `Failed to execute query: ${error.message}`;
        } 
    // Responses
    isSuccess
    ? res.status(200).json(result)
    : res.status(400).json({message});
};


const usersController = async (req, res) => {
    const id = req.params.id; 
    //Build SQL 
    const table = 'users';
    const whereField = 'userID';
    const fields = ['userID','firstName', 'lastName','userTypeName'];
    const extendedTable = `${table} left JOIN  userType ON users.userTypeID=userType.userTypeID`; 
    const extendedFields = `${fields},CONCAT(firstName," ",lastName) AS FullName` ;
    let sql = `SELECT ${extendedFields} FROM ${extendedTable} `;
    if (id) sql +=  `WHERE ${whereField}=${id}`;
    // execute query
    let isSuccess = false;
    let message = "";
    let result = null;
    try {
        [result] = await database.query(sql);
        if (result.length === 0) message = 'No record(s)'; 
        else{
            isSuccess = true;
            message ='record(s) succesfully recovered';
            }
        }
        catch(error) {  
            message = `Failed to execute query: ${error.message}`;
        } 
    // Responses
    isSuccess
    ? res.status(200).json(result)
    : res.status(400).json({message});
};
const usersTypeController = async (req, res) => {
    const id = req.params.id; 
    //Build SQL 
    const table = 'users';
    const whereField = 'users.userTypeID'
    const fields = ['userID','firstName', 'lastName','userTypeName'];
    const extendedTable = `${table} left JOIN  userType a ON users.userTypeID=a.userTypeID`; 
    const extendedFields = `${fields},CONCAT(firstName," ",lastName) AS FullName` ;
    const sql = `SELECT ${extendedFields} FROM ${extendedTable} WHERE ${whereField}=${id}`;
    // execute query
    let isSuccess = false;
    let message = "";
    let result = null;
    try {
        [result] = await database.query(sql);
        if (result.length === 0) message = 'No record(s)'; 
        else{
            isSuccess = true;
            message ='record(s) succesfully recovered';
            }
        }
        catch(error) {  
            message = `Failed to execute query: ${error.message}`;
        } 
    // Responses
    isSuccess
    ? res.status(200).json(result)
    : res.status(400).json({message});
    console.log(sql);
    console.log(result);
};


const getClassController = async ( req, res, variant) => {
    const id = req.params.id;
// Access data 
    const query = buildClassReadQuery(id,variant);
    const {isSuccess, result, message} = await read(query,id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
const buildClassReadQuery = (id,variant) => {
    let sql = '';
    let table ='classSchedule';
    let tables ='((((((classSchedule INNER JOIN modules a ON classSchedule.modulesID = a.modulesID )INNER JOIN usersModules ON a.modulesID = usersModules.modulesID)INNER JOIN classTypes ON classSchedule.classTypesID = classTypes.classTypesID) INNER JOIN classRoom on classSchedule.classRoomID = classRoom.classRoomID)INNER JOIN users u ON usersModules.userID = u.userID)INNER JOIN userType ut ON u.userTypeID = ut.userTypeID)';
    let field = ['classScheduleID','classRoomID','modulesID','classTypesID','date','time'];
    let fields = ['a.moduleName','classTypesNames','a.modulesID','classRoomNumber','date','time'];
    switch (variant) {
        case 'user':
            sql = `SELECT ${fields} FROM ${tables} WHERE u.userID = :ID `;    
            break;
        case 'lecturer':
            sql = `SELECT ${fields} FROM ${tables} WHERE u.userID = :ID AND userTypeName = 'Lecturer'`;
            break;
        default:
            sql = `SELECT ${field} FROM ${table}`;
            if (id) sql += ` WHERE classScheduleID = :ID` ;
        }
    return { sql, data: { ID: id } };
        };


const getAttendanceController = async (req, res, variant) => {
    const id = req.params.id; // Undefined in case of api users
    // Access data
    const query = buildAttendanceReadQuery(id, variant);
    const {isSuccess, result, message} = await read(query, id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
    res.status(200).json(result);
        };
const buildAttendanceReadQuery = (id,variant) => {
    let sql = '';
    let table ='((attendanceTable LEFT JOIN users a ON attendanceTable.userID = a.userID) LEFT JOIN classSchedule b ON attendanceTable.classScheduleID = b.classScheduleID)';
    let fields = ['attendanceTableID','attendanceTable.userID','attendanceTable.classScheduleID'];
    switch (variant){
        case 'student':
            sql = `SELECT ${fields} FROM ${table} WHERE attendanceTable.userID = :ID`;
            break;
        default:
            sql = `SELECT ${fields} FROM ${table}`;
            if(id) sql += ` WHERE attendanceTableID = :ID`;
    }
    return { sql, data: { ID: id } };
        };


const getClassRoomController = async ( req,res, variant) => {
    const id = req.params.id;
// Access data 
    const query = buildClassRoomReadQuery(id,variant);
    const {isSuccess, result, message} = await read(query,id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
const buildClassRoomReadQuery = (id,variant) => {
    let sql = '';
    let table ='classRoom';
    let field = ['classRoomID','classRoomNumber'];
    switch (variant) {
        default:
            sql = `SELECT ${field} FROM ${table}`;
            if (id) sql += ` WHERE classRoomID = :ID` ;
        }
        return { sql, data: { ID: id } };
        };


const getModulesController = async ( req,res, variant) => {
    const id = req.params.id;
// Access data 
    const query = buildModulesReadQuery(id,variant);
    const {isSuccess, result, message} = await read(query,id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
const buildModulesReadQuery = (id,variant) => {
    let sql = '';
    let table ='modules';
    let field = ['modulesID','moduleName'];
    switch (variant) {
        default:
            sql = `SELECT ${field} FROM ${table}`;
            if (id) sql += ` WHERE modulesID = :ID` ;
        }
        return { sql, data: { ID: id } };
        };


const getTypesController = async ( req,res, variant) => {
    const id = req.params.id;
// Access data 
    const query = buildTypesReadQuery(id,variant);
    const {isSuccess, result, message} = await read(query, id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
const buildTypesReadQuery = (id,variant) => {
    let sql = '';
    let table ='classTypes';
    let field = ['classTypesID','classTypesNames'];
    switch (variant) {
        default:
            sql = `SELECT ${field} FROM ${table}`;
            if (id) sql += ` WHERE classTypesID = :ID` ;
        }
        return { sql, data: { ID: id } };
        };


//Put controllers
const putClassController = async (req, res) => { 
        const id = req.params.id;
        const record = req.body;

        // Access data
        const query = buildClassUpdateQuery(record,id);
        const { isSuccess, result, message: accessorMessage } = await updateClass(query);
        if (!isSuccess) return res.status(404).json({ message: accessorMessage });

        // Response to request
        res.status(201).json(result);
        };
const buildClassUpdateQuery = (record,id) => {
    let table ='classSchedule';
    let mutableFields = ['classRoomID','modulesID','classTypesID','date','time'];
    const sql = `UPDATE ${table} ` + buildSetFields(mutableFields) + ` WHERE classScheduleID=:classScheduleID`;   
    return { sql, data: { ...record, classScheduleID: id }}        
};

//Delete controllers


const deleteClassController = async (req, res) => {
    // Validate request
        const id = req.params.id;
    // Access data 
        const query = buildClassDeleteQuery(id);
        const { isSuccess, result, message: accessorMessage } = await deleteClass(query);
        if (!isSuccess) return res.status(400).json({ message: accessorMessage });     
    // Response to request
        res.status(200).json({ message: accessorMessage });
        };
const buildClassDeleteQuery = (id) => {
    let table ='classSchedule';
    const sql = `DELETE FROM ${table}  WHERE classScheduleID=:classScheduleID`;   
    return { sql, data: {classScheduleID: id}};
        };

const deleteClass = async (deleteQuery) => {
    try {
        const  status  = await database.query(deleteQuery.sql, deleteQuery.data);
        return status[0].affectedRows ===0
        ? {isSuccess: false, result: null, message: `Failed to delete record : ${id}`}        
            : {isSuccess: true, result: null, message:  'Record successfully deleted'};
    }
    catch (error) {
        return {isSuccess: false, result: null, message: `Failed to execute the query: ${error.message}`}; 
    }  
        };


//Post controllers
const postAttendanceController = async (req, res) => {
    const record = req.body;
    // Access data 
        const query = buildAttendanceCreateQuery(record);
        const { isSuccess, result, message: accessorMessage } = await createAttendance(query);
        if (!isSuccess) return res.status(404).json({ message: accessorMessage });     
    // Response to request
        res.status(201).json(result);
        };
const buildAttendanceCreateQuery = (record) => {
    let table ='attendanceTable';
    let mutableFields = ['userID','classScheduleID'];
    const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);   
    return { sql, data: record };
        };
const createAttendance = async (createQuery) => 
{
    try
    {
        const  status  = await database.query(createQuery.sql, createQuery.data);
        const readQuery = buildAttendanceReadQuery(status[0].insertId,null);
        const{ isSuccess, result, message } = await read(readQuery); 
        return isSuccess
            ? {isSuccess: true, result: result, message:  'Record(s) Successfully recovered'}
            : {isSuccess: false, result: null, message: `Failed to recover the inserted record: ${message}`};
    }
    catch (error)
    {
        return {isSuccess: false, result: null, message: `Failed to execute the query: ${error.message}`}; 
    }  
        };

const postClassController = async (req, res) => {
    const record = req.body;
    //validate request
    // Access data 
        const query = buildClassCreateQuery(record);
        const { isSuccess, result, message: accessorMessage } = await createClass(query);
        if (!isSuccess) return res.status(400).json({ message: accessorMessage }); 
    // Response to request
        res.status(201).json(result);
        };
const buildClassCreateQuery = (record) => {
            let table ='classSchedule';
            let mutableFields = ['classRoomID','modulesID','classTypesID','date','time'];
            const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);   
            return { sql, data: record };
        };    
const createClass = async (createQuery) => 
        {
            try
            {
                const  status  = await database.query(createQuery.sql, createQuery.data);
                const readQuery = buildClassReadQuery(status[0].insertId,null);
                const{ isSuccess, result, message } = await read(readQuery); 
                return isSuccess
                    ? {isSuccess: true, result: result, message:  'Record(s) Successfully recovered'}
                    : {isSuccess: false, result: null, message: `Failed to recover the inserted record: ${message}`};
            }
            catch (error)
            {
                return {isSuccess: false, result: null, message: `Failed to execute the query: ${error.message}`}; 
            }  
        };


//Endpoints---------------------------------
// users
    app.get('/api/users',                       usersController);
    app.get('/api/users/:id',                   usersController);
    app.get('/api/users/type/:id',              usersTypeController);

//Classes
    app.get('/api/Class',                   (req,res) => getClassController(req,res,null));
    app.get('/api/Class/:id',               (req,res) => getClassController(req,res,null));
    app.get('/api/Class/user/:id',          (req,res) => getClassController(req,res,'user'));
    app.get('/api/Class/lecturer/:id',      (req,res) => getClassController(req,res,'lecturer'));

    app.post('/api/Class',  postClassController);
    app.put('/api/Class/:id',  putClassController);
    app.delete('/api/Class/:id',  deleteClassController);

//Student Attendance
    app.get('/api/attendance',              (req, res) => getAttendanceController (req,res,null));
    app.get('/api/attendance/:id',          (req, res) => getAttendanceController (req,res,null));
    app.get('/api/attendance/student/:id',  (req, res) => getAttendanceController (req,res,'student'));

    app.post('/api/attendance',  postAttendanceController);

// Modules
    app.get('/api/room',                    (req, res) => getClassRoomController(req, res, null));
    app.get('/api/room/:id',                (req, res) => getClassRoomController(req, res, null));

// usersModules
    app.get('/api/usersModules',                       usersModulesController);
    app.get('/api/usersModules/:id',                   usersModulesController);
    app.get('/api/usersModules/user:id',               usersModulesUserController);
    app.get('/api/usersModules/leader:id',             usersModulesLeaderController);

// classRooms
    app.get('/api/modules',                 (req, res) => getModulesController(req, res, null));
    app.get('/api/modules/:id',             (req, res) => getModulesController(req, res, null));

// classTypes
    app.get('/api/types',                   (req, res) => getTypesController(req, res, null));
    app.get('/api/types/:id',               (req, res) => getTypesController(req, res, null));

// Start server---------------------------------
    const PORT = process.env.PORT || 5003;
    app.listen(PORT,() => console.log(`Server started on port ${PORT}`)); 
  

