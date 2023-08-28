/*
 * Module dependencies
 */
const express = require('express')
const cors = require('cors')
const query = require('./query');
const createCompany = require('./createCompany')
const givenBid = require('./givenBid')
const bodyParser = require('body-parser')
const { getBiddingHistory } = require('./biddingHistory');




const app = express()

// To control CORSS-ORIGIN-RESOURCE-SHARING( CORS )
app.use(cors())
app.options('*', cors()); 

// To parse encoded data
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// get all car
app.get('/get-company', function (req, res) {
    query.main( req.query )
    .then(result => {
        const parsedData = JSON.parse( result )
        let companyList

        // if user search car
        if(  req.query.key ){
            companyList = [
                {
                    Key: req.query.key,
                    Record: {
                        ...parsedData
                    }
                }
            ]
            res.send( companyList )
            return
        }

        companyList = parsedData
        res.send( companyList )
    })
    .catch(err => {
        console.error({ err })
        res.send('FAILED TO GET DATA!')
    })
})

// create a new car
app.post('/create', function (req, res) {
    console.log('Received request data:', req.body); // Debug line

    createCompany.main(req.body)
    .then(result => {
        res.send({message: 'Created successfully'})
    })
    .catch(err => {
        console.error({ err })
        res.send('FAILED TO LOAD DATA!')
    })
})


// change car owner
app.post('/givenBid', function (req, res) {
    givenBid.main(req.body)
        .then(result => {
            if (typeof result === 'string') {
                res.status(400).send({ message: result }); // Set status code 400 and send error message
            } else {
                res.send({ message: 'Updated successfully' });
            }
        })
        .catch(err => {
            console.error({ err });

            // Check if the error contains the specific message you're looking for
            if (err.message.includes("New bid amount must be higher than the previous highest bid amount")) {
                res.status(400).send({ message: err.message }); // Set status code 400 and send error message
            } else {
                res.status(500).send({ message: 'Failed to load data!' });
            }
        });
});

app.get('/getBiddingHistory/:companyLicense', async (req, res) => {
    const companyLicense = req.params.companyLicense;

    try {
        const biddingHistory = await getBiddingHistory(companyLicense);
        res.json(biddingHistory);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch bidding history' });
    }
});


app.listen(3000, () => console.log('Server is running at port 3000'))


