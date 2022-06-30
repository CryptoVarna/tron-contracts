// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Create2.sol";
import "../utils/introspection/TRC1820Implementer.sol";

contract Create2Impl {
    function deploy(
        uint256 value,
        bytes32 salt,
        bytes memory code
    ) public {
        Create2.deploy(value, salt, code);
    }

    function deployTRC1820Implementer(uint256 value, bytes32 salt) public {
        Create2.deploy(value, salt, type(TRC1820Implementer).creationCode);
    }

    function computeAddress(bytes32 salt, bytes32 codeHash)
        public
        view
        returns (address)
    {
        return Create2.computeAddress(salt, codeHash);
    }

    function computeAddressWithDeployer(
        bytes32 salt,
        bytes32 codeHash,
        address deployer
    ) public pure returns (address) {
        return Create2.computeAddress(salt, codeHash, deployer);
    }

    receive() external payable {}
}
