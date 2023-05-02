import { Router } from "express";
import database from '../database.js';

const router = Router();
// Query builders ---------------------------
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );
    const buildClassRoomCreateQuery = (record) => {
        let table ='classRoom';
        let mutableFields = [ 'classRoomID','classRoomNumber'];
        const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);   
        return { sql, data: record };
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
const createClassRoom = async (createQuery) => 
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
// Controllers ------------------------------
const postClassRoomController = async (req, res) => {
    const record = req.body;
    // Access data 
        const query = buildClassRoomCreateQuery(record);
        console.log('Query:', query);
        
        const { isSuccess, result, message: accessorMessage } = await createClassRoom(query);
        if (!isSuccess) return res.status(404).json({ message: accessorMessage });     
    // Response to request
        res.status(201).json(result);
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
// Endpoints --------------------------------
router.get('/',                    (req, res) => getClassRoomController(req, res, null));
router.get('/:id',                (req, res) => getClassRoomController(req, res, null));
router.post('/',                   (req, res) => postClassRoomController(req, res, null));
export default router;