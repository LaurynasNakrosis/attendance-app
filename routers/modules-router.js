import { Router } from "express";
import database from '../database.js';

const router = Router();
// Query builders ---------------------------
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );
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

const read1 = async (selectSql) => {
try {
const [result] = await database.query(selectSql);
return (result.length === 0)
? {isSuccess: false, result: null, message: 'No record(s) found'}
: {isSuccess: true, result: result, message: 'Record(s) successfully recovered'};
}
catch (error) {
return { isSuccess: false, result: null, message: `Failed to execute query: ${error.message}`};
}
};

// Controllers ------------------------------
const getModulesController = async ( req,res, variant) => {
    const id = req.params.id;
// Access data 
    const query = buildModulesReadQuery(id,variant);
    const {isSuccess, result, message} = await read1(query,id);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
        };
// Endpoints --------------------------------
router.get('/',                 (req, res) => getModulesController(req, res, null));
router.get('/:id',             (req, res) => getModulesController(req, res, null));

export default router;