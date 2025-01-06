const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PurchaseAgreement", function () {
  async function deployPurchaseAgreement() {
    const [owner, buyer] = await ethers.getSigners();

    const PurchaseAgreement = await ethers.getContractFactory("PurchaseAgreement");
    const purchaseAgreement = await PurchaseAgreement.deploy();
    await purchaseAgreement.waitForDeployment();

    const purchaseAgreementAddr = await purchaseAgreement.getAddress();
    console.log("PurchaseAgreement deployed to:", purchaseAgreementAddr);

    return { owner, buyer, purchaseAgreement };
  }

  describe("createOrder", function () {
    it("Should create an order", async function () {
      const { owner, purchaseAgreement } = await deployPurchaseAgreement();

      // Create an order with a description and amount
      const description = "A bag of rice";
      const amount = ethers.parseEther("1"); // 1 ETH

      // Seller deposits 2 * amount
      const sellerDeposit = ethers.parseEther("2"); // 2 ETH
      await expect(
        purchaseAgreement.createOrder(description, amount, { value: sellerDeposit })
      )
        .to.emit(purchaseAgreement, "OrderCreated")
        .withArgs(1, description, amount, sellerDeposit);

      // Check if the order was created
      const order = await purchaseAgreement.orders(1);
      expect(order.id).to.equal(1);
      expect(order.description).to.equal(description);
      expect(order.amount).to.equal(amount);
      expect(order.sellerDeposit).to.equal(sellerDeposit);
      expect(order.status).to.equal(0); // State.Created
    });
  });

  describe("confirmPurchase", function () {
    it("Should confirm the purchase", async function () {
      const { owner, buyer, purchaseAgreement } = await deployPurchaseAgreement();

      // Create an order
      const description = "A bag of rice";
      const amount = ethers.parseEther("1"); // 1 ETH
      const sellerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.createOrder(description, amount, { value: sellerDeposit });

      // Buyer confirms the purchase by sending 2 * amount
      const buyerDeposit = ethers.parseEther("2"); // 2 ETH
      await expect(
        purchaseAgreement.connect(buyer).confirmPurchase(1, { value: buyerDeposit })
      )
        .to.emit(purchaseAgreement, "PurchaseConfirmed")
        .withArgs(1, buyer.address, buyerDeposit);

      // Check if the purchase was confirmed
      const order = await purchaseAgreement.orders(1);
      expect(order.buyer).to.equal(buyer.address);
      expect(order.buyerDeposit).to.equal(buyerDeposit);
      expect(order.status).to.equal(1); // State.Locked
    });
  });

  describe("confirmReceived", function () {
    it("Should confirm receipt and refund the buyer", async function () {
      const { owner, buyer, purchaseAgreement } = await deployPurchaseAgreement();

      // Create an order
      const description = "A bag of rice";
      const amount = ethers.parseEther("1"); // 1 ETH
      const sellerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.createOrder(description, amount, { value: sellerDeposit });

      // Buyer confirms the purchase
      const buyerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.connect(buyer).confirmPurchase(1, { value: buyerDeposit });

      // Buyer confirms receipt
      await expect(purchaseAgreement.connect(buyer).confirmReceived(1))
        .to.emit(purchaseAgreement, "BuyerRefunded")
        .withArgs(1, buyerDeposit);

      // Check if the receipt was confirmed
      const order = await purchaseAgreement.orders(1);
      expect(order.status).to.equal(2); // State.Release
    });
  });

  describe("releaseSellerDeposit", function () {
    it("Should release the seller's deposit", async function () {
      const { owner, buyer, purchaseAgreement } = await deployPurchaseAgreement();

      // Create an order
      const description = "A bag of rice";
      const amount = ethers.parseEther("1"); // 1 ETH
      const sellerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.createOrder(description, amount, { value: sellerDeposit });

      // Buyer confirms the purchase
      const buyerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.connect(buyer).confirmPurchase(1, { value: buyerDeposit });

      // Buyer confirms receipt
      await purchaseAgreement.connect(buyer).confirmReceived(1);

      // Seller releases their deposit
      await expect(purchaseAgreement.releaseSellerDeposit(1))
        .to.emit(purchaseAgreement, "SellerDepositReleased")
        .withArgs(1, sellerDeposit);

      // Check if the seller's deposit was released
      const order = await purchaseAgreement.orders(1);
      expect(order.status).to.equal(3); // State.Inactive
    });
  });

  describe("refundBuyer", function () {
    it("Should refund the buyer", async function () {
      const { owner, buyer, purchaseAgreement } = await deployPurchaseAgreement();

      // Create an order
      const description = "A bag of rice";
      const amount = ethers.parseEther("1"); // 1 ETH
      const sellerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.createOrder(description, amount, { value: sellerDeposit });

      // Buyer confirms the purchase
      const buyerDeposit = ethers.parseEther("2"); // 2 ETH
      await purchaseAgreement.connect(buyer).confirmPurchase(1, { value: buyerDeposit });

      // Buyer requests a refund
      await expect(purchaseAgreement.refundBuyer(1))
        .to.emit(purchaseAgreement, "BuyerRefunded")
        .withArgs(1, buyerDeposit);

      // Check if the buyer was refunded
      const order = await purchaseAgreement.orders(1);
      expect(order.status).to.equal(3); // State.Inactive
    });
  });
});