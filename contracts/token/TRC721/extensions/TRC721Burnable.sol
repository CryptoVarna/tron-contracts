// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../TRC721.sol";
import "../../../utils/Context.sol";

/**
 * @title TRC721 Burnable Token
 * @dev TRC721 Token that can be irreversibly burned (destroyed).
 */
abstract contract TRC721Burnable is Context, TRC721 {
    /**
     * @dev Burns `tokenId`. See {TRC721-_burn}.
     *
     * Requirements:
     *
     * - The caller must own `tokenId` or be an approved operator.
     */
    function burn(uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "TRC721Burnable: caller is not owner nor approved"
        );
        _burn(tokenId);
    }
}
