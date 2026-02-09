// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DiceGame {
    event BetPlaced(address indexed player, uint256 amount, uint8 roll, bool isWin, uint256 payout);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    address public owner;
    IERC20 public usdc;

    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }

    function roll(uint8 target, bool isUnder, uint256 amount) external {
        require(amount > 0, "Bet amount must be greater than 0");
        require(target > 0 && target < 100, "Target must be between 1 and 99");
        
        // Transfer bet amount from user to contract (needs Approval)
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");

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

    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        usdc.transfer(owner, amount);
        emit FundsWithdrawn(owner, amount);
    }
}
