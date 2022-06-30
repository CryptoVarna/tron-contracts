// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC20FlashMint.sol";

contract TRC20FlashMintMock is TRC20FlashMint {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) TRC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    function flashFeeMock(address token, uint256 amount)
        public
        returns (uint256)
    {
        return flashFee(token, amount);
    }
}
