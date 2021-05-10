// Required modules 
const express = require("express");
const app = express();
const dblib = require("./dblib.js");

const multer = require("multer");
const upload = multer();

// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Setup EJS
app.set("view engine", "ejs");

// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

// Application folders
app.use(express.static("public"));

// Start listener
const listener=app.listen(process.env.PORT,()=>{
    console.log(`Your app is listening on port ${listener.address().port}`);
    console.log(`Go to: http://localhost:${listener.address().port}`);
});

// Setup routes
app.get("/", (req, res) => {
    //res.send("Root resource - Up and running!")
    res.render("index");
});

app.get("/customer", async (req, res) => {
    // Omitted validation check
    const totRecs = await dblib.getRecordCount();
    //Empty custom er
    const cust = {
        cusId: "",
        cusFname: "",
        cusLname: "",
        cusState: "",
        cusSalesYTD: "",
        cusSalesPrev: ""
    };
    res.render("customer", {
        type: "get",
        totRecs: totRecs.totRecords,
        cust: cust
    });
});


app.post("/customer", async (req, res) => {
    // Omitted validation check
    //  Can get this from the page rather than using another DB call.
    //  Add it as a hidden form value.
    const totRecs = await dblib.getRecordCount();

    console.log("POST customer, req.body us: ", req.body);

    dblib.findCustomer(req.body)
        .then(result => {
            console.log("result from findCustomer is: ", result);
            res.render("customer", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                cust: req.body,
                model: JSON.stringify(req.body)
            })
        })
        .catch(err => {
            res.render("customer", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                cust: req.body,
                model: JSON.stringify(req.body)
            });
        });
});

app.get("/create", (req, res) => {
    res.render("create", { type: "get", model: {} });
});
  
app.post("/create", (req, res) => {
    //console.log("POST customer, req.body us: ", req.body);
    dblib.insertCustomer(req.body)
        .then(result => {
            console.log("result from create customer is: ", result.msg);
            res.render("create", {
                type: "post",
                message: result.msg,
                model: req.body
            })
        })
        .catch(err => {
            res.render("create", {
                type: "post",
                message: err.message,
                model: req.body
        });
    });
});

app.get("/update/:id", async (req,res)=>{
    console.log("GET customer, request id: ", req.params.id);
    dblib.getCustomerId(req.params.id).then(
        result => {
            console.log("result from Get Customer is: ", result);
            res.render("update", {type: "get", model: result.totRecords[0] });
    })
});

app.post("/update/:id", async (req, res) => {
    //console.log("POST customer, req.body us: ", req.body);
    dblib.updateCustomerId(req.body)
        .then(result => {
            console.log("result from Update Customer is: ", result);
            res.render("update", {
                type: "post",
                message: result.msg,
                model: req.body
            })
        })
        .catch(err => {
            res.render("update", {
                type: "post",
                message: err.message,
                model: req.body
        });
    });
});

app.get("/delete/:id", async (req,res)=>{
    console.log("GET customer, request id: ", req.params.id);
    dblib.getCustomerId(req.params.id).then(
        result => {
            console.log("result from Get Customer is: ", result);
            res.render("delete", {type: "get", model: result.totRecords[0] });
    })
});

app.post("/delete/:id", async (req, res) => {
    console.log("POST customer, req.body us: ", req.body);
    dblib.deleteCustomerId(req.params.id)
        .then(result => {
            console.log("result from Delete Customer is: ", result);
            res.render("delete", {
                type: "post",
                result: result,
                model: req.body
            })
        })
        .catch(err => {
            res.render("delete", {
                type: "post",
                result: `Unexpected Error: ${err.message}`,
                cust: req.body
        });
    });
});

app.get("/export", async (req, res) => {
    const totRecs = await dblib.getRecordCount();
    res.render("export",{ 
        totRecs: totRecs.totRecords,
        type: "get",
        message:"success"
    });
});

app.post("/export",  (req, res) => {
    console.log("POST customer, req.body us: ", Object.values(req.body));
    dblib.retrieveExportedRecords()
        .then(result => {
            console.log("result from Exported Customer is: ", result.result);
            var outputFile = Object.values(req.body)[0]
            res.header("Content-Type", "text/plain", "charset=UTF-8");
            res.attachment(outputFile);
            res.send(result.result);
        })
        .catch(err => {
            res.render("export", {
                type: "post",
                result: `Unexpected Error: ${err.message}`,
                message: err.message
        });
    });
});

app.get("/import", async (req, res) => {
    const totRecs = await dblib.getRecordCount();
    res.render("import",{
        totRecs: totRecs.totRecords,
        type: "get",
        message:"success"
    });
 });

 app.post("/import",  upload.single('filename'), (req, res) => {
    dblib.insertMultipleCustomers(req.file).then(result => {
        console.log(result);
        res.send(result);
    })
    .catch(err => {
        res.render("import", {
            type: "post",
            result: `Unexpected Error: ${err.message}`,
            message: err.message
        });
    });
});