// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/TRC721/extensions/TRC721Enumerable.sol";

/**
 * @title TRC721Mock
 * This mock just provides a public safeMint, mint, and burn functions for testing purposes
 */
contract TRC721EnumerableMock is TRC721Enumerable {
    string private _baseTokenURI;

    constructor(string memory name, string memory symbol)
        TRC721(name, symbol)
    {}

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseTokenURI) public {
        _baseTokenURI = newBaseTokenURI;
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

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

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function balanceOfMock(address owner) external returns (uint256 balance) {
        return balanceOf(owner);
    }

    function ownerOfMock(uint256 tokenId) external returns (address owner) {
        return ownerOf(tokenId);
    }

    function getApprovedMock(uint256 tokenId) public returns (address) {
        return getApproved(tokenId);
    }

    function tokenURIMock(uint256 tokenId) public returns (string memory) {
        return tokenURI(tokenId);
    }

    function tokenOfOwnerByIndexMock(address owner, uint256 index)
        external
        returns (uint256 tokenId)
    {
        return tokenOfOwnerByIndex(owner, index);
    }

    function tokenByIndexMock(uint256 index) external returns (uint256) {
        return tokenByIndex(index);
    }
}
