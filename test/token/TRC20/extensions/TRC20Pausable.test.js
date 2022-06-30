const { BN, expectRevert, createContract, account } = require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

const TRC20PausableMock = artifacts.require("TRC20PausableMock");

contract("TRC20Pausable", function (accounts) {
    const [holder, recipient, anotherAccount] = accounts;

    const initialSupply = new BN(100);

    const name = "My Token";
    const symbol = "MTKN";

    beforeEach(async function () {
        this.token = await createContract(TRC20PausableMock, name, symbol, holder, initialSupply.toFixed());
    });

    describe("pausable token", function () {
        describe("transfer", function () {
            it("allows to transfer when unpaused", async function () {
                account.setDefault(holder);
                await this.token.transfer(recipient, initialSupply.toFixed()).send({ shouldPollResponse: true });

                expect(await this.token.balanceOf(holder).call()).to.be.bignumber.equal("0");
                expect(await this.token.balanceOf(recipient).call()).to.be.bignumber.equal(initialSupply);
            });

            it("allows to transfer when paused and then unpaused", async function () {
                await this.token.pause().send();
                await this.token.unpause().send();

                account.setDefault(holder);
                await this.token.transfer(recipient, initialSupply.toFixed()).send({ shouldPollResponse: true });

                expect(await this.token.balanceOf(holder).call()).to.be.bignumber.equal("0");
                expect(await this.token.balanceOf(recipient).call()).to.be.bignumber.equal(initialSupply);
            });

            it("reverts when trying to transfer when paused", async function () {
                account.setDefault(holder);
                await this.token.pause().send();

                await expectRevert(this.token.transfer(recipient, initialSupply.toFixed()).send(),
                    "TRC20Pausable: token transfer while paused",
                );
            });
        });

        describe("transfer from", function () {
            const allowance = new BN(40);

            beforeEach(async function () {
                account.setDefault(holder);
                await this.token.approve(anotherAccount, allowance.toFixed()).send();
            });

            it("allows to transfer from when unpaused", async function () {
                account.setDefault(anotherAccount);
                await this.token.transferFrom(holder, recipient, allowance.toFixed()).send({ shouldPollResponse: true });

                expect(await this.token.balanceOf(recipient).call()).to.be.bignumber.equal(allowance);
                expect(await this.token.balanceOf(holder).call()).to.be.bignumber.equal(initialSupply.minus(allowance));
            });

            it("allows to transfer when paused and then unpaused", async function () {
                await this.token.pause().send();
                await this.token.unpause().send();

                account.setDefault(anotherAccount);
                await this.token.transferFrom(holder, recipient, allowance.toFixed()).send();

                expect(await this.token.balanceOf(recipient).call()).to.be.bignumber.equal(allowance);
                expect(await this.token.balanceOf(holder).call()).to.be.bignumber.equal(initialSupply.minus(allowance));
            });

            it("reverts when trying to transfer from when paused", async function () {
                await this.token.pause().send();

                account.setDefault(anotherAccount);
                await expectRevert(this.token.transferFrom(
                    holder, recipient, allowance.toFixed()).send(), "TRC20Pausable: token transfer while paused",
                );
            });
        });

        describe("mint", function () {
            const amount = new BN("42");

            it("allows to mint when unpaused", async function () {
                await this.token.mint(recipient, amount.toFixed()).send({ shouldPollResponse: true });

                expect(await this.token.balanceOf(recipient).call()).to.be.bignumber.equal(amount);
            });

            it("allows to mint when paused and then unpaused", async function () {
                await this.token.pause().send();
                await this.token.unpause().send();

                await this.token.mint(recipient, amount.toFixed()).send();

                expect(await this.token.balanceOf(recipient).call()).to.be.bignumber.equal(amount);
            });

            it("reverts when trying to mint when paused", async function () {
                await this.token.pause().send();

                await expectRevert(this.token.mint(recipient, amount.toFixed()).send(),
                    "TRC20Pausable: token transfer while paused",
                );
            });
        });

        describe("burn", function () {
            const amount = new BN("42");

            it("allows to burn when unpaused", async function () {
                await this.token.burn(holder, amount.toFixed()).send();

                expect(await this.token.balanceOf(holder).call()).to.be.bignumber.equal(initialSupply.minus(amount));
            });

            it("allows to burn when paused and then unpaused", async function () {
                await this.token.pause().send();
                await this.token.unpause().send();

                await this.token.burn(holder, amount.toFixed()).send({ shouldPollResponse: true });

                expect(await this.token.balanceOf(holder).call()).to.be.bignumber.equal(initialSupply.minus(amount));
            });

            it("reverts when trying to burn when paused", async function () {
                await this.token.pause().send();

                await expectRevert(this.token.burn(holder, amount.toFixed()).send(),
                    "TRC20Pausable: token transfer while paused",
                );
            });
        });
    });
});
