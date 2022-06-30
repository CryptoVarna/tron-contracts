// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../extensions/TRC20Burnable.sol";

/**
 * @dev {TRC20} token, including:
 *
 *  - Preminted initial supply
 *  - Ability for holders to burn (destroy) their tokens
 *  - No access control mechanism (for minting/pausing) and hence no governance
 *
 * This contract uses {TRC20Burnable} to include burn capabilities - head to
 * its documentation for details.
 *
 * _Available since v3.4._
 */
contract TRC20PresetFixedSupply is TRC20Burnable {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {TRC20-constructor}.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) TRC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
