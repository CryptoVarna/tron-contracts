// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/extensions/TRC20Burnable.sol";

contract TRC20BurnableMock is TRC20Burnable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) TRC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }
}
