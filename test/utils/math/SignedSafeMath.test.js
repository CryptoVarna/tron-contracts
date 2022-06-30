const { BN, constants, expectRevert, createContract } = require("@cryptovarna/tron-test-helpers");
const { MAX_INT256, MIN_INT256 } = constants;

const { expect } = require("chai");

const SignedSafeMathMock = artifacts.require("SignedSafeMathMock");

contract("SignedSafeMath", function (accounts) {
    beforeEach(async function () {
        this.safeMath = await createContract(SignedSafeMathMock);
    });

    async function testCommutative(fn, lhs, rhs, expected) {
        expect(await fn(lhs.toFixed(), rhs.toFixed()).call()).to.be.bignumber.equal(expected);
        expect(await fn(rhs.toFixed(), lhs.toFixed()).call()).to.be.bignumber.equal(expected);
    }

    async function testFailsCommutative(fn, lhs, rhs) {
        await expectRevert.assertion(fn(lhs.toFixed(), rhs.toFixed()).send());
        await expectRevert.assertion(fn(rhs.toFixed(), lhs.toFixed()).send());
    }

    describe("add", function () {
        it("adds correctly if it does not overflow and the result is positive", async function () {
            const a = new BN("1234");
            const b = new BN("5678");

            await testCommutative(this.safeMath.add, a, b, a.add(b));
        });

        it("adds correctly if it does not overflow and the result is negative", async function () {
            const a = MAX_INT256;
            const b = MIN_INT256;

            await testCommutative(this.safeMath.add, a, b, a.add(b));
        });

        it("reverts on positive addition overflow", async function () {
            const a = MAX_INT256;
            const b = new BN("1");

            await testFailsCommutative(this.safeMath.addFail, a, b);
        });

        it("reverts on negative addition overflow", async function () {
            const a = MIN_INT256;
            const b = new BN("-1");

            await testFailsCommutative(this.safeMath.add, a, b);
        });
    });

    describe("sub", function () {
        it("subtracts correctly if it does not overflow and the result is positive", async function () {
            const a = new BN("5678");
            const b = new BN("1234");

            const result = await this.safeMath.sub(a.toFixed(), b.toFixed()).call();
            expect(result).to.be.bignumber.equal(a.sub(b));
        });

        it("subtracts correctly if it does not overflow and the result is negative", async function () {
            const a = new BN("1234");
            const b = new BN("5678");

            const result = await this.safeMath.sub(a.toFixed(), b.toFixed()).call();
            expect(result).to.be.bignumber.equal(a.sub(b));
        });

        it("reverts on positive subtraction overflow", async function () {
            const a = MAX_INT256;
            const b = new BN("-1");

            await expectRevert.assertion(this.safeMath.subFail(a.toFixed(), b.toFixed()).send());
        });

        it("reverts on negative subtraction overflow", async function () {
            const a = MIN_INT256;
            const b = new BN("1");

            await expectRevert.assertion(this.safeMath.subFail(a.toFixed(), b.toFixed()).send());
        });
    });

    describe("mul", function () {
        it("multiplies correctly", async function () {
            const a = new BN("5678");
            const b = new BN("-1234");

            await testCommutative(this.safeMath.mul, a, b, a.mul(b));
        });

        it("multiplies by zero correctly", async function () {
            const a = new BN("0");
            const b = new BN("5678");

            await testCommutative(this.safeMath.mul, a, b, "0");
        });

        it("reverts on multiplication overflow, positive operands", async function () {
            const a = MAX_INT256;
            const b = new BN("2");

            await testFailsCommutative(this.safeMath.mulFail, a, b);
        });

        it("reverts when minimum integer is multiplied by -1", async function () {
            const a = MIN_INT256;
            const b = new BN("-1");

            await testFailsCommutative(this.safeMath.mulFail, a, b);
        });
    });

    describe("div", function () {
        it("divides correctly", async function () {
            const a = new BN("-5678");
            const b = new BN("5678");

            const result = await this.safeMath.div(a.toFixed(), b.toFixed()).call();
            expect(result).to.be.bignumber.equal(a.div(b));
        });

        it("divides zero correctly", async function () {
            const a = new BN("0");
            const b = new BN("5678");

            expect(await this.safeMath.div(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal("0");
        });

        it("returns complete number result on non-even division", async function () {
            const a = new BN("7000");
            const b = new BN("5678");

            expect(await this.safeMath.div(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal("1");
        });

        it("reverts on division by zero", async function () {
            const a = new BN("-5678");
            const b = new BN("0");

            await expectRevert.assertion(this.safeMath.divFail(a.toFixed(), b.toFixed()).send());
        });

        it("reverts on overflow, negative second", async function () {
            const a = new BN(MIN_INT256);
            const b = new BN("-1");

            await expectRevert.assertion(this.safeMath.divFail(a.toFixed(), b.toFixed()).send());
        });
    });
});
