const { BN, constants, expectEvent, expectRevert, singletons } = require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS } = constants;

const { expect } = require("chai");

const {
    shouldBehaveLikeTRC777DirectSendBurn,
    shouldBehaveLikeTRC777OperatorSendBurn,
    shouldBehaveLikeTRC777UnauthorizedOperatorSendBurn,
    shouldBehaveLikeTRC777InternalMint,
    shouldBehaveLikeTRC777SendBurnMintInternalWithReceiveHook,
    shouldBehaveLikeTRC777SendBurnWithSendHook,
} = require("./TRC777.behavior");

const {
    shouldBehaveLikeTRC20,
    shouldBehaveLikeTRC20Approve,
} = require("../TRC20/TRC20.behavior");

const TRC777 = artifacts.require("TRC777Mock");
const TRC777SenderRecipientMock = artifacts.require("TRC777SenderRecipientMock");

contract("TRC777", function (accounts) {
    const [registryFunder, holder, defaultOperatorA, defaultOperatorB, newOperator, anyone] = accounts;

    const initialSupply = new BN("10000");
    const name = "TRC777Test";
    const symbol = "777T";
    const data = web3.utils.sha3("OZ777TestData");
    const operatorData = web3.utils.sha3("OZ777TestOperatorData");

    const defaultOperators = [defaultOperatorA, defaultOperatorB];

    beforeEach(async function () {
        this.TRC1820 = await singletons.TRC1820Registry(registryFunder);
    });

    context("with default operators", function () {
        beforeEach(async function () {
            this.token = await TRC777.new(holder, initialSupply, name, symbol, defaultOperators);
        });

        describe("as an TRC20 token", function () {
            shouldBehaveLikeTRC20("TRC777", initialSupply, holder, anyone, defaultOperatorA);

            describe("_approve", function () {
                shouldBehaveLikeTRC20Approve("TRC777", holder, anyone, initialSupply, function (owner, spender, amount) {
                    return this.token.approveInternal(owner, spender, amount);
                });

                describe("when the owner is the zero address", function () {
                    it("reverts", async function () {
                        await expectRevert(this.token.approveInternal(ZERO_ADDRESS, anyone, initialSupply),
                            "TRC777: approve from the zero address",
                        );
                    });
                });
            });
        });

        it("does not emit AuthorizedOperator events for default operators", async function () {
            await expectEvent.notEmitted.inConstruction(this.token, "AuthorizedOperator");
        });

        describe("basic information", function () {
            it("returns the name", async function () {
                expect(await this.token.name()).to.equal(name);
            });

            it("returns the symbol", async function () {
                expect(await this.token.symbol()).to.equal(symbol);
            });

            it("returns a granularity of 1", async function () {
                expect(await this.token.granularity()).to.be.bignumber.equal("1");
            });

            it("returns the default operators", async function () {
                expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
            });

            it("default operators are operators for all accounts", async function () {
                for (const operator of defaultOperators) {
                    expect(await this.token.isOperatorFor(operator, anyone)).to.equal(true);
                }
            });

            it("returns the total supply", async function () {
                expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
            });

            it("returns 6 when decimals is called", async function () {
                expect(await this.token.decimals()).to.be.bignumber.equal("6");
            });

            it("the TRC777Token interface is registered in the registry", async function () {
                expect(await this.TRC1820.getInterfaceImplementer(this.token.address, web3.utils.soliditySha3("TRC777Token")))
                    .to.equal(this.token.address);
            });

            it("the TRC20Token interface is registered in the registry", async function () {
                expect(await this.TRC1820.getInterfaceImplementer(this.token.address, web3.utils.soliditySha3("TRC20Token")))
                    .to.equal(this.token.address);
            });
        });

        describe("balanceOf", function () {
            context("for an account with no tokens", function () {
                it("returns zero", async function () {
                    expect(await this.token.balanceOf(anyone)).to.be.bignumber.equal("0");
                });
            });

            context("for an account with tokens", function () {
                it("returns their balance", async function () {
                    expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(initialSupply);
                });
            });
        });

        context("with no TRC777TokensSender and no TRC777TokensRecipient implementers", function () {
            describe("send/burn", function () {
                shouldBehaveLikeTRC777DirectSendBurn(holder, anyone, data);

                context("with self operator", function () {
                    shouldBehaveLikeTRC777OperatorSendBurn(holder, anyone, holder, data, operatorData);
                });

                context("with first default operator", function () {
                    shouldBehaveLikeTRC777OperatorSendBurn(holder, anyone, defaultOperatorA, data, operatorData);
                });

                context("with second default operator", function () {
                    shouldBehaveLikeTRC777OperatorSendBurn(holder, anyone, defaultOperatorB, data, operatorData);
                });

                context("before authorizing a new operator", function () {
                    shouldBehaveLikeTRC777UnauthorizedOperatorSendBurn(holder, anyone, newOperator, data, operatorData);
                });

                context("with new authorized operator", function () {
                    beforeEach(async function () {
                        await this.token.authorizeOperator(newOperator, { from: holder });
                    });

                    shouldBehaveLikeTRC777OperatorSendBurn(holder, anyone, newOperator, data, operatorData);

                    context("with revoked operator", function () {
                        beforeEach(async function () {
                            await this.token.revokeOperator(newOperator, { from: holder });
                        });

                        shouldBehaveLikeTRC777UnauthorizedOperatorSendBurn(holder, anyone, newOperator, data, operatorData);
                    });
                });
            });

            describe("mint (internal)", function () {
                const to = anyone;
                const amount = new BN("5");

                context("with default operator", function () {
                    const operator = defaultOperatorA;

                    shouldBehaveLikeTRC777InternalMint(to, operator, amount, data, operatorData);
                });

                context("with non operator", function () {
                    const operator = newOperator;

                    shouldBehaveLikeTRC777InternalMint(to, operator, amount, data, operatorData);
                });
            });

            describe("mint (internal extended)", function () {
                const amount = new BN("5");

                context("to anyone", function () {
                    beforeEach(async function () {
                        this.recipient = anyone;
                    });

                    context("with default operator", function () {
                        const operator = defaultOperatorA;

                        it("without requireReceptionAck", async function () {
                            await this.token.mintInternalExtended(
                                this.recipient,
                                amount,
                                data,
                                operatorData,
                                false,
                                { from: operator },
                            );
                        });

                        it("with requireReceptionAck", async function () {
                            await this.token.mintInternalExtended(
                                this.recipient,
                                amount,
                                data,
                                operatorData,
                                true,
                                { from: operator },
                            );
                        });
                    });

                    context("with non operator", function () {
                        const operator = newOperator;

                        it("without requireReceptionAck", async function () {
                            await this.token.mintInternalExtended(
                                this.recipient,
                                amount,
                                data,
                                operatorData,
                                false,
                                { from: operator },
                            );
                        });

                        it("with requireReceptionAck", async function () {
                            await this.token.mintInternalExtended(
                                this.recipient,
                                amount,
                                data,
                                operatorData,
                                true,
                                { from: operator },
                            );
                        });
                    });
                });

                context("to non TRC777TokensRecipient implementer", function () {
                    beforeEach(async function () {
                        this.tokensRecipientImplementer = await TRC777SenderRecipientMock.new();
                        this.recipient = this.tokensRecipientImplementer.address;
                    });

                    context("with default operator", function () {
                        const operator = defaultOperatorA;

                        it("without requireReceptionAck", async function () {
                            await this.token.mintInternalExtended(
                                this.recipient,
                                amount,
                                data,
                                operatorData,
                                false,
                                { from: operator },
                            );
                        });

                        it("with requireReceptionAck", async function () {
                            await expectRevert(
                                this.token.mintInternalExtended(
                                    this.recipient,
                                    amount,
                                    data,
                                    operatorData,
                                    true,
                                    { from: operator },
                                ),
                                "TRC777: token recipient contract has no implementer for TRC777TokensRecipient",
                            );
                        });
                    });

                    context("with non operator", function () {
                        const operator = newOperator;

                        it("without requireReceptionAck", async function () {
                            await this.token.mintInternalExtended(
                                this.recipient,
                                amount,
                                data,
                                operatorData,
                                false,
                                { from: operator },
                            );
                        });

                        it("with requireReceptionAck", async function () {
                            await expectRevert(
                                this.token.mintInternalExtended(
                                    this.recipient,
                                    amount,
                                    data,
                                    operatorData,
                                    true,
                                    { from: operator },
                                ),
                                "TRC777: token recipient contract has no implementer for TRC777TokensRecipient",
                            );
                        });
                    });
                });
            });
        });

        describe("operator management", function () {
            it("accounts are their own operator", async function () {
                expect(await this.token.isOperatorFor(holder, holder)).to.equal(true);
            });

            it("reverts when self-authorizing", async function () {
                await expectRevert(
                    this.token.authorizeOperator(holder, { from: holder }), "TRC777: authorizing self as operator",
                );
            });

            it("reverts when self-revoking", async function () {
                await expectRevert(
                    this.token.revokeOperator(holder, { from: holder }), "TRC777: revoking self as operator",
                );
            });

            it("non-operators can be revoked", async function () {
                expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);

                const { logs } = await this.token.revokeOperator(newOperator, { from: holder });
                expectEvent.inLogs(logs, "RevokedOperator", { operator: newOperator, tokenHolder: holder });

                expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);
            });

            it("non-operators can be authorized", async function () {
                expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);

                const { logs } = await this.token.authorizeOperator(newOperator, { from: holder });
                expectEvent.inLogs(logs, "AuthorizedOperator", { operator: newOperator, tokenHolder: holder });

                expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(true);
            });

            describe("new operators", function () {
                beforeEach(async function () {
                    await this.token.authorizeOperator(newOperator, { from: holder });
                });

                it("are not added to the default operators list", async function () {
                    expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
                });

                it("can be re-authorized", async function () {
                    const { logs } = await this.token.authorizeOperator(newOperator, { from: holder });
                    expectEvent.inLogs(logs, "AuthorizedOperator", { operator: newOperator, tokenHolder: holder });

                    expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(true);
                });

                it("can be revoked", async function () {
                    const { logs } = await this.token.revokeOperator(newOperator, { from: holder });
                    expectEvent.inLogs(logs, "RevokedOperator", { operator: newOperator, tokenHolder: holder });

                    expect(await this.token.isOperatorFor(newOperator, holder)).to.equal(false);
                });
            });

            describe("default operators", function () {
                it("can be re-authorized", async function () {
                    const { logs } = await this.token.authorizeOperator(defaultOperatorA, { from: holder });
                    expectEvent.inLogs(logs, "AuthorizedOperator", { operator: defaultOperatorA, tokenHolder: holder });

                    expect(await this.token.isOperatorFor(defaultOperatorA, holder)).to.equal(true);
                });

                it("can be revoked", async function () {
                    const { logs } = await this.token.revokeOperator(defaultOperatorA, { from: holder });
                    expectEvent.inLogs(logs, "RevokedOperator", { operator: defaultOperatorA, tokenHolder: holder });

                    expect(await this.token.isOperatorFor(defaultOperatorA, holder)).to.equal(false);
                });

                it("cannot be revoked for themselves", async function () {
                    await expectRevert(
                        this.token.revokeOperator(defaultOperatorA, { from: defaultOperatorA }),
                        "TRC777: revoking self as operator",
                    );
                });

                context("with revoked default operator", function () {
                    beforeEach(async function () {
                        await this.token.revokeOperator(defaultOperatorA, { from: holder });
                    });

                    it("default operator is not revoked for other holders", async function () {
                        expect(await this.token.isOperatorFor(defaultOperatorA, anyone)).to.equal(true);
                    });

                    it("other default operators are not revoked", async function () {
                        expect(await this.token.isOperatorFor(defaultOperatorB, holder)).to.equal(true);
                    });

                    it("default operators list is not modified", async function () {
                        expect(await this.token.defaultOperators()).to.deep.equal(defaultOperators);
                    });

                    it("revoked default operator can be re-authorized", async function () {
                        const { logs } = await this.token.authorizeOperator(defaultOperatorA, { from: holder });
                        expectEvent.inLogs(logs, "AuthorizedOperator", { operator: defaultOperatorA, tokenHolder: holder });

                        expect(await this.token.isOperatorFor(defaultOperatorA, holder)).to.equal(true);
                    });
                });
            });
        });

        describe("send and receive hooks", function () {
            const amount = new BN("1");
            const operator = defaultOperatorA;
            // sender and recipient are stored inside 'this', since in some tests their addresses are determined dynamically

            describe("tokensReceived", function () {
                beforeEach(function () {
                    this.sender = holder;
                });

                context("with no TRC777TokensRecipient implementer", function () {
                    context("with contract recipient", function () {
                        beforeEach(async function () {
                            this.tokensRecipientImplementer = await TRC777SenderRecipientMock.new();
                            this.recipient = this.tokensRecipientImplementer.address;

                            // Note that tokensRecipientImplementer doesn't implement the recipient interface for the recipient
                        });

                        it("send reverts", async function () {
                            await expectRevert(
                                this.token.send(this.recipient, amount, data, { from: holder }),
                                "TRC777: token recipient contract has no implementer for TRC777TokensRecipient",
                            );
                        });

                        it("operatorSend reverts", async function () {
                            await expectRevert(
                                this.token.operatorSend(this.sender, this.recipient, amount, data, operatorData, { from: operator }),
                                "TRC777: token recipient contract has no implementer for TRC777TokensRecipient",
                            );
                        });

                        it("mint (internal) reverts", async function () {
                            await expectRevert(
                                this.token.mintInternal(this.recipient, amount, data, operatorData, { from: operator }),
                                "TRC777: token recipient contract has no implementer for TRC777TokensRecipient",
                            );
                        });

                        it("(TRC20) transfer succeeds", async function () {
                            await this.token.transfer(this.recipient, amount, { from: holder });
                        });

                        it("(TRC20) transferFrom succeeds", async function () {
                            const approved = anyone;
                            await this.token.approve(approved, amount, { from: this.sender });
                            await this.token.transferFrom(this.sender, this.recipient, amount, { from: approved });
                        });
                    });
                });

                context("with TRC777TokensRecipient implementer", function () {
                    context("with contract as implementer for an externally owned account", function () {
                        beforeEach(async function () {
                            this.tokensRecipientImplementer = await TRC777SenderRecipientMock.new();
                            this.recipient = anyone;

                            await this.tokensRecipientImplementer.recipientFor(this.recipient);

                            await this.TRC1820.setInterfaceImplementer(
                                this.recipient,
                                web3.utils.soliditySha3("TRC777TokensRecipient"), this.tokensRecipientImplementer.address,
                                { from: this.recipient },
                            );
                        });

                        shouldBehaveLikeTRC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
                    });

                    context("with contract as implementer for another contract", function () {
                        beforeEach(async function () {
                            this.recipientContract = await TRC777SenderRecipientMock.new();
                            this.recipient = this.recipientContract.address;

                            this.tokensRecipientImplementer = await TRC777SenderRecipientMock.new();
                            await this.tokensRecipientImplementer.recipientFor(this.recipient);
                            await this.recipientContract.registerRecipient(this.tokensRecipientImplementer.address);
                        });

                        shouldBehaveLikeTRC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
                    });

                    context("with contract as implementer for itself", function () {
                        beforeEach(async function () {
                            this.tokensRecipientImplementer = await TRC777SenderRecipientMock.new();
                            this.recipient = this.tokensRecipientImplementer.address;

                            await this.tokensRecipientImplementer.recipientFor(this.recipient);
                        });

                        shouldBehaveLikeTRC777SendBurnMintInternalWithReceiveHook(operator, amount, data, operatorData);
                    });
                });
            });

            describe("tokensToSend", function () {
                beforeEach(function () {
                    this.recipient = anyone;
                });

                context("with a contract as implementer for an externally owned account", function () {
                    beforeEach(async function () {
                        this.tokensSenderImplementer = await TRC777SenderRecipientMock.new();
                        this.sender = holder;

                        await this.tokensSenderImplementer.senderFor(this.sender);

                        await this.TRC1820.setInterfaceImplementer(
                            this.sender,
                            web3.utils.soliditySha3("TRC777TokensSender"), this.tokensSenderImplementer.address,
                            { from: this.sender },
                        );
                    });

                    shouldBehaveLikeTRC777SendBurnWithSendHook(operator, amount, data, operatorData);
                });

                context("with contract as implementer for another contract", function () {
                    beforeEach(async function () {
                        this.senderContract = await TRC777SenderRecipientMock.new();
                        this.sender = this.senderContract.address;

                        this.tokensSenderImplementer = await TRC777SenderRecipientMock.new();
                        await this.tokensSenderImplementer.senderFor(this.sender);
                        await this.senderContract.registerSender(this.tokensSenderImplementer.address);

                        // For the contract to be able to receive tokens (that it can later send), it must also implement the
                        // recipient interface.

                        await this.senderContract.recipientFor(this.sender);
                        await this.token.send(this.sender, amount, data, { from: holder });
                    });

                    shouldBehaveLikeTRC777SendBurnWithSendHook(operator, amount, data, operatorData);
                });

                context("with a contract as implementer for itself", function () {
                    beforeEach(async function () {
                        this.tokensSenderImplementer = await TRC777SenderRecipientMock.new();
                        this.sender = this.tokensSenderImplementer.address;

                        await this.tokensSenderImplementer.senderFor(this.sender);

                        // For the contract to be able to receive tokens (that it can later send), it must also implement the
                        // recipient interface.

                        await this.tokensSenderImplementer.recipientFor(this.sender);
                        await this.token.send(this.sender, amount, data, { from: holder });
                    });

                    shouldBehaveLikeTRC777SendBurnWithSendHook(operator, amount, data, operatorData);
                });
            });
        });
    });

    context("with no default operators", function () {
        beforeEach(async function () {
            this.token = await TRC777.new(holder, initialSupply, name, symbol, []);
        });

        it("default operators list is empty", async function () {
            expect(await this.token.defaultOperators()).to.deep.equal([]);
        });
    });

    describe("relative order of hooks", function () {
        beforeEach(async function () {
            await singletons.TRC1820Registry(registryFunder);
            this.sender = await TRC777SenderRecipientMock.new();
            await this.sender.registerRecipient(this.sender.address);
            await this.sender.registerSender(this.sender.address);
            this.token = await TRC777.new(holder, initialSupply, name, symbol, []);
            await this.token.send(this.sender.address, 1, "0x", { from: holder });
        });

        it("send", async function () {
            const { receipt } = await this.sender.send(this.token.address, anyone, 1, "0x");

            const internalBeforeHook = receipt.logs.findIndex(l => l.event === "BeforeTokenTransfer");
            expect(internalBeforeHook).to.be.gte(0);
            const externalSendHook = receipt.logs.findIndex(l => l.event === "TokensToSendCalled");
            expect(externalSendHook).to.be.gte(0);

            expect(externalSendHook).to.be.lt(internalBeforeHook);
        });

        it("burn", async function () {
            const { receipt } = await this.sender.burn(this.token.address, 1, "0x");

            const internalBeforeHook = receipt.logs.findIndex(l => l.event === "BeforeTokenTransfer");
            expect(internalBeforeHook).to.be.gte(0);
            const externalSendHook = receipt.logs.findIndex(l => l.event === "TokensToSendCalled");
            expect(externalSendHook).to.be.gte(0);

            expect(externalSendHook).to.be.lt(internalBeforeHook);
        });
    });
});