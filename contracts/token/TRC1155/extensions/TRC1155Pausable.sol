// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../TRC1155.sol";
import "../../../security/Pausable.sol";

/**
 * @dev TRC1155 token with pausable token transfers, minting and burning.
 *
 * Useful for scenarios such as preventing trades until the end of an evaluation
 * period, or having an emergency switch for freezing all token transfers in the
 * event of a large bug.
 *
 * _Available since v3.1._
 */
abstract contract TRC1155Pausable is TRC1155, Pausable {
    /**
     * @dev See {TRC1155-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        require(!paused(), "TRC1155Pausable: token transfer while paused");
    }
}
