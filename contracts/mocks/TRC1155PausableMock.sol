// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TRC1155Mock.sol";
import "../token/TRC1155/extensions/TRC1155Pausable.sol";

contract TRC1155PausableMock is TRC1155Mock, TRC1155Pausable {
    constructor(string memory uri) TRC1155Mock(uri) {}

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(TRC1155, TRC1155Pausable) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
