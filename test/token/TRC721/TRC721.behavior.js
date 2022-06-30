const { BN, constants, expectEvent, expectRevert, createContract, account, bytes, waitUnconfirmedTransaction } =
    require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { ZERO_ADDRESS_ETH, ZERO_ADDRESS } = constants;

const { shouldSupportInterfaces } = require("../../utils/introspection/SupportsInterface.behavior");

const TRC721ReceiverMock = artifacts.require("TRC721ReceiverMock");

const Error = ["None", "RevertWithMessage", "RevertWithoutMessage", "Panic"]
    .reduce((acc, entry, idx) => Object.assign({ [entry]: idx }, acc), {});

const firstTokenId = new BN("5042");
const secondTokenId = new BN("79217");
const nonExistentTokenId = new BN("13");
const baseURI = "https://api.com/v1/";

// Replace magic value for IERC721Receiver.onERC721Received -> ITRC721Receiver.onTRC721Received
// const RECEIVER_MAGIC_VALUE = "0x150b7a02";
const RECEIVER_MAGIC_VALUE = "0x5175f878";

function shouldBehaveLikeTRC721(errorPrefix, owner, newOwner, approved, anotherApproved, operator, other) {
    shouldSupportInterfaces([
        "TRC165",
        "TRC721",
    ]);

    context("with minted tokens", function () {
        beforeEach(async function () {
            await this.token.mint(owner, firstTokenId.toFixed()).send();
            const tx = await this.token.mint(owner, secondTokenId.toFixed()).send();
            await waitUnconfirmedTransaction(tx);
            this.toWhom = other; // default to other for toWhom in context-dependent tests
        });

        describe("balanceOf", function () {
            context("when the given address owns some tokens", function () {
                it("returns the amount of tokens owned by the given address", async function () {
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("2");
                });
            });

            context("when the given address does not own any tokens", function () {
                it("returns 0", async function () {
                    expect(await this.token.balanceOf(other).call()).to.be.bignumber.equal("0");
                });
            });

            context("when querying the zero address", function () {
                it("throws", async function () {
                    await expectRevert(
                        this.token.balanceOfMock(ZERO_ADDRESS).send(), "TRC721: balance query for the zero address",
                    );
                });
            });
        });

        describe("ownerOf", function () {
            context("when the given token ID was tracked by this token", function () {
                const tokenId = firstTokenId;

                it("returns the owner of the given token ID", async function () {
                    expect(await this.token.ownerOf(tokenId.toFixed()).call()).to.be.equal(account.toHexAddress(owner));
                });
            });

            context("when the given token ID was not tracked by this token", function () {
                const tokenId = nonExistentTokenId;

                it("reverts", async function () {
                    await expectRevert(
                        this.token.ownerOfMock(tokenId.toFixed()).send(), "TRC721: owner query for nonexistent token",
                    );
                });
            });
        });

        describe("transfers", function () {
            const tokenId = firstTokenId;
            const data = "0x42";

            let txId = null;

            beforeEach(async function () {
                account.setDefault(owner);
                await this.token.approve(approved, tokenId.toFixed()).send();
                const tx = await this.token.setApprovalForAll(operator, true).send();
                await waitUnconfirmedTransaction(tx);
            });

            const transferWasSuccessful = function ({ owner, tokenId, approved }) {
                it("transfers the ownership of the given token ID to the given address", async function () {
                    expect(await this.token.ownerOf(tokenId.toFixed()).call()).to.be.equal(account.toHexAddress(this.toWhom));
                });

                it("emits a Transfer event", async function () {
                    await expectEvent.inTransaction(txId, this.token, "Transfer",
                        {
                            from: account.toHexAddress(owner, true),
                            to: account.toHexAddress(this.toWhom, true),
                            tokenId: tokenId,
                        });
                });

                it("clears the approval for the token ID", async function () {
                    expect(await this.token.getApproved(tokenId.toFixed()).call()).to.be.equal(ZERO_ADDRESS);
                });

                it("emits an Approval event", async function () {
                    await expectEvent.inTransaction(txId, this.token, "Approval", {
                        owner: account.toHexAddress(owner, true),
                        approved: ZERO_ADDRESS_ETH,
                        tokenId: tokenId,
                    });
                });

                it("adjusts owners balances", async function () {
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("1");
                });

                it("adjusts owners tokens by index", async function () {
                    if (!this.token.tokenOfOwnerByIndex) return;

                    expect(await this.token.tokenOfOwnerByIndex(this.toWhom, 0).call()).to.be.bignumber.equal(tokenId);

                    expect(await this.token.tokenOfOwnerByIndex(owner, 0).call()).to.be.bignumber.not.equal(tokenId);
                });
            };

            const shouldTransferTokensByUsers = function (transferFunction) {
                context("when called by the owner", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        txId = await transferFunction.call(this, owner, this.toWhom, tokenId);
                    });
                    transferWasSuccessful({ owner, tokenId, approved });
                });

                context("when called by the approved individual", function () {
                    beforeEach(async function () {
                        account.setDefault(approved);
                        txId = await transferFunction.call(this, owner, this.toWhom, tokenId);
                    });
                    transferWasSuccessful({ owner, tokenId, approved });
                });

                context("when called by the operator", function () {
                    beforeEach(async function () {
                        account.setDefault(operator);
                        txId = await transferFunction.call(this, owner, this.toWhom, tokenId);
                    });
                    transferWasSuccessful({ owner, tokenId, approved });
                });

                context("when called by the owner without an approved user", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        // await this.token.approve(ZERO_ADDRESS, tokenId.toFixed()).send({ shouldPollResponse: true });
                        const tx = await this.token.approve(ZERO_ADDRESS, tokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(tx);
                        account.setDefault(operator);
                        txId = await transferFunction.call(this, owner, this.toWhom, tokenId);
                    });
                    transferWasSuccessful({ owner, tokenId, approved: null });
                });

                context("when sent to the owner", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        txId = await transferFunction.call(this, owner, owner, tokenId);
                    });

                    it("keeps ownership of the token", async function () {
                        expect(await this.token.ownerOf(tokenId.toFixed()).call()).to.be.equal(account.toHexAddress(owner));
                    });

                    it("clears the approval for the token ID", async function () {
                        expect(await this.token.getApproved(tokenId.toFixed()).call()).to.be.equal(ZERO_ADDRESS);
                    });

                    it("emits only a transfer event", async function () {
                        await expectEvent.inTransaction(txId, this.token, "Transfer", {
                            from: account.toHexAddress(owner, true),
                            to: account.toHexAddress(owner, true),
                            tokenId: tokenId,
                        });
                    });

                    it("keeps the owner balance", async function () {
                        expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("2");
                    });

                    it("keeps same tokens by index", async function () {
                        if (!this.token.tokenOfOwnerByIndex) return;
                        const tokensListed = await Promise.all(
                            [0, 1].map(i => this.token.tokenOfOwnerByIndex(owner, i).call()),
                        );
                        expect(tokensListed.map(t => t.toNumber())).to.have.members(
                            [firstTokenId.toNumber(), secondTokenId.toNumber()],
                        );
                    });
                });

                context("when the address of the previous owner is incorrect", function () {
                    it("reverts", async function () {
                        account.setDefault(owner);
                        await expectRevert(
                            transferFunction.call(this, other, other, tokenId),
                            "TRC721: transfer of token that is not own",
                        );
                    });
                });

                context("when the sender is not authorized for the token id", function () {
                    it("reverts", async function () {
                        account.setDefault(other);
                        await expectRevert(
                            transferFunction.call(this, owner, other, tokenId),
                            "TRC721: transfer caller is not owner nor approved",
                        );
                    });
                });

                context("when the given token ID does not exist", function () {
                    it("reverts", async function () {
                        account.setDefault(owner);
                        await expectRevert(
                            transferFunction.call(this, owner, other, nonExistentTokenId),
                            "TRC721: operator query for nonexistent token",
                        );
                    });
                });

                context("when the address to transfer the token to is the zero address", function () {
                    it("reverts", async function () {
                        account.setDefault(owner);
                        await expectRevert(
                            transferFunction.call(this, owner, ZERO_ADDRESS, tokenId),
                            "TRC721: transfer to the zero address",
                        );
                    });
                });
            };

            describe("via transferFrom", function () {
                shouldTransferTokensByUsers(function (from, to, tokenId, opts) {
                    return this.token.transferFrom(from, to, tokenId.toFixed()).send(opts);
                });
            });

            describe("via safeTransferFrom", function () {
                const safeTransferFromWithData = function (from, to, tokenId, opts) {
                    return this.token.methods["safeTransferFrom(address,address,uint256,bytes)"](from, to, tokenId.toFixed(), data).send(opts);
                };

                const safeTransferFromWithoutData = function (from, to, tokenId, opts) {
                    return this.token.methods["safeTransferFrom(address,address,uint256)"](from, to, tokenId.toFixed()).send(opts);
                };

                const shouldTransferSafely = function (transferFun, data) {
                    describe("to a user account", function () {
                        shouldTransferTokensByUsers(transferFun);
                    });

                    describe("to a valid receiver contract", function () {
                        beforeEach(async function () {
                            this.receiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.None);
                            this.toWhom = this.receiver.address;
                        });

                        shouldTransferTokensByUsers(transferFun);

                        it("calls onTRC721Received", async function () {
                            account.setDefault(owner);
                            const txId = await transferFun.call(this, owner, this.receiver.address, tokenId);

                            const expectedObject = {
                                operator: account.toHexAddress(owner, true),
                                from: account.toHexAddress(owner, true),
                                tokenId: tokenId,
                            };
                            if (data) {
                                expectedObject.data = bytes.without0x(data);
                            }
                            await expectEvent.inTransaction(txId, this.receiver, "Received", expectedObject);
                        });

                        it("calls onTRC721Received from approved", async function () {
                            account.setDefault(approved);
                            const txId = await transferFun.call(this, owner, this.receiver.address, tokenId);

                            const expectedObject = {
                                operator: account.toHexAddress(approved, true),
                                from: account.toHexAddress(owner, true),
                                tokenId: tokenId,
                            };
                            if (data) {
                                expectedObject.data = bytes.without0x(data);
                            }
                            await expectEvent.inTransaction(txId, this.receiver, "Received", expectedObject);
                        });

                        describe("with an invalid token id", function () {
                            it("reverts", async function () {
                                account.setDefault(owner);
                                await expectRevert(
                                    transferFun.call(
                                        this,
                                        owner,
                                        this.receiver.address,
                                        nonExistentTokenId,
                                    ),
                                    "TRC721: operator query for nonexistent token",
                                );
                            });
                        });
                    });
                };

                describe("with data", function () {
                    shouldTransferSafely(safeTransferFromWithData, data);
                });

                describe("without data", function () {
                    shouldTransferSafely(safeTransferFromWithoutData, null);
                });

                describe("to a receiver contract returning unexpected value", function () {
                    it("reverts", async function () {
                        const invalidReceiver = await createContract(TRC721ReceiverMock, "0x42000000", Error.None);
                        account.setDefault(owner);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, invalidReceiver.address, tokenId.toFixed()).send(),
                            "TRC721: transfer to non TRC721Receiver implementer",
                        );
                    });
                });

                describe("to a receiver contract that reverts with message", function () {
                    it("reverts", async function () {
                        const revertingReceiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
                        account.setDefault(owner);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId.toFixed()).send(),
                            "TRC721ReceiverMock: reverting",
                        );
                    });
                });

                describe("to a receiver contract that reverts without message", function () {
                    it("reverts", async function () {
                        const revertingReceiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
                        account.setDefault(owner);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId.toFixed()).send(),
                            "TRC721: transfer to non TRC721Receiver implementer",
                        );
                    });
                });

                describe("to a receiver contract that panics", function () {
                    it("reverts", async function () {
                        const revertingReceiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.Panic);
                        account.setDefault(owner);
                        await expectRevert.assertion(
                            this.token.safeTransferFrom(owner, revertingReceiver.address, tokenId.toFixed()).send(),
                        );
                    });
                });

                describe("to a contract that does not implement the required function", function () {
                    it("reverts", async function () {
                        const nonReceiver = this.token;
                        account.setDefault(owner);
                        await expectRevert(
                            this.token.safeTransferFrom(owner, nonReceiver.address, tokenId.toFixed()).send(),
                            "TRC721: transfer to non TRC721Receiver implementer",
                        );
                    });
                });
            });
        });

        describe("safe mint", function () {
            const fourthTokenId = new BN(4);
            const tokenId = fourthTokenId;
            const data = "0x42";

            describe("via safeMint", function () { // regular minting is tested in TRC721Mintable.test.js and others

                const safeMintWithData = function (to, tokenId, opts) {
                    return this.token.methods["safeMint(address,uint256,bytes)"](to, tokenId.toFixed(), data).send(opts);
                };

                const safeMintWithoutData = function (to, tokenId, opts) {
                    return this.token.methods["safeMint(address,uint256)"](to, tokenId.toFixed()).send(opts);
                };

                it("calls onTRC721Received — with data", async function () {
                    this.receiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.None);
                    const txId = await safeMintWithData.call(this, this.receiver.address, tokenId);

                    await expectEvent.inTransaction(txId, this.receiver, "Received", {
                        from: ZERO_ADDRESS_ETH,
                        tokenId: tokenId,
                        data: bytes.without0x(data),
                    });
                });

                it("calls onTRC721Received — without data", async function () {
                    this.receiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.None);
                    const txId = await safeMintWithoutData.call(this, this.receiver.address, tokenId);

                    await expectEvent.inTransaction(txId, this.receiver, "Received", {
                        from: ZERO_ADDRESS_ETH,
                        tokenId: tokenId,
                    });
                });

                context("to a receiver contract returning unexpected value", function () {
                    it("reverts", async function () {
                        const invalidReceiver = await createContract(TRC721ReceiverMock, "0x42000000", Error.None);
                        await expectRevert(
                            safeMintWithoutData.call(this, invalidReceiver.address, tokenId),
                            "TRC721: transfer to non TRC721Receiver implementer",
                        );
                    });
                });

                context("to a receiver contract that reverts with message", function () {
                    it("reverts", async function () {
                        const revertingReceiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.RevertWithMessage);
                        await expectRevert(
                            safeMintWithoutData.call(this, revertingReceiver.address, tokenId),
                            "TRC721ReceiverMock: reverting",
                        );
                    });
                });

                context("to a receiver contract that reverts without message", function () {
                    it("reverts", async function () {
                        const revertingReceiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.RevertWithoutMessage);
                        await expectRevert(
                            safeMintWithoutData.call(this, revertingReceiver.address, tokenId),
                            "TRC721: transfer to non TRC721Receiver implementer",
                        );
                    });
                });

                context("to a receiver contract that panics", function () {
                    it("reverts", async function () {
                        const revertingReceiver = await createContract(TRC721ReceiverMock, RECEIVER_MAGIC_VALUE, Error.Panic);
                        await expectRevert.assertion(
                            safeMintWithoutData.call(this, revertingReceiver.address, tokenId),
                        );
                    });
                });

                context("to a contract that does not implement the required function", function () {
                    it("reverts", async function () {
                        const nonReceiver = this.token;
                        await expectRevert(
                            safeMintWithoutData.call(this, nonReceiver.address, tokenId),
                            "TRC721: transfer to non TRC721Receiver implementer",
                        );
                    });
                });
            });
        });

        describe("approve", function () {
            const tokenId = firstTokenId;

            let txId = null;

            const itClearsApproval = function () {
                it("clears approval for the token", async function () {
                    expect(await this.token.getApproved(tokenId.toFixed()).call()).to.be.equal(ZERO_ADDRESS);
                });
            };

            const itApproves = function (address) {
                it("sets the approval for the target address", async function () {
                    expect(await this.token.getApproved(tokenId.toFixed()).call()).to.be.equal(account.toHexAddress(address));
                });
            };

            const itEmitsApprovalEvent = function (address) {
                it("emits an approval event", async function () {
                    await expectEvent.inTransaction(txId, this.token, "Approval", {
                        owner: account.toHexAddress(owner, true),
                        approved: account.toHexAddress(address, true),
                        tokenId: tokenId,
                    });
                });
            };

            context("when clearing approval", function () {
                context("when there was no prior approval", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        txId = await this.token.approve(ZERO_ADDRESS, tokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    itClearsApproval();
                    itEmitsApprovalEvent(ZERO_ADDRESS_ETH);
                });

                context("when there was a prior approval", function () {
                    beforeEach(async function () {
                        await this.token.approve(approved, tokenId.toFixed()).send();
                        txId = await this.token.approve(ZERO_ADDRESS, tokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    itClearsApproval();
                    itEmitsApprovalEvent(ZERO_ADDRESS_ETH);
                });
            });

            context("when approving a non-zero address", function () {
                context("when there was no prior approval", function () {
                    beforeEach(async function () {
                        txId = await this.token.approve(approved, tokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    itApproves(approved);
                    itEmitsApprovalEvent(approved);
                });

                context("when there was a prior approval to the same address", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        await this.token.approve(approved, tokenId.toFixed()).send();
                        txId = await this.token.approve(approved, tokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    itApproves(approved);
                    itEmitsApprovalEvent(approved);
                });

                context("when there was a prior approval to a different address", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        await this.token.approve(anotherApproved, tokenId.toFixed()).send();
                        txId = await this.token.approve(anotherApproved, tokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    itApproves(anotherApproved);
                    itEmitsApprovalEvent(anotherApproved);
                });
            });

            context("when the address that receives the approval is the owner", function () {
                it("reverts", async function () {
                    account.setDefault(owner);
                    await expectRevert(
                        this.token.approve(owner, tokenId.toFixed()).send(), "TRC721: approval to current owner",
                    );
                });
            });

            context("when the sender does not own the given token ID", function () {
                it("reverts", async function () {
                    account.setDefault(other);
                    await expectRevert(this.token.approve(approved, tokenId.toFixed()).send(),
                        "TRC721: approve caller is not owner nor approved for all");
                });
            });

            context("when the sender is approved for the given token ID", function () {
                it("reverts", async function () {
                    account.setDefault(owner);
                    await this.token.approve(approved, tokenId.toFixed()).send();
                    account.setDefault(approved);
                    await expectRevert(this.token.approve(anotherApproved, tokenId.toFixed()).send(),
                        "TRC721: approve caller is not owner nor approved for all");
                });
            });

            context("when the sender is an operator", function () {
                beforeEach(async function () {
                    account.setDefault(owner);
                    await this.token.setApprovalForAll(operator, true).send();
                    account.setDefault(operator);
                    txId = await this.token.approve(approved, tokenId.toFixed()).send();
                    await waitUnconfirmedTransaction(txId);
                });

                itApproves(approved);
                itEmitsApprovalEvent(approved);
            });

            context("when the given token ID does not exist", function () {
                it("reverts", async function () {
                    account.setDefault(operator);
                    await expectRevert(this.token.approve(approved, nonExistentTokenId.toFixed()).send(),
                        "TRC721: owner query for nonexistent token");
                });
            });
        });

        describe("setApprovalForAll", function () {
            context("when the operator willing to approve is not the owner", function () {
                context("when there is no operator approval set by the sender", function () {
                    it("approves the operator", async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, true).send();
                        await waitUnconfirmedTransaction(txId);

                        expect(await this.token.isApprovedForAll(owner, operator).call()).to.equal(true);
                    });

                    it("emits an approval event", async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, true).send();

                        await expectEvent.inTransaction(txId, this.token, "ApprovalForAll", {
                            owner: account.toHexAddress(owner, true),
                            operator: account.toHexAddress(operator, true),
                            approved: "true",
                        });
                    });
                });

                context("when the operator was set as not approved", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, false).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    it("approves the operator", async function () {
                        const txId = await this.token.setApprovalForAll(operator, true).send();
                        await waitUnconfirmedTransaction(txId);

                        expect(await this.token.isApprovedForAll(owner, operator).call()).to.equal(true);
                    });

                    it("emits an approval event", async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, true).send();

                        await expectEvent.inTransaction(txId, this.token, "ApprovalForAll", {
                            owner: account.toHexAddress(owner, true),
                            operator: account.toHexAddress(operator, true),
                            approved: "true",
                        });
                    });

                    it("can unset the operator approval", async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, false).send();
                        await waitUnconfirmedTransaction(txId);

                        expect(await this.token.isApprovedForAll(owner, operator).call()).to.equal(false);
                    });
                });

                context("when the operator was already approved", function () {
                    beforeEach(async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, true).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    it("keeps the approval to the given address", async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, true).send();
                        await waitUnconfirmedTransaction(txId);

                        expect(await this.token.isApprovedForAll(owner, operator).call()).to.equal(true);
                    });

                    it("emits an approval event", async function () {
                        account.setDefault(owner);
                        const txId = await this.token.setApprovalForAll(operator, true).send();

                        await expectEvent.inTransaction(txId, this.token, "ApprovalForAll", {
                            owner: account.toHexAddress(owner, true),
                            operator: account.toHexAddress(operator, true),
                            approved: "true",
                        });
                    });
                });
            });

            context("when the operator is the owner", function () {
                it("reverts", async function () {
                    account.setDefault(owner);
                    await expectRevert(this.token.setApprovalForAll(owner, true).send(),
                        "TRC721: approve to caller");
                });
            });
        });

        describe("getApproved", async function () {
            context("when token is not minted", async function () {
                it("reverts", async function () {
                    await expectRevert(
                        this.token.getApprovedMock(nonExistentTokenId.toFixed()).send(),
                        "TRC721: approved query for nonexistent token",
                    );
                });
            });

            context("when token has been minted ", async function () {
                it("should return the zero address", async function () {
                    expect(await this.token.getApproved(firstTokenId.toFixed()).call()).to.be.equal(
                        ZERO_ADDRESS,
                    );
                });

                context("when account has been approved", async function () {
                    beforeEach(async function () {
                        const txId = await this.token.approve(approved, firstTokenId.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                    });

                    it("returns approved account", async function () {
                        expect(await this.token.getApproved(firstTokenId.toFixed()).call()).to.be.equal(account.toHexAddress(approved));
                    });
                });
            });
        });
    });

    describe("_mint(address, uint256)", function () {
        it("reverts with a null destination address", async function () {
            await expectRevert(
                this.token.mint(ZERO_ADDRESS, firstTokenId.toFixed()).send(), "TRC721: mint to the zero address",
            );
        });

        context("with minted token", async function () {
            beforeEach(async function () {
                this.txId = await this.token.mint(owner, firstTokenId.toFixed()).send();
                await waitUnconfirmedTransaction(this.txId);
            });

            it("emits a Transfer event", async function () {
                await expectEvent.inTransaction(this.txId, this.token, "Transfer", {
                    from: ZERO_ADDRESS_ETH,
                    to: account.toHexAddress(owner, true),
                    tokenId: firstTokenId,
                });
            });

            it("creates the token", async function () {
                expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("1");
                expect(await this.token.ownerOf(firstTokenId.toFixed()).call()).to.equal(account.toHexAddress(owner));
            });

            it("reverts when adding a token id that already exists", async function () {
                await expectRevert(this.token.mint(owner, firstTokenId.toFixed()).send(), "TRC721: token already minted");
            });
        });
    });

    describe("_burn", function () {
        it("reverts when burning a non-existent token id", async function () {
            await expectRevert(
                this.token.burn(firstTokenId.toFixed()).send(), "TRC721: owner query for nonexistent token",
            );
        });

        context("with minted tokens", function () {
            beforeEach(async function () {
                await this.token.mint(owner, firstTokenId.toFixed()).send();
                const txId = await this.token.mint(owner, secondTokenId.toFixed()).send();
                await waitUnconfirmedTransaction(txId);
            });

            context("with burnt token", function () {
                beforeEach(async function () {
                    this.txId = await this.token.burn(firstTokenId.toFixed()).send();
                });

                it("emits a Transfer event", async function () {
                    await expectEvent.inTransaction(this.txId, this.token, "Transfer", {
                        from: account.toHexAddress(owner, true),
                        to: ZERO_ADDRESS_ETH,
                        tokenId: firstTokenId,
                    });
                });

                it("emits an Approval event", async function () {
                    await expectEvent.inTransaction(this.txId, this.token, "Approval", {
                        owner: account.toHexAddress(owner, true),
                        approved: ZERO_ADDRESS_ETH,
                        tokenId: firstTokenId,
                    });
                });

                it("deletes the token", async function () {
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("1");
                    await expectRevert(
                        this.token.ownerOfMock(firstTokenId.toFixed()).send(), "TRC721: owner query for nonexistent token",
                    );
                });

                it("reverts when burning a token id that has been deleted", async function () {
                    await expectRevert(
                        this.token.burn(firstTokenId.toFixed()).send(), "TRC721: owner query for nonexistent token",
                    );
                });
            });
        });
    });
}

