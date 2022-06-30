// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../popular/usdt/TetherToken.sol";

// mock class using TRC20
contract USDTMock is TetherToken {
    constructor(
        uint256 _initialSupply,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) TetherToken(_initialSupply, _name, _symbol, _decimals) {}

    //Needs to be called by the owner
    function mint(uint256 amount) public {
        TetherToken.issue(amount);
    }

    //Needs to be called by the owner
    function burn(uint256 amount) public {
        TetherToken.redeem(amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override returns (bool) {
        return TetherToken.transferFrom(from, to, value);
    }

    //Needs to be called by the owner
    function approve(address spender, uint256 value)
        public
        override
        returns (bool)
    {
        return TetherToken.approve(spender, value);
    }

    //Needs to be called by the owner
    function increaseAllowance(address spender, uint256 value)
        public
        returns (bool)
    {
        return TetherToken.increaseApproval(spender, value);
    }

    //Needs to be called by the owner
    function decreaseAllowance(address spender, uint256 value)
        public
        returns (bool)
    {
        return TetherToken.decreaseApproval(spender, value);
    }

    //Needs to be called by the owner
    function transferInternal(address to, uint256 value) public returns (bool) {
        return TetherToken.transfer(to, value);
    }

    //Needs to be called by the owner
    function approveInternal(address spender, uint256 value)
        public
        returns (bool)
    {
        return TetherToken.approve(spender, value);
    }
}
