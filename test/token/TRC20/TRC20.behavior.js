const { BN, constants, expectEvent, expectRevert, account } = require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeTRC20(errorPrefix, initialSupply, initialHolder, recipient, anotherAccount) {
    describe("total supply", function () {
        it("returns the total amount of tokens", async function () {
            expect(BN.fromHex(await this.token.totalSupply().call())).to.be.bignumber.equal(initialSupply);
        });
    });

    describe("balanceOf", function () {
        describe("when the requested account has no tokens", function () {
            it("returns zero", async function () {
                expect(BN.fromHex(await this.token.balanceOf(anotherAccount).call())).to.be.bignumber.equal("0");
            });
        });

        describe("when the requested account has some tokens", function () {
            it("returns the total amount of tokens", async function () {
                expect(BN.fromHex(await this.token.balanceOf(initialHolder).call())).to.be.bignumber.equal(initialSupply);
            });
        });
    });

    describe("transfer", function () {
        shouldBehaveLikeTRC20Transfer(errorPrefix, initialHolder, recipient, initialSupply,
            function (from, to, value, shouldPollResponse = true) {
                account.setDefault(from);
                return this.token.transfer(to, value.toFixed()).send({ shouldPollResponse: shouldPollResponse });
            },
        );
    });

    describe("transfer from", function () {
        const spender = recipient;

        describe("when the token owner is not the zero address", function () {
            const tokenOwner = initialHolder;

            describe("when the recipient is not the zero address", function () {
                const to = anotherAccount;

                describe("when the spender has enough approved balance", function () {
                    beforeEach(async function () {
                        account.setDefault(initialHolder);
                        await this.token.approve(spender, initialSupply.toFixed()).send({ shouldPollResponse: true });
                    });

                    describe("when the token owner has enough balance", function () {
                        const amount = initialSupply;

                        it("transfers the requested amount", async function () {
                            account.setDefault(spender);
                            await this.token.transferFrom(tokenOwner, to, amount.toFixed()).send({ shouldPollResponse: true });

                            expect(BN.fromHex(await this.token.balanceOf(tokenOwner).call())).to.be.bignumber.equal("0");

                            expect(BN.fromHex(await this.token.balanceOf(to).call())).to.be.bignumber.equal(amount);
                        });

                        it("decreases the spender allowance", async function () {
                            account.setDefault(spender);
                            await this.token.transferFrom(tokenOwner, to, amount.toFixed()).send({ shouldPollResponse: true });

                            expect(BN.fromHex(await this.token.allowance(tokenOwner, spender).call())).to.be.bignumber.equal("0");
                        });

                        it("emits a transfer event", async function () {
                            account.setDefault(spender);
                            const txId = await this.token.transferFrom(tokenOwner, to, amount.toFixed()).send();

                            await expectEvent.inTransaction(txId, this.token, "Transfer", {
                                from: account.toHexAddress(tokenOwner, true),
                                to: account.toHexAddress(to, true),
                                value: amount,
                            });
                        });

                        it("emits an approval event", async function () {
                            account.setDefault(spender);
                            const txId = await this.token.transferFrom(tokenOwner, to, amount.toFixed()).send();

                            const expectedAmount = new BN(0); // await this.token.allowance(tokenOwner, spender).call();
                            await expectEvent.inTransaction(txId, this.token, "Approval", {
                                owner: account.toHexAddress(tokenOwner, true),
                                spender: account.toHexAddress(spender, true),
                                value: expectedAmount,
                            });
                        });
                    });

                    describe("when the token owner does not have enough balance", function () {
                        const amount = initialSupply.plus(1);

                        it("reverts", async function () {
                            account.setDefault(spender);
                            await expectRevert(this.token.transferFrom(
                                tokenOwner, to, amount.toFixed()).send(), `${errorPrefix}: transfer amount exceeds balance`,
                            );
                        });
                    });
                });

                describe("when the spender does not have enough approved balance", function () {
                    beforeEach(async function () {
                        account.setDefault(tokenOwner);
                        await this.token.approve(spender, initialSupply.minus(1).toFixed()).send();
                    });

                    describe("when the token owner has enough balance", function () {
                        const amount = initialSupply;

                        it("reverts", async function () {
                            account.setDefault(spender);
                            await expectRevert(this.token.transferFrom(
                                tokenOwner, to, amount.toFixed()).send(), `${errorPrefix}: transfer amount exceeds allowance`,
                            );
                        });
                    });

                    describe("when the token owner does not have enough balance", function () {
                        const amount = initialSupply.plus(1);

                        it("reverts", async function () {
                            account.setDefault(spender);
                            await expectRevert(this.token.transferFrom(
                                tokenOwner, to, amount.toFixed()).send(), `${errorPrefix}: transfer amount exceeds balance`,
                            );
                        });
                    });
                });
            });

            describe("when the recipient is the zero address", function () {
                const amount = initialSupply;
                const to = ZERO_ADDRESS;

                beforeEach(async function () {
                    account.setDefault(tokenOwner);
                    await this.token.approve(spender, amount.toFixed()).send({ shouldPollResponse: true });
                });

                it("reverts", async function () {
                    account.setDefault(spender);
                    await expectRevert(this.token.transferFrom(
                        tokenOwner, to, amount.toFixed()).send(), `${errorPrefix}: transfer to the zero address`,
                    );
                });
            });
        });

        describe("when the token owner is the zero address", function () {
            const amount = 0;
            const tokenOwner = ZERO_ADDRESS;
            const to = recipient;

            it("reverts", async function () {
                account.setDefault(spender);
                await expectRevert(this.token.transferFrom(
                    tokenOwner, to, amount.toFixed()).send(), `${errorPrefix}: transfer from the zero address`,
                );
            });
        });
    });

    describe("approve", function () {
        shouldBehaveLikeTRC20Approve(errorPrefix, initialHolder, recipient, initialSupply,
            function (owner, spender, amount) {
                account.setDefault(owner);
                return this.token.approve(spender, amount.toFixed()).send();
            },
        );
    });
}

