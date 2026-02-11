// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC20Permit {
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

contract DiceGame {
    event BetPlaced(address indexed player, uint256 amount, uint8 roll, bool isWin, uint256 payout);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    address public owner;
    IERC20 public usdc;
    uint256 public fee = 10000; // 0.01 USDC (6 decimals)

    constructor(address _usdc, address _owner) {
        owner = _owner;
        usdc = IERC20(_usdc);
    }

    function setFee(uint256 _fee) external {
        require(msg.sender == owner, "Only owner");
        fee = _fee;
    }

    function roll(uint8 target, bool isUnder, uint256 amount) external {
        require(amount > 0, "Bet amount must be greater than 0");
        require(target > 0 && target < 100, "Target must be between 1 and 99");

        // Transfer bet amount + fee from user to contract (needs Approval)
        uint256 totalCharge = amount + fee;
        require(usdc.transferFrom(msg.sender, address(this), totalCharge), "Transfer failed");

        // Calculate Win Chance
        uint8 winChance = isUnder ? target : (99 - target);
        if (winChance < 1) winChance = 1;
        
        // Calculate Payout
        // 99 / winChance
        uint256 multiplier = (99 * 1e18) / winChance; 
        uint256 payout = (amount * multiplier) / 1e18;

        require(usdc.balanceOf(address(this)) >= payout, "Insufficient contract vault");

        // Generate Pseudo-Random Number
        uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender)));
        uint8 rolledNumber = uint8(randomHash % 100);

        bool isWin = false;
        if (isUnder && rolledNumber < target) {
            isWin = true;
        } else if (!isUnder && rolledNumber > target) {
            isWin = true;
        }

        uint256 payoutAmount = 0;
        if (isWin) {
            payoutAmount = payout;
            require(usdc.transfer(msg.sender, payout), "Payout failed");
        }

        emit BetPlaced(msg.sender, amount, rolledNumber, isWin, payoutAmount);
    }

    function rollWithPermit(
        address player,
        uint8 target,
        bool isUnder,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(amount > 0, "Bet amount must be greater than 0");
        require(target > 0 && target < 100, "Target must be between 1 and 99");

        // Calculate total charge (bet + fee)
        uint256 totalCharge = amount + fee;

        // Try permit for totalCharge; if allowance already exists, permit may revert (e.g. nonce mismatch)
        try IERC20Permit(address(usdc)).permit(player, address(this), totalCharge, deadline, v, r, s) {} catch {}

        // Transfer bet amount + fee from player to contract
        require(usdc.transferFrom(player, address(this), totalCharge), "Transfer failed");

        // Calculate Win Chance
        uint8 winChance = isUnder ? target : (99 - target);
        if (winChance < 1) winChance = 1;

        // Calculate Payout
        uint256 multiplier = (99 * 1e18) / winChance;
        uint256 payout = (amount * multiplier) / 1e18;

        require(usdc.balanceOf(address(this)) >= payout, "Insufficient contract vault");

        // Generate Pseudo-Random Number (uses player address instead of msg.sender)
        uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, player)));
        uint8 rolledNumber = uint8(randomHash % 100);

        bool isWin = false;
        if (isUnder && rolledNumber < target) {
            isWin = true;
        } else if (!isUnder && rolledNumber > target) {
            isWin = true;
        }

        uint256 payoutAmount = 0;
        if (isWin) {
            payoutAmount = payout;
            require(usdc.transfer(player, payout), "Payout failed");
        }

        emit BetPlaced(player, amount, rolledNumber, isWin, payoutAmount);
    }

    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        usdc.transfer(owner, amount);
        emit FundsWithdrawn(owner, amount);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
