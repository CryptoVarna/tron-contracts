// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TRC1155Receiver.sol";

/**
 * @dev _Available since v3.1._
 */
contract TRC1155Holder is TRC1155Receiver {
    function onTRC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onTRC1155Received.selector;
    }

    function onTRC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onTRC1155BatchReceived.selector;
    }
}
