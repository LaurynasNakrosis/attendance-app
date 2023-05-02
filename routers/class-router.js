import { Router } from "express";
import database from '../database.js';
const router = Router();

// Query builders ---------------------------
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );

const buildClassUpdateQuery = (record,id) => {
    let table ='classSchedule';
    let mutableFields = ['classRoomID','modulesID','classTypesID','date','time'];
    const sql = `UPDATE ${table} ` + buildSetFields(mutableFields) + ` WHERE classScheduleID=:classScheduleID`;   
    return { sql, data: { ...record, classScheduleID: id }}        
};
const buildClassDeleteQuery = (id) => {
    let table ='classSchedule';
    const sql = `DELETE FROM ${table}  WHERE classScheduleID=:classScheduleID`;   
    return { sql, data: {classScheduleID: id}};
        };
const buildClassCreateQuery = (record) => {
    let table ='classSchedule';
    let mutableFields = ['classRoomID','modulesID','classTypesID','date','time'];
    const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);   
    return { sql, data: record };
};
const buildClassReadQuery = (id,variant) => {
    let sql = '';
    let table ='classSchedule';
    let tables ='((((((classSchedule INNER JOIN modules a ON classSchedule.modulesID = a.modulesID )INNER JOIN usersModules ON a.modulesID = usersModules.modulesID)INNER JOIN classTypes ON classSchedule.classTypesID = classTypes.classTypesID) INNER JOIN classRoom on classSchedule.classRoomID = classRoom.classRoomID)INNER JOIN users u ON usersModules.userID = u.userID)INNER JOIN userType ut ON u.userTypeID = ut.userTypeID)';
    let field = ['classScheduleID','classRoomID','modulesID','classTypesID','date','time'];
    let fields = ['classScheduleID','classRoom.classRoomID','classTypes.classTypesID','a.moduleName','classTypes.classTypesNames','a.modulesID','classRoomNumber','date','time'];
    switch (variant) {
        case 'user':
            sql = `SELECT ${fields} FROM ${tables} WHERE u.userID = :ID `;    
            break;
        case 'userDate':
            sql = `SELECT ${fields} FROM ${tables} WHERE u.userID = :ID and date="2022-10-03"`;    
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
// Data Accessors ---------------------------
const read = async (readQuery) => {
    try {
        const [result] = await database.query(readQuery.sql, readQuery.data);
        return (result.length === 0)
        ? {isSuccess: false, result: null, message: 'No record(s) found'}
        : {isSuccess: true, result: result, message: 'Record(s) successfully recovered'};
    }
    catch (error) {
        return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}`};
    }
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
// Controllers ------------------------------
const getClassController = async ( req, res, variant) => {
    console.log(req)
    const id = req.params.id;
// Access data 
    const query = buildClassReadQuery(id,variant);
    const {isSuccess, result, message} = await read(query,id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
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
// Endpoints --------------------------------
router.get('/',                   (req,res) => getClassController(req,res,null));
router.get('/:id',                (req,res) => getClassController(req,res,null));
router.get('/user/:id',           (req,res) => getClassController(req,res,'user'));
router.get('/userDate/:id',       (req,res) => getClassController(req,res,'userDate'));
router.get('/lecturer/:id',       (req,res) => getClassController(req,res,'lecturer'));
router.post('/',                  postClassController);
router.put('/:id',                putClassController);
router.delete('/:id',             deleteClassController);

export default router;