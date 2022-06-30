const { BN, account, constants, expectEvent,
    expectRevert, createContract, waitUnconfirmedTransaction } =
    require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { ZERO_ADDRESS, ZERO_ADDRESS_ETH } = constants;

const {
    shouldBehaveLikeTRC20,
    shouldBehaveLikeTRC20Transfer,
    shouldBehaveLikeTRC20Approve,
} = require("./TetherToken.behavior.js");

const TetherToken = artifacts.require("USDTMock");

contract("TetherToken", function (accounts) {
    const [initialHolder, recipient, anotherAccount] = accounts;

    const name = "My Token";
    const symbol = "MTKN";

    const initialSupply = new BN(100);

    beforeEach(async function () {
        account.setDefault(initialHolder);
        this.token = await createContract(TetherToken, initialSupply.toFixed(), name, symbol, 18);
    });

    it("has a name", async function () {
        expect(await this.token.name().call()).to.equal(name);
    });

    it("has a symbol", async function () {
        expect(await this.token.symbol().call()).to.equal(symbol);
    });

    it("has 18 decimals", async function () {
        expect(await this.token.decimals().call()).to.be.bignumber.equal("18");
    });

    shouldBehaveLikeTRC20("TetherToken", initialSupply, initialHolder, recipient, anotherAccount);

    describe("decrease allowance", function () {
        describe("when the spender is not the zero address", function () {
            const spender = recipient;

            function shouldDecreaseApproval(amount) {
                describe("when there was no approved amount before", function () {
                    it("reverts", async function () {
                        account.setDefault(initialHolder);
                        await expectRevert(this.token.decreaseAllowance(
                            spender, amount.toFixed()).send(), "TRC20: decreased allowance below zero",
                        );
                    });
                });

                describe("when the spender had an approved amount", function () {
                    const approvedAmount = amount;

                    beforeEach(async function () {
                        account.setDefault(initialHolder);
                        this.txId = await this.token.approve(spender, approvedAmount.toFixed()).send();
                    });

                    it("emits an approval event", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.decreaseAllowance(spender, approvedAmount.toFixed()).send();
                        await expectEvent.inTransaction(txId, this.token, "Approval", {
                            owner: account.toHexAddress(initialHolder, true),
                            spender: account.toHexAddress(spender, true),
                            value: new BN(0),
                        });
                    });

                    it("decreases the spender allowance subtracting the requested amount", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.decreaseAllowance(spender, approvedAmount.minus(1).toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                        expect(BN.fromHex((await this.token.allowance(initialHolder, spender).call()).remaining)).to.be.bignumber.equal("1");
                    });

                    it("sets the allowance to zero when all allowance is removed", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.decreaseAllowance(spender, approvedAmount.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                        expect(BN.fromHex((await this.token.allowance(initialHolder, spender).call()).remaining)).to.be.bignumber.equal("0");
                    });

                    it("reverts when more than the full allowance is removed", async function () {
                        await expectRevert(
                            this.token.decreaseAllowance(spender, approvedAmount.plus(1).toFixed()).send(),
                            "TRC20: decreased allowance below zero",
                        );
                    });
                });
            }

            describe("when the sender has enough balance", function () {
                const amount = initialSupply;

                shouldDecreaseApproval(amount);
            });

            describe("when the sender does not have enough balance", function () {
                const amount = initialSupply.plus(1);

                shouldDecreaseApproval(amount);
            });
        });

        describe("when the spender is the zero address", function () {
            const amount = initialSupply;
            const spender = ZERO_ADDRESS;

            it("reverts", async function () {
                account.setDefault(initialHolder);
                await expectRevert(this.token.decreaseAllowance(
                    spender, amount.toFixed()).send(), "TRC20: decreased allowance below zero",
                );
            });
        });
    });

    describe("increase allowance", function () {
        const amount = initialSupply;

        describe("when the spender is not the zero address", function () {
            const spender = recipient;

            describe("when the sender has enough balance", function () {
                it("emits an approval event", async function () {
                    account.setDefault(initialHolder);
                    const txId = await this.token.increaseAllowance(spender, amount.toFixed()).send();

                    await expectEvent.inTransaction(txId, this.token, "Approval", {
                        owner: account.toHexAddress(initialHolder, true),
                        spender: account.toHexAddress(spender, true),
                        value: amount,
                    });
                });

                describe("when there was no approved amount before", function () {
                    it("approves the requested amount", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.increaseAllowance(spender, amount.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                        expect(BN.fromHex((await this.token.allowance(initialHolder, spender).call()).remaining)).to.be.bignumber.equal(amount);
                    });
                });

                describe("when the spender had an approved amount", function () {
                    beforeEach(async function () {
                        account.setDefault(initialHolder);
                        await this.token.approve(spender, "1").send();
                    });

                    it("increases the spender allowance adding the requested amount", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.increaseAllowance(spender, amount.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                        expect(BN.fromHex((await this.token.allowance(initialHolder, spender).call()).remaining)).to.be.bignumber.equal(amount.plus(1));
                    });
                });
            });

            describe("when the sender does not have enough balance", function () {
                const amount = initialSupply.plus(1);

                it("emits an approval event", async function () {
                    account.setDefault(initialHolder);
                    const txId = await this.token.increaseAllowance(spender, amount.toFixed()).send();

                    await expectEvent.inTransaction(txId, this.token, "Approval", {
                        owner: account.toHexAddress(initialHolder, true),
                        spender: account.toHexAddress(spender, true),
                        value: amount,
                    });
                });

                describe("when there was no approved amount before", function () {
                    it("approves the requested amount", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.increaseAllowance(spender, amount.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                        expect((await this.token.allowance(initialHolder, spender).call()).remaining).to.be.bignumber.equal(amount);
                    });
                });

                describe("when the spender had an approved amount", function () {
                    beforeEach(async function () {
                        account.setDefault(initialHolder);
                        await this.token.approve(spender, "1").send();
                    });

                    it("increases the spender allowance adding the requested amount", async function () {
                        account.setDefault(initialHolder);
                        const txId = await this.token.increaseAllowance(spender, amount.toFixed()).send();
                        await waitUnconfirmedTransaction(txId);
                        expect(BN.fromHex((await this.token.allowance(initialHolder, spender).call()).remaining)).to.be.bignumber.equal(amount.plus(1));
                    });
                });
            });
        });

        describe("when the spender is the zero address", function () {
            const spender = ZERO_ADDRESS;

            it("reverts", async function () {
                account.setDefault(initialHolder);
                await expectRevert(
                    this.token.increaseAllowance(spender, amount.toFixed()).send(), "TRC20: approve to the zero address",
                );
            });
        });
    });

    describe("_mint", function () {
        const amount = new BN(50);
        it("rejects a null account", async function () {
            account.setDefault(ZERO_ADDRESS);
            await expectRevert(
                this.token.mint(amount.toFixed()).send(), "TRC20: mint to the zero address",
            );
        });

        describe("for a non zero account", function () {
            // Changed tests to check owner for minted tokens, as those cannot be minted to other addresses
            beforeEach("minting", async function () {
                account.setDefault(initialHolder);
                await this.token.mint(amount.toFixed()).send();
                this.txId = await this.token.transferInternal(recipient, amount.toFixed()).send();
            });

            it("increments totalSupply", async function () {
                const expectedSupply = initialSupply.plus(amount);
                expect(BN.fromHex(await this.token.totalSupply().send({ shouldPollResponse: true }))).to.be.bignumber.equal(expectedSupply);
            });

            it("increments recipient balance", async function () {
                expect(BN.fromHex(await this.token.balanceOf(recipient).call())).to.be.bignumber.equal(amount.toFixed());
            });

            it("emits Transfer event", async function () {
                const event = await expectEvent.inTransaction(this.txId, this.token, "Transfer", {
                    from: account.toHexAddress(initialHolder, true),
                    to: account.toHexAddress(recipient, true),
                });

                expect(event.result.value).to.be.bignumber.equal(amount);
            });
        });
    });

    describe("_burn", function () {
        it("rejects a null account", async function () {
            account.setDefault(ZERO_ADDRESS);
            await expectRevert(this.token.burn("1").send(),
                "TRC20: burn from the zero address");
        });

        describe("for a non zero account", function () {
            it("rejects burning more than balance", async function () {
                account.setDefault(initialHolder);
                await expectRevert(this.token.burn(initialSupply.plus(1).toFixed()).send(), "TRC20: burn amount exceeds balance",
                );
            });

            const describeBurn = function (description, amount) {
                describe(description, function () {
                    beforeEach("burning", async function () {
                        account.setDefault(initialHolder);
                        this.txId = await this.token.burn(amount.toFixed()).send();
                    });

                    it("decrements totalSupply", async function () {
                        const expectedSupply = initialSupply.minus(amount);
                        expect(BN.fromHex(await this.token.totalSupply().send({ shouldPollResponse: true }))).to.be.bignumber.equal(expectedSupply);
                    });

                    it("decrements initialHolder balance", async function () {
                        const expectedBalance = initialSupply.minus(amount);
                        expect(BN.fromHex(await this.token.balanceOf(initialHolder).call())).to.be.bignumber.equal(expectedBalance);
                    });

                    it("emits Transfer event", async function () {
                        const event = await expectEvent.inTransaction(this.txId, this.token, "Transfer", {
                            from: account.toHexAddress(initialHolder, true),
                            to: ZERO_ADDRESS_ETH,
                        });

                        expect(event.result.value).to.be.bignumber.equal(amount);
                    });
                });
            };

            describeBurn("for entire balance", initialSupply);
            describeBurn("for less amount than balance", initialSupply.minus(1));
        });
    });

    describe("_transfer", async function () {
        account.setDefault(initialHolder);
        const token = await createContract(TetherToken, initialSupply.toFixed(), name, symbol, 18);
        /* Needs further testing */
        shouldBehaveLikeTRC20Transfer("TetherToken", initialHolder, recipient, initialSupply,
            function (from, to, amount, shouldPollResponse = true) {
                account.setDefault(from);
                return token.transferFrom(from, to, amount.toFixed())
                    .send({ shouldPollResponse: shouldPollResponse });
            });

        describe("when the sender is the zero address", function () {
            it("reverts", async function () {
                account.setDefault(ZERO_ADDRESS);
                await expectRevert(this.token.transferInternal(recipient, initialSupply.toFixed()).send(),
                    "TRC20: transfer from the zero address",
                );
            });
        });
    });

    describe("_approve", function () {
        /* Needs further testing */
        shouldBehaveLikeTRC20Approve("TetherToken", initialHolder, recipient, initialSupply, function (owner, spender, amount, shouldPollResponse = true) {
            account.setDefault(owner);
            return this.token.approveInternal(spender, amount.toFixed()).send({ shouldPollResponse: shouldPollResponse });
        });

        describe("when the owner is the zero address", function () {
            it("reverts", async function () {
                account.setDefault(ZERO_ADDRESS);
                await expectRevert(this.token.approveInternal(recipient, initialSupply.toFixed()).send(),
                    "TRC20: approve from the zero address",
                );
            });
        });
    });
});
