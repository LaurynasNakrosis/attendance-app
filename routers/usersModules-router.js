import { Router } from "express";
import database from '../database.js';

const router = Router();
// Query builders ---------------------------
const buildSetFields = (fields) => fields.reduce((setSQL, field, index) => 
    setSQL + `${field}=:${field}` + ((index===fields.length-1) ? '' : ', '), 'SET ' );
    const buildUsersModulesSelectSql = (id,variant) => {
        let sql ='';
    
        let table = 'usersModules left join users on usersModules.userModulesID=users.userID';
        let extendedTable = `usersModules left join users on usersModules.userID=users.userID`; 
        let fields = ['userModulesID','usersModules.userID','modulesID'];
        let extendedFields = ['userModulesID','users.userTypeID','CONCAT(firstName," ",lastName) AS FullName'];
    switch (variant){
        case 'users':
            sql = ` SELECT ${extendedFields} FROM ${extendedTable} WHERE users.userID=${id} `;
        break;
        default:
            sql = ` SELECT ${fields} from ${table} `;
            if (id) sql +=  ` WHERE userModulesID=${id} `;
        }
        return sql;
    }
// Data Accessors ---------------------------
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
const getUsersModulesController = async (req, res, variant) => {
    const id = req.params.id; 
    //Validate request
    //Access Data 
    const sql = buildUsersModulesSelectSql(id,variant);
    const {isSuccess, result, message} = await read1(sql);
    if (!isSuccess) return res.status(404).json({message});
    // Response to request
        res.status(200).json(result);
};
// Endpoints --------------------------------
router.get('/',            (req, res) => getUsersModulesController(req, res, null));
router.get('/:id',        (req, res) => getUsersModulesController(req, res, null));
router.get('/users/:id',  (req, res) => getUsersModulesController(req, res, 'users'));
export default router;