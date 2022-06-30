// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ITRC721Receiver.sol";

/**
 * @dev Implementation of the {ITRC721Receiver} interface.
 *
 * Accepts all token transfers.
 * Make sure the contract is able to use its token with {ITRC721-safeTransferFrom}, {ITRC721-approve} or {ITRC721-setApprovalForAll}.
 */
contract TRC721Holder is ITRC721Receiver {
    /**
     * @dev See {ITRC721Receiver-onTRC721Received}.
     *
     * Always returns `ITRC721Receiver.onTRC721Received.selector`.
     */
    function onTRC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onTRC721Received.selector;
    }
}
