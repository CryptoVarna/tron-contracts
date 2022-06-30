// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TRC1155Mock.sol";
import "../token/TRC1155/extensions/TRC1155Supply.sol";

contract TRC1155SupplyMock is TRC1155Mock, TRC1155Supply {
    constructor(string memory uri) TRC1155Mock(uri) {}

    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override(TRC1155, TRC1155Supply) {
        super._mint(account, id, amount, data);
    }

    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override(TRC1155, TRC1155Supply) {
        super._mintBatch(to, ids, amounts, data);
    }

    function _burn(
        address account,
        uint256 id,
        uint256 amount
    ) internal virtual override(TRC1155, TRC1155Supply) {
        super._burn(account, id, amount);
    }

    function _burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual override(TRC1155, TRC1155Supply) {
        super._burnBatch(account, ids, amounts);
    }
}
