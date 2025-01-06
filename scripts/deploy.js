const { ethers } = require("hardhat");

async function main() {
    // Get the contract factory
    const PurchaseAgreement = await ethers.getContractFactory("PurchaseAgreement");

    // Deploy the contract
    console.log("Deploying PurchaseAgreement...");
    const purchaseAgreement = await PurchaseAgreement.deploy();
    await purchaseAgreement.waitForDeployment();

    // Get the deployed contract address
    const address = await purchaseAgreement.getAddress();
    console.log("PurchaseAgreement deployed to:", address);
}

// Run the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });