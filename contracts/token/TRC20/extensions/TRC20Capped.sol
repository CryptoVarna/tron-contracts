// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../TRC20.sol";

/**
 * @dev Extension of {TRC20} that adds a cap to the supply of tokens.
 */
abstract contract TRC20Capped is TRC20 {
    uint256 private immutable _cap;

    /**
     * @dev Sets the value of the `cap`. This value is immutable, it can only be
     * set once during construction.
     */
    constructor(uint256 cap_) {
        require(cap_ > 0, "TRC20Capped: cap is 0");
        _cap = cap_;
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view virtual returns (uint256) {
        return _cap;
    }

    /**
     * @dev See {TRC20-_mint}.
     */
    function _mint(address account, uint256 amount) internal virtual override {
        require(
            TRC20.totalSupply() + amount <= cap(),
            "TRC20Capped: cap exceeded"
        );
        super._mint(account, amount);
    }
}
