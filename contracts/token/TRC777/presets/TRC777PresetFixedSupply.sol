// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../TRC777.sol";

/**
 * @dev {TRC777} token, including:
 *
 *  - Preminted initial supply
 *  - No access control mechanism (for minting/pausing) and hence no governance
 *
 * _Available since v3.4._
 */
contract TRC777PresetFixedSupply is TRC777 {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {TRC777-constructor}.
     */
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators,
        uint256 initialSupply,
        address owner
    ) TRC777(name, symbol, defaultOperators) {
        _mint(owner, initialSupply, "", "");
    }
}
