// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DiceGameNative {
    event BetPlaced(address indexed player, uint256 amount, uint8 roll, bool isWin, uint256 payout);
    event FundsWithdrawn(address indexed owner, uint256 amount);

    address public owner;
    uint256 public fee;

    constructor(address _owner, uint256 _fee) {
        owner = _owner;
        fee = _fee;
    }

    function setFee(uint256 _fee) external {
        require(msg.sender == owner, "Only owner");
        fee = _fee;
    }

    function roll(uint8 target, bool isUnder) external payable {
        require(msg.value > fee, "Must send more than fee");
        require(target > 0 && target < 100, "Target must be between 1 and 99");

        uint256 amount = msg.value - fee;

        // Calculate Win Chance
        uint8 winChance = isUnder ? target : (99 - target);
        if (winChance < 1) winChance = 1;

        // Calculate Payout
        uint256 multiplier = (99 * 1e18) / winChance;
        uint256 payout = (amount * multiplier) / 1e18;

        require(address(this).balance >= payout, "Insufficient contract vault");

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
            (bool sent, ) = payable(msg.sender).call{value: payout}("");
            require(sent, "Payout failed");
        }

        emit BetPlaced(msg.sender, amount, rolledNumber, isWin, payoutAmount);
    }

    receive() external payable {}

    function withdraw(uint256 amount) external {
        require(msg.sender == owner, "Only owner");
        (bool sent, ) = payable(owner).call{value: amount}("");
        require(sent, "Withdraw failed");
        emit FundsWithdrawn(owner, amount);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner");
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
