/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');


async function main( params ) {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('fabcar');

        // Gathering payload data
        const companyName = params.companyName;
        const licenseNo = params.licenseNo;
        const currentCapital = parseFloat(params.currentCapital);
        const currentDebt = parseFloat(params.currentDebt);
        const currentRevenue = parseFloat(params.currentRevenue);
        const minimumBiddingAmount = parseFloat(params.minimumBiddingAmount);
        const ownerNID = params.ownerNID;

        // Submit the specified transaction.
        // createCompany transaction - requires 7 arguments
        await contract.submitTransaction(
        'createCompany',
        `${companyName}`,
        `${licenseNo}`,
        `${currentCapital}`,
        `${currentDebt}`,
        `${currentRevenue}`,
        `${minimumBiddingAmount}`,
        `${ownerNID}`
        );


        console.log('Transaction has been submitted');


        // Disconnect from the gateway.
        await gateway.disconnect();

    } 
    catch (error) {
        console.error(`Failed to create transaction: ${error}`);
        process.exit(1);
    }
}

// main();
module.exports = { main }
