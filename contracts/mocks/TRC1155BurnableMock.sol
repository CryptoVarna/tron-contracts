// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC1155/extensions/TRC1155Burnable.sol";

contract TRC1155BurnableMock is TRC1155Burnable {
    constructor(string memory uri) TRC1155(uri) {}

    function mint(
        address to,
        uint256 id,
        uint256 value,
        bytes memory data
    ) public {
        _mint(to, id, value, data);
    }
}
