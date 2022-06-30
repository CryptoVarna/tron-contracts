const { createContract } = require("@cryptovarna/tron-test-helpers");
const {
    shouldBehaveLikeTRC721,
    shouldBehaveLikeTRC721Metadata,
    shouldBehaveLikeTRC721Enumerable,
} = require("./TRC721.behavior");

const TRC721Mock = artifacts.require("TRC721EnumerableMock");

contract("TRC721Enumerable", function (accounts) {
    const name = "Non Fungible Token";
    const symbol = "NFT";

    beforeEach(async function () {
        this.token = await createContract(TRC721Mock, name, symbol);
    });

    shouldBehaveLikeTRC721("TRC721", ...accounts);
    shouldBehaveLikeTRC721Metadata("TRC721", name, symbol, ...accounts);
    shouldBehaveLikeTRC721Enumerable("TRC721", ...accounts);
});
