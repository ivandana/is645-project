// Add packages
require("dotenv").config();
// Add database package and connection string
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const getRecordCount = () => {
    sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};

const getCustomerId = async (cus_id) => {
    params = [cus_id];
    sql = "SELECT * FROM customer WHERE cusid = $1";
    console.log("sql: " + sql);
    console.log("params: " + params);
    try {
        const result = await pool.query(sql, params);
        return {
            msg: "success",
            totRecords: result.rows
        };
    } catch (err) {
        return {
            msg: `Error: ${err.message}`
        };
    }
};

const updateCustomerId = async (customer) => {
    // Will accept either a product array or product object
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };

    // debugging purpose
    console.log("params is: ", params);
    const sql = "UPDATE customer SET cusfname = $2, cuslname = $3, cusstate = $4, cussalesYTD = $5, cussalesPrev=$6 WHERE (cusid = $1)";

    try {
        const res = await pool.query(sql, params);
        return {
            trans: "success",
            msg: `Customer id ${params[0]} successfully updated`
        };
    } catch (err) {
        return {
            trans: "fail",
            msg: `Error on insert of customer id ${params[0]}.  ${err.message}`
        };
    }
};

const deleteCustomerId = (customerId) => {
    // Will accept either a product array or product object
    params = [customerId];
    sql = "DELETE FROM customer WHERE cusid = $1";
    console.log("sql: " + sql);
    console.log("params: " + params);
    return pool.query(sql, params)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};

//insert customer
const insertCustomer = async (customer) => {
    // Will accept either a product array or product object
    if (customer instanceof Array) {
        params = customer;
    } else {
        params = Object.values(customer);
    };
    // debugging purpose
    //console.log("params is: ", params);
    const sql = `INSERT INTO customer (cusid, cusfname, cuslname, cusstate, cussalesYTD, cussalesPrev)
                 VALUES ($1, $2, $3, $4, $5, $6)`;
    try {
        await pool.query(sql, params);
        return {
            trans: "success",
            msg: `Customer id ${params[0]} successfully inserted`
        };
    } catch (err) {
        return {
            msg: `Error: ${err.message}`
        };
    }
};

const insertMultipleCustomers = async(customer) => {
    if(!customer || Object.keys(customer).length === 0) {
            message = "Error: Import file not uploaded";
            return result.send(message);
    };
    const buffer = customer.buffer;
    const lines = buffer.toString().split(/\r?\n/);
    var numFailed = 0;
    var numSuccess = 0;
    var errorMessage = "";
    for (line of lines.slice(0, -1)) {
        customerDetails = line.split(",");
        console.log(customerDetails)
        if (line)
        result = await insertCustomer(customerDetails);
        if (result.trans === "success") {
            numSuccess++;
        } else {
            numFailed++;
            errorMessage += `Customer ID: ${customerDetails[0]} - ${result.msg},`;
        };
    };
    const totRecs = await getRecordCount();
    var insertResult ={
        numSuccess: numSuccess,
        numFailed: numFailed,
        errorMessage: errorMessage,
        totRecs: totRecs.totRecords
        }
    return {message: "success", result: insertResult};
};

const retrieveExportedRecords = async () => {
    const sql = "SELECT * FROM customer ORDER BY cusid";
    try{
        result = await pool.query(sql, []);
        var output = "";
        result.rows.forEach(customer => {
            output += `${customer.cusid},${customer.cusfname},${customer.cuslname},${customer.cusstate},${customer.cussalesytd.replace(/[$,]+/g,"")},${customer.cussalesprev.replace(/[$,]+/g,"")}\r\n`;
        });
        return {message: "success", result: output};
    } catch (err) {
        return err.message;
    };
};

const findCustomer = (customer) => {
    // Will build query based on data provided from the form
    //  Use parameters to avoid sql injection

    // Declare variables
    var i = 1;
    params = [];
    sql = "SELECT * FROM customer WHERE true";

    // Check data provided and build query as necessary
    if (customer.cusId !== "") {
        params.push(parseInt(customer.cusId));
        sql += ` AND cusId = $${i}`;
        i++;
    };
    if (customer.cusFname !== "") {
        params.push(`${customer.cusFname}%`);
        sql += ` AND UPPER(cusFname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusLname !== "") {
        params.push(`${customer.cusLname}%`);
        sql += ` AND UPPER(cusLname) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusState !== "") {
        params.push(`${customer.cusState}%`);
        sql += ` AND UPPER(cusState) LIKE UPPER($${i})`;
        i++;
    };
    if (customer.cusSalesytd !== "") {
        params.push(parseFloat(customer.cusSalesytd));
        sql += ` AND cusSalesYTD >= $${i}`;
        i++;
    };
    if (customer.cusSalesPrev !== "") {
        params.push(parseFloat(customer.cusSalesPrev));
        sql += ` AND cusSalesYTD >= $${i}`;
        i++;
    };
    
    sql += ` ORDER BY cusId`;
    // for debugging
     console.log("sql: " + sql);
     console.log("params: " + params);

    return pool.query(sql, params)
        .then(result => {
            return { 
                trans: "success",
                result: result.rows
            }
        })
        .catch(err => {
            return {
                trans: "Error",
                result: `Error: ${err.message}`
            }
        });
};


module.exports.getRecordCount = getRecordCount;
module.exports.insertCustomer = insertCustomer;
module.exports.updateCustomerId = updateCustomerId;
module.exports.deleteCustomerId = deleteCustomerId;
module.exports.findCustomer = findCustomer;
module.exports.getCustomerId = getCustomerId;
module.exports.insertMultipleCustomers = insertMultipleCustomers;
module.exports.retrieveExportedRecords = retrieveExportedRecords;