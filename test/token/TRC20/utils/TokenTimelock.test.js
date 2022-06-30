// TODO: time is not supported so thinkout some way to test that
const { BN, expectRevert, time, createContract, account } = require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

const TRC20Mock = artifacts.require("TRC20Mock");
const TokenTimelock = artifacts.require("TokenTimelock");

contract("TokenTimelock", function (accounts) {
    const [beneficiary] = accounts;

    const name = "My Token";
    const symbol = "MTKN";

    const amount = new BN(100);

    context("with token", function () {
        beforeEach(async function () {
            this.token = await createContract(TRC20Mock, name, symbol, beneficiary, "0"); // We're not using the preminted tokens
        });

        /* it("rejects a release time in the past", async function () {
            const pastReleaseTime = (await time.latest()).minus(time.duration.seconds(10));
            await expectRevert(
                createContract(TokenTimelock, this.token.address, beneficiary, pastReleaseTime.toFixed()),
                "TokenTimelock: release time is before current time",
            );
        }); */

        context("once deployed", function () {
            beforeEach(async function () {
                this.releaseTime = (await time.latest()).plus(time.duration.seconds(5));
                console.log(await time.latest(), this.releaseTime);
                this.timelock = await createContract(TokenTimelock, this.token.address, beneficiary, this.releaseTime.toFixed());
                await this.token.mint(this.timelock.address, amount.toFixed()).send();
            });

            it("can get state", async function () {
                expect(await this.timelock.token().call()).to.equal(this.token.address);
                expect(await this.timelock.beneficiary().call()).to.equal(account.toHexAddress(beneficiary));
                expect(BN.fromHex(await this.timelock.releaseTime().call())).to.be.bignumber.equal(this.releaseTime);
            });

            it("cannot be released before time limit", async function () {
                await expectRevert(this.timelock.release().send(), "TokenTimelock: current time is before release time");
            });

            it("cannot be released just before time limit", async function () {
                await time.increaseTo(this.releaseTime.minus(time.duration.seconds(3)));
                await expectRevert(this.timelock.release().send(), "TokenTimelock: current time is before release time");
            });

            it("can be released just after limit", async function () {
                await time.increaseTo(this.releaseTime.plus(time.duration.seconds(10)));
                await this.timelock.release().send();
                expect(BN.fromHex(await this.token.balanceOf(beneficiary).call())).to.be.bignumber.equal(amount);
            });

            it("can be released after time limit", async function () {
                await time.increaseTo(this.releaseTime.plus(time.duration.seconds(10)));
                await this.timelock.release().send({ shouldPollResponse: true });
                expect(BN.fromHex(await this.token.balanceOf(beneficiary).call())).to.be.bignumber.equal(amount);
            });

            it("cannot be released twice", async function () {
                await time.increaseTo(this.releaseTime.plus(time.duration.seconds(10)));
                await this.timelock.release().send();
                await expectRevert(this.timelock.release().send(), "TokenTimelock: no tokens to release");
                expect(BN.fromHex(await this.token.balanceOf(beneficiary).call())).to.be.bignumber.equal(amount);
            });
        });
    });
});
