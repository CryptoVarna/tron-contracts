const { BN, constants, expectEvent, expectRevert, account, waitUnconfirmedTransaction } =
    require("@cryptovarna/tron-test-helpers");
const { ZERO_ADDRESS_ETH } = constants;

const { expect } = require("chai");

function shouldBehaveLikeTRC20Burnable(owner, initialBalance, [burner]) {
    describe("burn", function () {
        describe("when the given amount is not greater than balance of the sender", function () {
            context("for a zero amount", function () {
                shouldBurn(new BN(0));
            });

            context("for a non-zero amount", function () {
                shouldBurn(new BN(100));
            });

            function shouldBurn(amount) {
                beforeEach(async function () {
                    account.setDefault(owner);
                    this.txId = await this.token.burn(amount.toFixed()).send();
                });

                it("burns the requested amount", async function () {
                    await waitUnconfirmedTransaction(this.txId);
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal(initialBalance.minus(amount.toFixed()));
                });

                it("emits a transfer event", async function () {
                    await expectEvent.inTransaction(this.txId, this.token, "Transfer", {
                        from: account.toHexAddress(owner, true),
                        to: ZERO_ADDRESS_ETH,
                        value: amount,
                    });
                });
            }
        });

        describe("when the given amount is greater than the balance of the sender", function () {
            const amount = initialBalance.plus(1);

            it("reverts", async function () {
                account.setDefault(owner);
                await expectRevert(this.token.burn(amount.toFixed()).send(),
                    "TRC20: burn amount exceeds balance",
                );
            });
        });
    });

    describe("burnFrom", function () {
        describe("on success", function () {
            context("for a zero amount", function () {
                shouldBurnFrom(new BN(0));
            });

            context("for a non-zero amount", function () {
                shouldBurnFrom(new BN(100));
            });

            function shouldBurnFrom(amount) {
                const originalAllowance = amount.times(3);

                beforeEach(async function () {
                    account.setDefault(owner);
                    await this.token.approve(burner, originalAllowance.toFixed()).send();
                    account.setDefault(burner);
                    this.txId = await this.token.burnFrom(owner, amount.toFixed()).send();
                });

                it("burns the requested amount", async function () {
                    await waitUnconfirmedTransaction(this.txId);
                    expect(await this.token.balanceOf(owner).call()).to.be.bignumber.equal(initialBalance.minus(amount));
                });

                it("decrements allowance", async function () {
                    await waitUnconfirmedTransaction(this.txId);
                    expect(await this.token.allowance(owner, burner).call()).to.be.bignumber.equal(originalAllowance.minus(amount));
                });

                it("emits a transfer event", async function () {
                    await expectEvent.inTransaction(this.txId, this.token, "Transfer", {
                        from: account.toHexAddress(owner, true),
                        to: ZERO_ADDRESS_ETH,
                        value: amount,
                    });
                });
            }
        });

        describe("when the given amount is greater than the balance of the sender", function () {
            const amount = initialBalance.plus(1);

            it("reverts", async function () {
                account.setDefault(owner);
                await this.token.approve(burner, amount.toFixed()).send();
                account.setDefault(burner);
                await expectRevert(this.token.burnFrom(owner, amount.toFixed()).send(),
                    "TRC20: burn amount exceeds balance",
                );
            });
        });

        describe("when the given amount is greater than the allowance", function () {
            const allowance = new BN(100);

            it("reverts", async function () {
                account.setDefault(owner);
                await this.token.approve(burner, allowance.toFixed()).send();
                account.setDefault(burner);
                await expectRevert(this.token.burnFrom(owner, allowance.plus(1).toFixed()).send(),
                    "TRC20: burn amount exceeds allowance",
                );
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeTRC20Burnable,
};
