const { BN, expectRevert, createContract, account, waitUnconfirmedTransaction } =
    require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

const TRC721URIStorageMock = artifacts.require("TRC721URIStorageMock");

contract("TRC721URIStorage", function (accounts) {
    const [owner] = accounts;

    const name = "Non Fungible Token";
    const symbol = "NFT";

    const firstTokenId = new BN("5042");
    const nonExistentTokenId = new BN("13");

    beforeEach(async function () {
        this.token = await createContract(TRC721URIStorageMock, name, symbol);
    });

    describe("token URI", function () {
        beforeEach(async function () {
            const txId = await this.token.mint(owner, firstTokenId.toFixed()).send();
            await waitUnconfirmedTransaction(txId);
        });

        const baseURI = "https://api.com/v1/";
        const sampleUri = "mock://mytoken";

        it("it is empty by default", async function () {
            expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal("");
        });

        it("reverts when queried for non existent token id", async function () {
            await expectRevert(
                this.token.tokenURIMock(nonExistentTokenId.toFixed()).send(),
                "TRC721URIStorage: URI query for nonexistent token",
            );
        });

        it("can be set for a token id", async function () {
            const txId = await this.token.setTokenURI(firstTokenId.toFixed(), sampleUri).send();
            await waitUnconfirmedTransaction(txId);
            expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal(sampleUri);
        });

        it("reverts when setting for non existent token id", async function () {
            await expectRevert(
                this.token.setTokenURI(nonExistentTokenId.toFixed(), sampleUri).send(),
                "TRC721URIStorage: URI set of nonexistent token",
            );
        });

        it("base URI can be set", async function () {
            const txId = await this.token.setBaseURI(baseURI).send();
            await waitUnconfirmedTransaction(txId);
            expect(await this.token.baseURI().call()).to.equal(baseURI);
        });

        it("base URI is added as a prefix to the token URI", async function () {
            await this.token.setBaseURI(baseURI).send();
            const txId = await this.token.setTokenURI(firstTokenId.toFixed(), sampleUri).send();
            await waitUnconfirmedTransaction(txId);

            expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal(baseURI + sampleUri);
        });

        it("token URI can be changed by changing the base URI", async function () {
            await this.token.setBaseURI(baseURI).send();
            let txId = await this.token.setTokenURI(firstTokenId.toFixed(), sampleUri).send();
            await waitUnconfirmedTransaction(txId);

            const newBaseURI = "https://api.com/v2/";
            txId = await this.token.setBaseURI(newBaseURI).send();
            await waitUnconfirmedTransaction(txId);
            expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal(newBaseURI + sampleUri);
        });

        it("tokenId is appended to base URI for tokens with no URI", async function () {
            const txId = await this.token.setBaseURI(baseURI).send();
            await waitUnconfirmedTransaction(txId);

            expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal(baseURI + firstTokenId);
        });

        it("tokens without URI can be burnt ", async function () {
            account.setDefault(owner);
            const txId = await this.token.burn(firstTokenId.toFixed()).send();
            await waitUnconfirmedTransaction(txId);

            expect(await this.token.exists(firstTokenId.toFixed()).call()).to.equal(false);
            await expectRevert(
                this.token.tokenURIMock(firstTokenId.toFixed()).send(),
                "TRC721URIStorage: URI query for nonexistent token",
            );
        });

        it("tokens with URI can be burnt ", async function () {
            await this.token.setTokenURI(firstTokenId.toFixed(), sampleUri).send();
            const txId = await this.token.burn(firstTokenId.toFixed()).send();
            await waitUnconfirmedTransaction(txId);

            expect(await this.token.exists(firstTokenId.toFixed()).call()).to.equal(false);
            await expectRevert(
                this.token.tokenURIMock(firstTokenId.toFixed()).send(),
                "TRC721URIStorage: URI query for nonexistent token",
            );
        });
    });
});
