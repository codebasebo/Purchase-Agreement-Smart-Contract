// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract PurchaseAgreement {
    address payable public seller;
    address payable public buyer;

    enum State { Created, Locked, Release, Inactive }
    State public state;

    // Order structure
    struct Order {
        uint id;
        string description;
        uint amount; // Amount of the order
        uint sellerDeposit; // Seller's deposit (2 * amount)
        uint buyerDeposit; // Buyer's deposit (2 * amount)
        State status;
        address buyer;
    }

    // Mapping to store orders
    mapping(uint => Order) public orders;
    uint public orderCount; // Counter for unique order IDs

    // Custom errors
    error InvalidState();
    error OnlyBuyer();
    error OnlySeller();
    error IncorrectValue();
    error OrderNotFound();
    error InsufficientDeposit();

    // Events
    event OrderCreated(uint indexed orderId, string description, uint amount, uint sellerDeposit);
    event PurchaseConfirmed(uint indexed orderId, address buyer, uint buyerDeposit);
    event BuyerRefunded(uint indexed orderId, uint refundAmount);
    event SellerDepositReleased(uint indexed orderId, uint sellerDeposit);

    constructor() {
        seller = payable(msg.sender);
    }

    /// @dev Modifier to ensure the contract is in the expected state.
    modifier inState(State _state) {
        if (state != _state) revert InvalidState();
        _;
    }

    /// @dev Modifier to restrict access to the buyer.
    modifier onlyBuyer() {
        if (msg.sender != buyer) revert OnlyBuyer();
        _;
    }

    /// @dev Modifier to restrict access to the seller.
    modifier onlySeller() {
        if (msg.sender != seller) revert OnlySeller();
        _;
    }

    /// @notice Creates a new order.
    /// @dev The seller must deposit twice the order amount.
    /// @param _description Description of the order.
    /// @param _amount Amount of the order.
    function createOrder(string memory _description, uint _amount) external payable onlySeller {
        if (msg.value != (2 * _amount)) revert InsufficientDeposit(); // Seller must deposit 2 * amount

        orderCount++; // Increment order ID
        orders[orderCount] = Order({
            id: orderCount,
            description: _description,
            amount: _amount,
            sellerDeposit: msg.value,
            buyerDeposit: 0, // Buyer deposit is initially 0
            status: State.Created,
            buyer: address(0)
        });

        emit OrderCreated(orderCount, _description, _amount, msg.value);
    }

    /// @notice Confirms the purchase by the buyer.
    /// @dev The buyer must send twice the order amount.
    /// @param _orderId ID of the order to confirm.
    function confirmPurchase(uint _orderId) public inState(State.Created) payable {
        if (orders[_orderId].id == 0) revert OrderNotFound(); // Check if order exists
        if (msg.value != (2 * orders[_orderId].amount)) revert IncorrectValue(); // Buyer must send 2 * amount

        buyer = payable(msg.sender);
        orders[_orderId].buyer = buyer;
        orders[_orderId].buyerDeposit = msg.value; // Store buyer's deposit
        orders[_orderId].status = State.Locked;
        state = State.Locked;

        emit PurchaseConfirmed(_orderId, buyer, msg.value);
    }

    /// @notice Confirms receipt of the order by the buyer.
    /// @dev Refunds the buyer their deposit.
    /// @param _orderId ID of the order to confirm.
    function confirmReceived(uint _orderId) external onlyBuyer inState(State.Locked) {
        if (orders[_orderId].id == 0) revert OrderNotFound(); // Check if order exists

        orders[_orderId].status = State.Release;
        state = State.Release;

        // Refund buyer their deposit (2 * amount)
        buyer.transfer(orders[_orderId].buyerDeposit);

        emit BuyerRefunded(_orderId, orders[_orderId].buyerDeposit);
    }

    /// @notice Releases the seller's deposit after the buyer confirms receipt.
    /// @dev Can only be called by the seller in the Release state.
    /// @param _orderId ID of the order to release the seller's deposit.
    function releaseSellerDeposit(uint _orderId) external onlySeller inState(State.Release) {
        if (orders[_orderId].id == 0) revert OrderNotFound(); // Check if order exists

        orders[_orderId].status = State.Inactive;
        state = State.Inactive;

        // Refund seller their deposit (2 * amount)
        seller.transfer(orders[_orderId].sellerDeposit);

        emit SellerDepositReleased(_orderId, orders[_orderId].sellerDeposit);
    }

    /// @notice Refunds the buyer if they are unsatisfied.
    /// @dev Can only be called by the buyer in the Locked state.
    /// @param _orderId ID of the order to refund.
    function refundBuyer(uint _orderId) external onlySeller inState(State.Locked) {
        if (orders[_orderId].id == 0) revert OrderNotFound(); // Check if order exists

        orders[_orderId].status = State.Inactive;
        state = State.Inactive;

        // Refund buyer their deposit (2 * amount)
        buyer.transfer(orders[_orderId].buyerDeposit);

        emit BuyerRefunded(_orderId, orders[_orderId].buyerDeposit);
    }
}