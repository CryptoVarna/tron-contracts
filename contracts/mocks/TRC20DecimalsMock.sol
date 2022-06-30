// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC20/TRC20.sol";

contract TRC20DecimalsMock is TRC20 {
    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) TRC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
