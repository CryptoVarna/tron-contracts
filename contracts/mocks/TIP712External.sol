// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/cryptography/draft-TIP712.sol";
import "../utils/cryptography/ECDSA.sol";

contract TIP712External is TIP712 {
    constructor(string memory name, string memory version)
        TIP712(name, version)
    {}

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function verify(
        bytes memory signature,
        address signer,
        address mailTo,
        string memory mailContents
    ) external view returns (address, address) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("Mail(address to,string contents)"),
                    mailTo,
                    keccak256(bytes(mailContents))
                )
            )
        );
        address recoveredSigner = ECDSA.recover(digest, signature);
        require(recoveredSigner == signer, "TIP712: Invalid signer");
        return (recoveredSigner, signer);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
