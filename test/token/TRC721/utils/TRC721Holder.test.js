const { BN, createContract, waitUnconfirmedTransaction } = require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

const TRC721Holder = artifacts.require("TRC721Holder");
const TRC721Mock = artifacts.require("TRC721Mock");

contract("TRC721Holder", function (accounts) {
    const [owner] = accounts;

    const name = "Non Fungible Token";
    const symbol = "NFT";

    it("receives an TRC721 token", async function () {
        const token = await createContract(TRC721Mock, name, symbol);
        const tokenId = new BN(1);
        await token.mint(owner, tokenId.toFixed()).send();

        const receiver = await createContract(TRC721Holder);
        const txId = await token.safeTransferFrom(owner, receiver.address, tokenId.toFixed()).send();
        await waitUnconfirmedTransaction(txId);

        expect(await token.ownerOf(tokenId.toFixed()).call()).to.be.equal(receiver.address);
    });
});
