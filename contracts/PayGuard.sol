// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PayGuard is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;

    uint256 public platformFee = 250; // 2.5% (basis points)
    uint256 public constant MAX_FEE = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;

    address public feeRecipient;

    enum InvoiceStatus { Created, Funded, Completed, Released, Refunded, Disputed }

    struct Invoice {
        address payer;
        address payee;
        uint256 amount;
        uint256 deadline;
        string description;
        InvoiceStatus status;
        uint256 createdAt;
    }

    uint256 public invoiceCounter;
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public userInvoices;

    event InvoiceCreated(uint256 indexed id, address indexed payer, address indexed payee, uint256 amount, uint256 deadline, string description);
    event InvoiceFunded(uint256 indexed id);
    event InvoiceCompleted(uint256 indexed id);
    event InvoiceReleased(uint256 indexed id, uint256 amount, uint256 fee);
    event InvoiceRefunded(uint256 indexed id);
    event InvoiceDisputed(uint256 indexed id);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    constructor(address _usdc, address _feeRecipient) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    function createInvoice(address _payee, uint256 _amount, uint256 _deadline, string calldata _description) external returns (uint256) {
        require(_payee != address(0), "invalid payee");
        require(_amount > 0, "zero amount");
        require(_deadline > block.timestamp, "deadline must be future");

        invoiceCounter++;
        uint256 id = invoiceCounter;

        invoices[id] = Invoice({
            payer: msg.sender,
            payee: _payee,
            amount: _amount,
            deadline: _deadline,
            description: _description,
            status: InvoiceStatus.Created,
            createdAt: block.timestamp
        });

        userInvoices[msg.sender].push(id);
        userInvoices[_payee].push(id);

        emit InvoiceCreated(id, msg.sender, _payee, _amount, _deadline, _description);
        return id;
    }

    function fundInvoice(uint256 _id) external nonReentrant {
        Invoice storage inv = invoices[_id];
        require(inv.status == InvoiceStatus.Created, "wrong status");
        require(msg.sender == inv.payer, "only payer");

        inv.status = InvoiceStatus.Funded;
        usdc.safeTransferFrom(msg.sender, address(this), inv.amount);

        emit InvoiceFunded(_id);
    }

    function confirmComplete(uint256 _id) external {
        Invoice storage inv = invoices[_id];
        require(inv.status == InvoiceStatus.Funded, "wrong status");
        require(msg.sender == inv.payee, "only payee");

        inv.status = InvoiceStatus.Completed;
        emit InvoiceCompleted(_id);
    }

    function release(uint256 _id) external nonReentrant {
        Invoice storage inv = invoices[_id];
        require(inv.status == InvoiceStatus.Completed, "wrong status");
        require(msg.sender == inv.payee, "only payee");

        inv.status = InvoiceStatus.Released;

        uint256 fee = (inv.amount * platformFee) / BASIS_POINTS;
        uint256 payAmount = inv.amount - fee;

        if (fee > 0) {
            usdc.safeTransfer(feeRecipient, fee);
        }
        usdc.safeTransfer(inv.payee, payAmount);

        emit InvoiceReleased(_id, payAmount, fee);
    }

    function refund(uint256 _id) external nonReentrant {
        Invoice storage inv = invoices[_id];
        require(inv.status == InvoiceStatus.Funded, "wrong status");
        require(block.timestamp >= inv.deadline, "deadline not passed");
        require(msg.sender == inv.payer || msg.sender == owner(), "not authorized");

        inv.status = InvoiceStatus.Refunded;
        usdc.safeTransfer(inv.payer, inv.amount);

        emit InvoiceRefunded(_id);
    }

    function dispute(uint256 _id) external {
        Invoice storage inv = invoices[_id];
        require(inv.status == InvoiceStatus.Funded || inv.status == InvoiceStatus.Completed, "wrong status");
        require(msg.sender == inv.payer, "only payer");

        inv.status = InvoiceStatus.Disputed;
        emit InvoiceDisputed(_id);
    }

    function resolveDispute(uint256 _id, bool releaseToPayee) external onlyOwner {
        Invoice storage inv = invoices[_id];
        require(inv.status == InvoiceStatus.Disputed, "not disputed");

        if (releaseToPayee) {
            inv.status = InvoiceStatus.Released;

            uint256 fee = (inv.amount * platformFee) / BASIS_POINTS;
            uint256 payAmount = inv.amount - fee;

            if (fee > 0) {
                usdc.safeTransfer(feeRecipient, fee);
            }
            usdc.safeTransfer(inv.payee, payAmount);

            emit InvoiceReleased(_id, payAmount, fee);
        } else {
            inv.status = InvoiceStatus.Refunded;
            usdc.safeTransfer(inv.payer, inv.amount);
            emit InvoiceRefunded(_id);
        }
    }

    function setFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "fee too high");
        emit FeeUpdated(platformFee, _newFee);
        platformFee = _newFee;
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "invalid address");
        emit FeeRecipientUpdated(feeRecipient, _newRecipient);
        feeRecipient = _newRecipient;
    }

    function getInvoices(address _user) external view returns (uint256[] memory) {
        return userInvoices[_user];
    }

    function getInvoiceCount() external view returns (uint256) {
        return invoiceCounter;
    }
}
