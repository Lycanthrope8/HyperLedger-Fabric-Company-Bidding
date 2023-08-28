/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class FabCar extends Contract {

    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        const companies = [
            {
                companyName: 'Company A',
                license_no: '1234',
                currentCapital: 1000000,
                currentDebt: 500000,
                currentRevenue: 2000000,
                minimumBiddingAmount: 50000,
                currentBiddingAmount: 0,
                highestBidderNID: '',
                ownerNID: 'OwnerNID1',
                remainingBids:5
            },
            {
                companyName: 'Company B',
                license_no: '5678',
                currentCapital: 1500000,
                currentDebt: 700000,
                currentRevenue: 3000000,
                minimumBiddingAmount: 75000,
                currentBiddingAmount: 0,
                highestBidderNID: '',
                ownerNID: 'OwnerNID2',
                remainingBids:5
            },
            {
                companyName: 'Company C',
                license_no: '9012',
                currentCapital: 800000,
                currentDebt: 300000,
                currentRevenue: 1200000,
                minimumBiddingAmount: 40000,
                currentBiddingAmount: 0,
                highestBidderNID: '',
                ownerNID: 'OwnerNID3',
                remainingBids:5
            },
            {
                companyName: 'Company D',
                license_no: '3456',
                currentCapital: 1200000,
                currentDebt: 600000,
                currentRevenue: 2500000,
                minimumBiddingAmount: 60000,
                currentBiddingAmount: 0,
                highestBidderNID: '',
                ownerNID: 'OwnerNID4',
                remainingBids:5
            },
            {
                companyName: 'Company E',
                license_no: '7890',
                currentCapital: 1800000,
                currentDebt: 800000,
                currentRevenue: 4000000,
                minimumBiddingAmount: 80000,
                currentBiddingAmount: 0,
                highestBidderNID: '',
                ownerNID: 'OwnerNID5',
                remainingBids:5
            },
            // Add more company records
        ];
    
        for (let i = 0; i < companies.length; i++) {
            const licenseNo = companies[i].license_no;
            companies[i].docType = 'company';
            await ctx.stub.putState(licenseNo, Buffer.from(JSON.stringify(companies[i])));
            console.info('Added <--> ', companies[i]);
        }
        console.info('============= END : Initialize Ledger ===========');
    }

    async queryCar(ctx, carNumber) {
        const carAsBytes = await ctx.stub.getState(carNumber); // get the car from chaincode state
        if (!carAsBytes || carAsBytes.length === 0) {
            throw new Error(`${carNumber} does not exist`);
        }
        console.log(carAsBytes.toString());
        return carAsBytes.toString();
    }

    async createCompany(ctx, companyName, licenseNo, currentCapital, currentDebt, currentRevenue, minimumBiddingAmount, ownerNID) {
        console.info('============= START : Create Company ===========');
        
        // Check if a company with the same license number already exists
        const existingCompanyAsBytes = await ctx.stub.getState(licenseNo);
        if (existingCompanyAsBytes && existingCompanyAsBytes.length > 0) {
            // throw new Error(`Company with license number ${licenseNo} already exists`);
            return `Company with license number ${licenseNo} already exists`;
        }
        const company = {
            companyName,
            license_no: licenseNo,
            currentCapital: parseFloat(currentCapital),
            currentDebt: parseFloat(currentDebt),
            currentRevenue: parseFloat(currentRevenue),
            minimumBiddingAmount: parseFloat(minimumBiddingAmount),
            currentBiddingAmount: 0,
            highestBidderNID:'',
            ownerNID : ownerNID,
            remainingBids:5,
            docType: 'company',
        };
    
        await ctx.stub.putState(licenseNo, Buffer.from(JSON.stringify(company)));
        console.info('============= END : Create Company ===========');
    }
    

    async queryAllCars(ctx) {
        const startKey = '';
        const endKey = '';
        const allResults = [];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }

    async givenBid(ctx, companyLicense, newBidAmount, bidderNID) {
        console.info('============= START : givenBid ===========');


        console.log('Fetching company with license number:', companyLicense);
        const companyAsBytes = await ctx.stub.getState(companyLicense);
        console.log('Company bytes retrieved:', companyAsBytes.toString());
        if (!companyAsBytes || companyAsBytes.length === 0) {
            throw new Error(`${companyLicense} does not exist`);
            // return `${companyLicense} licensed Company does not exist`
        }
    
        const company = JSON.parse(companyAsBytes.toString());
        if (company.remainingBids==0){
            throw new Error("No Bids Remaining. Sold!!!!")
            // return `No Bids Remaining. Sold!!!!`;
        }
        if (bidderNID === company.ownerNID) {
            throw new Error("Owner cannot bid in their own company");
            // return `Owner cannot bid in their own company`;
        }
    
        if (newBidAmount <= company.currentBiddingAmount) {
            throw new Error("New bid amount must be higher than the previous highest bid amount");
            // return `New bid amount must be higher than the previous highest bid amount`;
        }
    
        if (newBidAmount < company.minimumBiddingAmount) {
            throw new Error("New bid amount must be greater than or equal to the minimum bidding amount");
            // return `New bid amount must be greater than or equal to the minimum bidding amount`;
        }
    
        company.currentBiddingAmount = newBidAmount;
        company.highestBidderNID = bidderNID;
        company.remainingBids--;
    
        await ctx.stub.putState(companyLicense, Buffer.from(JSON.stringify(company)));
        console.info('============= END : givenBid ===========');
    }

    async getCompanyHistory(ctx, companyLicense) {
        const iterator = await ctx.stub.getHistoryForKey(companyLicense);
    
        const history = [];
        let result = await iterator.next();
        while (!result.done) {
            if (result.value) {
                // const timestamp = new Date(result.value.timestamp.seconds.low * 1000).toISOString();
                const entry = {
                    transactionId: result.value.txId,
                    // timestamp: timestamp,
                    value: result.value.value.toString('utf8')
                };
                history.push(entry);
            }
            result = await iterator.next();
        }
        await iterator.close();
    
        return JSON.stringify(history);
    }
    



    
    

}

module.exports = FabCar;
