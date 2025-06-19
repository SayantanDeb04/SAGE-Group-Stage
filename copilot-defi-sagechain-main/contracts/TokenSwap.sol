// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SageToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSwap {
    SageToken public token;
    IERC20 public wbtcToken;
    uint256 public rate = 1000; // 1 ETH = 1000 SAGE
    uint256 public wbtcRate = 100; // 1 ETH = 100 WBTC (mock rate)

    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event TokensSwapped(address indexed user, uint256 tokenAmountIn, uint256 ethAmountOut);
    event WBTCExchanged(address indexed user, uint256 ethAmount, uint256 wbtcAmount);

    constructor(SageToken _token, IERC20 _wbtcToken) {
        token = _token;
        wbtcToken = _wbtcToken;
    }

    function buyTokens() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 tokenAmount = msg.value * rate;
        require(token.balanceOf(address(this)) >= tokenAmount, "Not enough tokens in reserve");
        token.transfer(msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, msg.value, tokenAmount);
    }

    function sellTokens(uint256 tokenAmount) public {
        require(tokenAmount > 0, "Send token amount to sell");
        uint256 ethAmount = tokenAmount / rate;
        require(address(this).balance >= ethAmount, "Not enough ETH in contract");

        token.transferFrom(msg.sender, address(this), tokenAmount);
        payable(msg.sender).transfer(ethAmount);
        emit TokensSwapped(msg.sender, tokenAmount, ethAmount);
    }

    function swapETHToWBTC() public payable {
        require(msg.value > 0, "Send ETH to swap for WBTC");
        uint256 wbtcAmount = msg.value * wbtcRate;
        require(wbtcToken.balanceOf(address(this)) >= wbtcAmount, "Not enough WBTC in reserve");

        wbtcToken.transfer(msg.sender, wbtcAmount);
        emit WBTCExchanged(msg.sender, msg.value, wbtcAmount);
    }

    receive() external payable {}
}
