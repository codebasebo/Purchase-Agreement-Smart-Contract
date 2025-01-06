# PurchaseAgreement Smart Contract

This is a Solidity smart contract for managing purchase agreements between a seller and a buyer. The contract ensures that both parties deposit funds and provides mechanisms for refunds and fund releases.

## Features

- **Order Creation**: The seller creates an order by depositing twice the order amount.
- **Purchase Confirmation**: The buyer confirms the purchase by depositing twice the order amount.
- **Receipt Confirmation**: The buyer confirms receipt, triggering a refund of their deposit.
- **Seller Deposit Release**: The seller can release their deposit after the buyer confirms receipt.
- **Buyer Refund**: The buyer can request a refund if they are unsatisfied.

## Contract Details

### State Variables

- `seller`: The address of the seller.
- `buyer`: The address of the buyer.
- `state`: The current state of the contract (`Created`, `Locked`, `Release`, `Inactive`).
- `orders`: A mapping of order IDs to `Order` structs.

### Order Struct

```solidity
struct Order {
    uint id;
    string description;
    uint amount;
    uint sellerDeposit;
    uint buyerDeposit;
    State status;
    address buyer;
}
```

### Functions

#### `createOrder(string memory _description, uint _amount)`

- Creates a new order.
- The seller must deposit twice the order amount.

#### `confirmPurchase(uint _orderId)`

- Confirms the purchase.
- The buyer must deposit twice the order amount.

#### `confirmReceived(uint _orderId)`

- Confirms receipt of the order.
- Refunds the buyer their deposit.

#### `releaseSellerDeposit(uint _orderId)`

- Releases the seller's deposit.

#### `refundBuyer(uint _orderId)`

- Refunds the buyer their deposit.

### Events

- `OrderCreated(uint indexed orderId, string description, uint amount, uint sellerDeposit)`
  - Emitted when a new order is created.

- `PurchaseConfirmed(uint indexed orderId, address buyer, uint buyerDeposit)`
  - Emitted when the buyer confirms the purchase.

- `BuyerRefunded(uint indexed orderId, uint refundAmount)`
  - Emitted when the buyer is refunded.

- `SellerDepositReleased(uint indexed orderId, uint sellerDeposit)`
  - Emitted when the seller's deposit is released.

## Deployment

### Prerequisites

- Node.js installed.
- Hardhat installed.

### Steps

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile the contract:

   ```bash
   npx hardhat compile
   ```

4. Deploy the contract:

   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

   Replace `<network-name>` with the network you want to deploy to (e.g., `localhost`, `goerli`, `mainnet`).

## Testing

Run the tests using Hardhat:

```bash
npx hardhat test
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Project Structure

Your project should now look like this:

```
project-folder/
├── contracts/
│   └── PurchaseAgreement.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── PurchaseAgreement.js
├── README.md
├── hardhat.config.js
├── package.json
└── LICENSE
```