function shouldBehaveLikeTRC721Enumerable(errorPrefix, owner, newOwner, approved, anotherApproved, operator, other) {
    shouldSupportInterfaces([
        "TRC721Enumerable",
    ]);

    context("with minted tokens", function () {
        beforeEach(async function () {
            await this.token.mint(owner, firstTokenId.toFixed()).send();
            const txId = await this.token.mint(owner, secondTokenId.toFixed()).send();
            await waitUnconfirmedTransaction(txId);
            this.toWhom = other; // default to other for toWhom in context-dependent tests
        });

        describe("totalSupply", function () {
            it("returns total token supply", async function () {
                expect(await this.token.totalSupply().call()).to.be.bignumber.equal("2");
            });
        });

        describe("tokenOfOwnerByIndex", function () {
            describe("when the given index is lower than the amount of tokens owned by the given address", function () {
                it("returns the token ID placed at the given index", async function () {
                    expect(await this.token.tokenOfOwnerByIndex(owner, 0).call()).to.be.bignumber.equal(firstTokenId);
                });
            });

            describe("when the index is greater than or equal to the total tokens owned by the given address", function () {
                it("reverts", async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndexMock(owner, 2).send(), "TRC721Enumerable: owner index out of bounds",
                    );
                });
            });

            describe("when the given address does not own any token", function () {
                it("reverts", async function () {
                    await expectRevert(
                        this.token.tokenOfOwnerByIndexMock(other, 0).send(), "TRC721Enumerable: owner index out of bounds",
                    );
                });
            });

            describe("after transferring all tokens to another user", function () {
                beforeEach(async function () {
                    account.setDefault(owner);
                    await this.token.transferFrom(owner, other, firstTokenId.toFixed()).send();
                    const txId = await this.token.transferFrom(owner, other, secondTokenId.toFixed()).send();
                    await waitUnconfirmedTransaction(txId);
                });

                it("returns correct token IDs for target", async function () {
                    expect(await this.token.balanceOf(other).call()).to.be.bignumber.equal("2");
                    const tokensListed = await Promise.all(
                        [0, 1].map(i => this.token.tokenOfOwnerByIndex(other, i).call()),
                    );
                    expect(tokensListed.map(t => t.toNumber())).to.have.members([firstTokenId.toNumber(), secondTokenId.toNumber()]);
                });

                it("returns empty collection for original owner", async function () {
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal("0");
                    await expectRevert(
                        this.token.tokenOfOwnerByIndexMock(owner, 0).send(), "TRC721Enumerable: owner index out of bounds",
                    );
                });
            });
        });

        describe("tokenByIndex", function () {
            it("returns all tokens", async function () {
                const tokensListed = await Promise.all(
                    [0, 1].map(i => this.token.tokenByIndex(i).call()),
                );
                expect(tokensListed.map(t => t.toNumber())).to.have.members([firstTokenId.toNumber(), secondTokenId.toNumber()]);
            });

            it("reverts if index is greater than supply", async function () {
                await expectRevert(
                    this.token.tokenByIndexMock(2).send(), "TRC721Enumerable: global index out of bounds",
                );
            });

            [firstTokenId, secondTokenId].forEach(function (tokenId) {
                it(`returns all tokens after burning token ${tokenId} and minting new tokens`, async function () {
                    const newTokenId = new BN(300);
                    const anotherNewTokenId = new BN(400);

                    await this.token.burn(tokenId.toFixed()).send();
                    await this.token.mint(newOwner, newTokenId.toFixed()).send();
                    const txId = await this.token.mint(newOwner, anotherNewTokenId.toFixed()).send();
                    await waitUnconfirmedTransaction(txId);

                    expect(await this.token.totalSupply().call()).to.be.bignumber.equal("3");

                    const tokensListed = await Promise.all(
                        [0, 1, 2].map(i => this.token.tokenByIndex(i).call()),
                    );
                    const expectedTokens = [firstTokenId, secondTokenId, newTokenId, anotherNewTokenId].filter(
                        x => (x !== tokenId),
                    );
                    expect(tokensListed.map(t => t.toNumber())).to.have.members(expectedTokens.map(t => t.toNumber()));
                });
            });
        });
    });

    describe("_mint(address, uint256)", function () {
        it("reverts with a null destination address", async function () {
            await expectRevert(
                this.token.mint(ZERO_ADDRESS, firstTokenId.toFixed()).send(), "TRC721: mint to the zero address",
            );
        });

        context("with minted token", async function () {
            beforeEach(async function () {
                ({ logs: this.logs } = await this.token.mint(owner, firstTokenId.toFixed()).send());
            });

            it("adjusts owner tokens by index", async function () {
                expect(await this.token.tokenOfOwnerByIndex(owner, 0).call()).to.be.bignumber.equal(firstTokenId);
            });

            it("adjusts all tokens list", async function () {
                expect(await this.token.tokenByIndex(0).call()).to.be.bignumber.equal(firstTokenId);
            });
        });
    });

    describe("_burn", function () {
        it("reverts when burning a non-existent token id", async function () {
            await expectRevert(
                this.token.burn(firstTokenId.toFixed()).send(), "TRC721: owner query for nonexistent token",
            );
        });

        context("with minted tokens", function () {
            beforeEach(async function () {
                await this.token.mint(owner, firstTokenId.toFixed()).send();
                const txId = await this.token.mint(owner, secondTokenId.toFixed()).send();
                await waitUnconfirmedTransaction(txId);
            });

            context("with burnt token", function () {
                beforeEach(async function () {
                    this.txId = await this.token.burn(firstTokenId.toFixed()).send();
                    await waitUnconfirmedTransaction(this.txId);
                });

                it("removes that token from the token list of the owner", async function () {
                    expect(await this.token.tokenOfOwnerByIndex(owner, 0).call()).to.be.bignumber.equal(secondTokenId);
                });

                it("adjusts all tokens list", async function () {
                    expect(await this.token.tokenByIndex(0).call()).to.be.bignumber.equal(secondTokenId);
                });

                it("burns all tokens", async function () {
                    account.setDefault(owner);
                    await this.token.burn(secondTokenId.toFixed()).send();
                    expect(await this.token.totalSupply().call()).to.be.bignumber.equal("0");
                    await expectRevert(
                        this.token.tokenByIndexMock(0).send(), "TRC721Enumerable: global index out of bounds",
                    );
                });
            });
        });
    });
}

