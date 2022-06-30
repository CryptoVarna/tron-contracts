// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/TRC1820Implementer.sol";

contract TRC1820ImplementerMock is TRC1820Implementer {
    function registerInterfaceForAddress(bytes32 interfaceHash, address account)
        public
    {
        _registerInterfaceForAddress(interfaceHash, account);
    }
}
