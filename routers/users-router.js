import { Router } from "express";
import database from '../database.js';

const router = Router();
// Query builders ---------------------------
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );

const buildUsersCreateQuery = (record) => {
    let table ='users';
    let mutableFields = [ 'userID','firstName','lastName','userTypeID'];
    const sql = `INSERT INTO ${table} ` + buildSetFields(mutableFields);   
    return { sql, data: record };
        };
const buildUsersReadQuery = (id,variant) => {
    let sql ='';
    let table1 ='users';
    let table = 'users left JOIN  userType ON users.userTypeID=userType.userTypeID';
    let fields = ['userID','firstName', 'lastName','users.userTypeID'];
    let extendedFields = ['users.userTypeID','userID','firstName', 'lastName','userTypeName','CONCAT(firstName," ",lastName) AS FullName'];
switch (variant){
    case 'type':
        sql = ` SELECT ${extendedFields} FROM ${table} WHERE userType.userTypeID=:ID `;
    break;
    default:
        sql = ` SELECT ${fields} from ${table1} `;
        if (id) sql +=  ` WHERE userID=:ID `;
    }
    return { sql, data: { ID: id } };
        };
const buildUsersDeleteQuery = (id) => {
    let table ='users';
    const sql = `DELETE FROM ${table}  WHERE userID=:userID`;   
    return { sql, data: {userID: id}};
        };
const buildUsersUpdateQuery = (record,id) => {
    let table ='users';
    let mutableFields = ['userID','firstName','lastName','userTypeID'];
    const sql = `UPDATE ${table} ` + buildSetFields(mutableFields) + ` WHERE userID=:userID`;   
    return { sql, data: { ...record, userID: id }}        
        };
 
// Data Accessors ---------------------------
const createUser = async (createQuery) => 
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
const deleteUsers = async (deleteQuery) => {
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
const updateUsers = async (updateQuery) => 
{
try
{
const  status  = await database.query( updateQuery.sql, updateQuery.data );

if ( status[0].affectedRows === 0 )
    return { isSuccess: false, result: null, message: "Failed to update record: no rows affected" };

const readQuery = buildUsersReadQuery(updateQuery.data.classScheduleID, null);

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
// Controllers ------------------------------
const getUsersController = async (req, res, variant) => {
    const id = req.params.id; 
    //Access Data 
    const query = buildUsersReadQuery(id,variant);
    const {isSuccess, result, message} = await read(query,id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
const postUsersController = async (req, res) => {
    const record = req.body;
    // Access data 
        const query = buildUsersCreateQuery(record);
        const { isSuccess, result, message: accessorMessage } = await createUser(query);
        if (!isSuccess) return res.status(404).json({ message: accessorMessage });     
    // Response to request
        res.status(201).json(result);
        };
const deleteUsersController = async (req, res) => {
    // Validate request
        const id = req.params.id;
    // Access data 
        const query = buildUsersDeleteQuery(id);
        const { isSuccess, result, message: accessorMessage } = await deleteUsers(query);
        if (!isSuccess) return res.status(400).json({ message: accessorMessage });     
    // Response to request
        res.status(200).json({ message: accessorMessage });
        };
const putUsersController = async (req, res) => { 
    const id = req.params.id;
    const record = req.body;

    // Access data
    const query = buildUsersUpdateQuery(record,id);
    const { isSuccess, result, message: accessorMessage } = await updateUsers(query);
    if (!isSuccess) return res.status(404).json({ message: accessorMessage });

    // Response to request
    res.status(201).json(result);
        };
// Endpoints --------------------------------
router.get('/',                   (req,res) => getUsersController(req,res,null));
router.get('/:id',               (req,res) => getUsersController(req,res,null));
router.get('/type/:id',          (req,res) => getUsersController(req,res,'type'));

router.post('/',  postUsersController);
router.delete('/:id', deleteUsersController);
router.put('/:id', putUsersController);
export default router;