function shouldBehaveLikeTRC721Metadata(errorPrefix, name, symbol, owner) {
    shouldSupportInterfaces([
        "TRC721Metadata",
    ]);

    describe("metadata", function () {
        it("has a name", async function () {
            expect(await this.token.name().call()).to.be.equal(name);
        });

        it("has a symbol", async function () {
            expect(await this.token.symbol().call()).to.be.equal(symbol);
        });

        describe("token URI", function () {
            beforeEach(async function () {
                const txId = await this.token.mint(owner, firstTokenId.toFixed()).send();
                await waitUnconfirmedTransaction(txId);
            });

            it("return empty string by default", async function () {
                expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal("");
            });

            it("reverts when queried for non existent token id", async function () {
                await expectRevert(
                    this.token.tokenURIMock(nonExistentTokenId.toFixed()).send(), "TRC721Metadata: URI query for nonexistent token",
                );
            });

            describe("base URI", function () {
                beforeEach(function () {
                    if (this.token.setBaseURI === undefined) {
                        this.skip();
                    }
                });

                it("base URI can be set", async function () {
                    const txId = await this.token.setBaseURI(baseURI).send();
                    await waitUnconfirmedTransaction(txId);
                    expect(await this.token.baseURI().call()).to.equal(baseURI);
                });

                it("base URI is added as a prefix to the token URI", async function () {
                    const txId = await this.token.setBaseURI(baseURI).send();
                    await waitUnconfirmedTransaction(txId);
                    expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal(baseURI + firstTokenId.toString());
                });

                it("token URI can be changed by changing the base URI", async function () {
                    await this.token.setBaseURI(baseURI).send();
                    const newBaseURI = "https://api.com/v2/";
                    const txId = await this.token.setBaseURI(newBaseURI).send();
                    await waitUnconfirmedTransaction(txId);
                    expect(await this.token.tokenURI(firstTokenId.toFixed()).call()).to.be.equal(newBaseURI + firstTokenId.toString());
                });
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeTRC721,
    shouldBehaveLikeTRC721Enumerable,
    shouldBehaveLikeTRC721Metadata,
};
