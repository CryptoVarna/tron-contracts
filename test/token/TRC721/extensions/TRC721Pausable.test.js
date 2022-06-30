const { BN, constants, expectRevert, createContract, account, waitUnconfirmedTransaction } =
    require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");

const TRC721PausableMock = artifacts.require("TRC721PausableMock");

contract("TRC721Pausable", function (accounts) {
    const [owner, receiver, operator] = accounts;

    const name = "Non Fungible Token";
    const symbol = "NFT";

    beforeEach(async function () {
        this.token = await createContract(TRC721PausableMock, name, symbol);
    });

    context("when token is paused", function () {
        const firstTokenId = new BN(1);
        const secondTokenId = new BN(1337);

        const mockData = "0x42";

        beforeEach(async function () {
            account.setDefault(owner);
            await this.token.mint(owner, firstTokenId.toFixed()).send();
            const txId = await this.token.pause().send();
            await waitUnconfirmedTransaction(txId);
        });

        it("reverts when trying to transferFrom", async function () {
            account.setDefault(owner);
            await expectRevert(
                this.token.transferFrom(owner, receiver, firstTokenId.toFixed()).send(),
                "TRC721Pausable: token transfer while paused",
            );
        });

        it("reverts when trying to safeTransferFrom", async function () {
            account.setDefault(owner);
            await expectRevert(
                this.token.safeTransferFrom(owner, receiver, firstTokenId.toFixed()).send(),
                "TRC721Pausable: token transfer while paused",
            );
        });

        it("reverts when trying to safeTransferFrom with data", async function () {
            account.setDefault(owner);
            await expectRevert(
                this.token.methods["safeTransferFrom(address,address,uint256,bytes)"](
                    owner, receiver, firstTokenId.toFixed(), mockData,
                ).send(), "TRC721Pausable: token transfer while paused",
            );
        });

        it("reverts when trying to mint", async function () {
            await expectRevert(
                this.token.mint(receiver, secondTokenId.toFixed()).send(),
                "TRC721Pausable: token transfer while paused",
            );
        });

        it("reverts when trying to burn", async function () {
            await expectRevert(
                this.token.burn(firstTokenId.toFixed()).send(),
                "TRC721Pausable: token transfer while paused",
            );
        });

        describe("getApproved", function () {
            it("returns approved address", async function () {
                const approvedAccount = await this.token.getApproved(firstTokenId.toFixed()).call();
                expect(approvedAccount).to.equal(ZERO_ADDRESS);
            });
        });

        describe("balanceOf", function () {
            it("returns the amount of tokens owned by the given address", async function () {
                const balance = await this.token.balanceOf(owner).call();
                expect(balance).to.be.bignumber.equal("1");
            });
        });

        describe("ownerOf", function () {
            it("returns the amount of tokens owned by the given address", async function () {
                const ownerOfToken = await this.token.ownerOf(firstTokenId.toFixed()).call();
                expect(ownerOfToken).to.equal(account.toHexAddress(owner));
            });
        });

        describe("exists", function () {
            it("returns token existence", async function () {
                expect(await this.token.exists(firstTokenId.toFixed()).call()).to.equal(true);
            });
        });

        describe("isApprovedForAll", function () {
            it("returns the approval of the operator", async function () {
                expect(await this.token.isApprovedForAll(owner, operator).call()).to.equal(false);
            });
        });
    });
});
