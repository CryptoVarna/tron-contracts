const { createContract } = require("@cryptovarna/tron-test-helpers");
const {
    shouldBehaveLikeTRC721,
    shouldBehaveLikeTRC721Metadata,
} = require("./TRC721.behavior");

const TRC721Mock = artifacts.require("TRC721Mock");

contract("TRC721", function (accounts) {
    const name = "Non Fungible Token";
    const symbol = "NFT";

    beforeEach(async function () {
        this.token = await createContract(TRC721Mock, name, symbol);
    });

    shouldBehaveLikeTRC721("TRC721", ...accounts);
    shouldBehaveLikeTRC721Metadata("TRC721", name, symbol, ...accounts);
});