function shouldBehaveLikeTRC20Transfer(errorPrefix, from, to, balance, transfer) {
    describe("when the recipient is not the zero address", function () {
        describe("when the sender does not have enough balance", function () {
            const amount = balance.plus(1);

            it("reverts", async function () {
                await expectRevert(transfer.call(this, from, to, amount, false),
                    `${errorPrefix}: transfer amount exceeds balance`,
                );
            });
        });

        describe("when the sender transfers all balance", function () {
            const amount = balance;

            it("transfers the requested amount", async function () {
                await transfer.call(this, from, to, amount);

                expect(BN.fromHex(await this.token.balanceOf(from).call())).to.be.bignumber.equal("0");

                expect(BN.fromHex(await this.token.balanceOf(to).call())).to.be.bignumber.equal(amount);
            });

            it("emits a transfer event", async function () {
                const txId = await transfer.call(this, from, to, amount, false);

                await expectEvent.inTransaction(txId, this.token, "Transfer", {
                    from: account.toHexAddress(from, true),
                    to: account.toHexAddress(to, true),
                    value: amount,
                });
            });
        });

        describe("when the sender transfers zero tokens", function () {
            const amount = new BN("0");

            it("transfers the requested amount", async function () {
                await transfer.call(this, from, to, amount);

                expect(BN.fromHex(await this.token.balanceOf(from).call())).to.be.bignumber.equal(balance);

                expect(BN.fromHex(await this.token.balanceOf(to).call())).to.be.bignumber.equal("0");
            });

            it("emits a transfer event", async function () {
                const txId = await transfer.call(this, from, to, amount, false);

                await expectEvent.inTransaction(txId, this.token, "Transfer", {
                    from: account.toHexAddress(from, true),
                    to: account.toHexAddress(to, true),
                    value: amount,
                });
            });
        });
    });

    describe("when the recipient is the zero address", function () {
        it("reverts", async function () {
            await expectRevert(transfer.call(this, from, ZERO_ADDRESS, balance, false),
                `${errorPrefix}: transfer to the zero address`,
            );
        });
    });
}

function shouldBehaveLikeTRC20Approve(errorPrefix, owner, spender, supply, approve) {
    describe("when the spender is not the zero address", function () {
        describe("when the sender has enough balance", function () {
            const amount = supply;

            it("emits an approval event", async function () {
                const txId = await approve.call(this, owner, spender, amount, false);

                await expectEvent.inTransaction(txId, this.token, "Approval", {
                    owner: account.toHexAddress(owner, true),
                    spender: account.toHexAddress(spender, true),
                    value: amount,
                });
            });

            describe("when there was no approved amount before", function () {
                it("approves the requested amount", async function () {
                    await approve.call(this, owner, spender, amount);

                    expect(BN.fromHex(await this.token.allowance(owner, spender).call())).to.be.bignumber.equal(amount);
                });
            });

            describe("when the spender had an approved amount", function () {
                beforeEach(async function () {
                    await approve.call(this, owner, spender, new BN(1));
                });

                it("approves the requested amount and replaces the previous one", async function () {
                    await approve.call(this, owner, spender, amount);

                    expect(BN.fromHex(await this.token.allowance(owner, spender).call())).to.be.bignumber.equal(amount);
                });
            });
        });

        describe("when the sender does not have enough balance", function () {
            const amount = supply.plus(1);

            it("emits an approval event", async function () {
                const txId = await approve.call(this, owner, spender, amount, false);

                await expectEvent.inTransaction(txId, this.token, "Approval", {
                    owner: account.toHexAddress(owner, true),
                    spender: account.toHexAddress(spender, true),
                    value: amount,
                });
            });

            describe("when there was no approved amount before", function () {
                it("approves the requested amount", async function () {
                    await approve.call(this, owner, spender, amount);

                    expect(BN.fromHex(await this.token.allowance(owner, spender).call())).to.be.bignumber.equal(amount);
                });
            });

            describe("when the spender had an approved amount", function () {
                beforeEach(async function () {
                    await approve.call(this, owner, spender, new BN(1));
                });

                it("approves the requested amount and replaces the previous one", async function () {
                    await approve.call(this, owner, spender, amount);

                    expect(BN.fromHex(await this.token.allowance(owner, spender).call())).to.be.bignumber.equal(amount);
                });
            });
        });
    });

    describe("when the spender is the zero address", function () {
        it("reverts", async function () {
            await expectRevert(approve.call(this, owner, ZERO_ADDRESS, supply, false),
                `${errorPrefix}: approve to the zero address`,
            );
        });
    });
}

module.exports = {
    shouldBehaveLikeTRC20,
    shouldBehaveLikeTRC20Transfer,
    shouldBehaveLikeTRC20Approve,
};
