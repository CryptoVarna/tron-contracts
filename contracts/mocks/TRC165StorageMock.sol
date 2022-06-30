// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/TRC165Storage.sol";

contract TRC165StorageMock is TRC165Storage {
    function registerInterface(bytes4 interfaceId) public {
        _registerInterface(interfaceId);
    }
}
