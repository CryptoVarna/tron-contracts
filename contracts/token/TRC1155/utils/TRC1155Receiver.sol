// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ITRC1155Receiver.sol";
import "../../../utils/introspection/TRC165.sol";

/**
 * @dev _Available since v3.1._
 */
abstract contract TRC1155Receiver is TRC165, ITRC1155Receiver {
    /**
     * @dev See {ITRC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(TRC165, ITRC165)
        returns (bool)
    {
        return
            interfaceId == type(ITRC1155Receiver).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
