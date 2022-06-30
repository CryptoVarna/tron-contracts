const { BN, constants, expectEvent, expectRevert, createContract, account, waitUnconfirmedTransaction } =
    require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS_ETH } = constants;

const { expect } = require("chai");

const TRC721BurnableMock = artifacts.require("TRC721BurnableMock");

contract("TRC721Burnable", function (accounts) {
    const [owner, approved] = accounts;

    const firstTokenId = new BN(1);
    const secondTokenId = new BN(2);
    const unknownTokenId = new BN(3);

    const name = "Non Fungible Token";
    const symbol = "NFT";

    beforeEach(async function () {
        this.token = await createContract(TRC721BurnableMock, name, symbol);
    });

    describe("like a burnable TRC721", function () {
        beforeEach(async function () {
            await this.token.mint(owner, firstTokenId.toFixed()).send();
            const txId = await this.token.mint(owner, secondTokenId.toFixed()).send();
            await waitUnconfirmedTransaction(txId);
        });

        describe("burn", function () {
            const tokenId = firstTokenId;
            let txId = null;

            describe("when successful", function () {
                beforeEach(async function () {
                    account.setDefault(owner);
                    txId = await this.token.burn(tokenId.toFixed()).send();
                });

                it("burns the given token ID and adjusts the balance of the owner", async function () {
                    await expectRevert(
                        this.token.ownerOfMock(tokenId.toFixed()).send(),
                        "TRC721: owner query for nonexistent token",
                    );
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("1");
                });

                it("emits a burn event", async function () {
                    await expectEvent.inTransaction(txId, this.token, "Transfer", {
                        from: account.toHexAddress(owner, true),
                        to: ZERO_ADDRESS_ETH,
                        tokenId: tokenId,
                    });
                });
            });

            describe("when there is a previous approval burned", function () {
                beforeEach(async function () {
                    account.setDefault(owner);
                    await this.token.approve(approved, tokenId.toFixed()).send();
                    txId = await this.token.burn(tokenId.toFixed()).send();
                });

                context("getApproved", function () {
                    it("reverts", async function () {
                        await expectRevert(
                            this.token.getApprovedMock(tokenId.toFixed()).send(),
                            "TRC721: approved query for nonexistent token",
                        );
                    });
                });
            });

            describe("when the given token ID was not tracked by this contract", function () {
                it("reverts", async function () {
                    await expectRevert(
                        this.token.burn(unknownTokenId.toFixed()).send(),
                        "TRC721: operator query for nonexistent token",
                    );
                });
            });
        });
    });
});
