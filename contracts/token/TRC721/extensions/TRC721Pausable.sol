// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../TRC721.sol";
import "../../../security/Pausable.sol";

/**
 * @dev TRC721 token with pausable token transfers, minting and burning.
 *
 * Useful for scenarios such as preventing trades until the end of an evaluation
 * period, or having an emergency switch for freezing all token transfers in the
 * event of a large bug.
 */
abstract contract TRC721Pausable is TRC721, Pausable {
    /**
     * @dev See {TRC721-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the contract must not be paused.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        require(!paused(), "TRC721Pausable: token transfer while paused");
    }
}
