// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC721/extensions/TRC721Burnable.sol";

contract TRC721BurnableMock is TRC721Burnable {
    constructor(string memory name, string memory symbol)
        TRC721(name, symbol)
    {}

    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        _safeMint(to, tokenId, _data);
    }

    function ownerOfMock(uint256 tokenId) external returns (address owner) {
        return ownerOf(tokenId);
    }

    function getApprovedMock(uint256 tokenId) public returns (address) {
        return getApproved(tokenId);
    }
}
