import { Router } from "express";
import database from '../database.js';

const router = Router();
// Query builders ---------------------------
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );

const buildAttendanceCreateQuery = (record) => {
        let table ='attendanceTable';
        let mutableFields = ['attendanceTableID','userID','classScheduleID'];
        const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);   
        return { sql, data: record };
            };
const buildAttendanceReadQuery = (id,variant) => {
        let sql = '';
        let table1 = 'attendanceTable';
        let fields1 = ['attendanceTableID', 'attendanceTable.userID', 'classScheduleID'];
        let table ='((attendanceTable LEFT JOIN users a ON attendanceTable.userID = a.userID) LEFT JOIN classSchedule b ON attendanceTable.classScheduleID = b.classScheduleID)';
        let table3 = '(((((attendanceTable LEFT JOIN users a ON attendanceTable.userID = a.userID)LEFT JOIN classSchedule b ON attendanceTable.classScheduleID = b.classScheduleID)left JOIN modules m ON b.modulesID = m.modulesID )left JOIN classTypes ON b.classTypesID = classTypes.classTypesID)left JOIN classRoom on b.classRoomID = classRoom.classRoomID)';
        let fields = ['attendanceTableID','a.userID','attendanceTable.classScheduleID','firstName','lastName','date','time','moduleName','classTypesNames','classRoomNumber'];
        switch (variant){
            case 'student':
                sql = `SELECT ${fields} FROM ${table3} WHERE attendanceTable.userID = :ID`;
                break;
            default:
                sql = `SELECT ${fields} FROM ${table3}`;
                if(id) sql += ` WHERE attendanceTableID = :ID`;
        }
        return { sql, data: { ID: id } };
            };
const buildAttendanceDeleteQuery = (id) => {
    let table ='attendanceTable';
    const sql = `DELETE FROM ${table}  WHERE attendanceTableID=:attendanceTableID`;   
    return { sql, data: {attendanceTableID: id}};
        };
// Data Accessors ---------------------------
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
const deleteAttendance = async (deleteQuery) => {
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
// Controllers ------------------------------
const getAttendanceController = async (req, res, variant) => {
    const id = req.params.id; // Undefined in case of api users
    console.log('IT worked')
    // Access data
    const query = buildAttendanceReadQuery(id, variant);
    const {isSuccess, result, message} = await read(query, id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
    res.status(200).json(result);
        };
const postAttendanceController = async (req, res) => {
    const record = req.body;

    // Access data 
        const query = buildAttendanceCreateQuery(record);
        console.log('Query:', query);
        
        const { isSuccess, result, message: accessorMessage } = await createAttendance(query);
        if (!isSuccess) return res.status(404).json({ message: accessorMessage });     
    // Response to request
        res.status(201).json(result);
        };
const deleteAttendanceController = async (req, res) => {
    // Validate request
        const id = req.params.id;
    // Access data 
        const query = buildAttendanceDeleteQuery(id);
        const { isSuccess, result, message: accessorMessage } = await deleteAttendance(query);
        if (!isSuccess) return res.status(400).json({ message: accessorMessage });     
    // Response to request
        res.status(200).json({ message: accessorMessage });
        };
// Endpoints --------------------------------
router.get('/',              (req, res) => getAttendanceController (req,res,null));
router.get('/:id',          (req, res) => getAttendanceController (req,res,null));
router.get('/student/:id',  (req, res) => getAttendanceController (req,res,'student'));

router.post('/',  postAttendanceController);
router.delete ('/:id',  deleteAttendanceController);

export default router;