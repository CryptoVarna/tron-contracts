const { BN, constants, createContract } = require("@cryptovarna/tron-test-helpers");
const { expect } = require("chai");
const { MAX_UINT256 } = constants;

const MathMock = artifacts.require("MathMock");

contract("Math", function (accounts) {
    const min = new BN("1234");
    const max = new BN("5678");

    beforeEach(async function () {
        this.math = await createContract(MathMock);
    });

    describe("max", function () {
        it("is correctly detected in first argument position", async function () {
            expect(BN.fromHex(await this.math.max(max.toFixed(), min.toFixed()).call())).to.be.bignumber.equal(max);
        });

        it("is correctly detected in second argument position", async function () {
            expect(BN.fromHex(await this.math.max(min.toFixed(), max.toFixed()).call())).to.be.bignumber.equal(max);
        });
    });

    describe("min", function () {
        it("is correctly detected in first argument position", async function () {
            expect(BN.fromHex(await this.math.min(min.toFixed(), max.toFixed()).call())).to.be.bignumber.equal(min);
        });

        it("is correctly detected in second argument position", async function () {
            expect(BN.fromHex(await this.math.min(max.toFixed(), min.toFixed()).call())).to.be.bignumber.equal(min);
        });
    });

    describe("average", function () {
        function bnAverage(a, b) {
            return a.plus(b).idiv(2);
        }

        it("is correctly calculated with two odd numbers", async function () {
            const a = new BN("57417");
            const b = new BN("95431");
            expect(BN.fromHex(await this.math.average(a.toFixed(), b.toFixed()).call())).to.be.bignumber.equal(bnAverage(a, b));
        });

        it("is correctly calculated with two even numbers", async function () {
            const a = new BN("42304");
            const b = new BN("84346");
            expect(BN.fromHex(await this.math.average(a.toFixed(), b.toFixed()).call())).to.be.bignumber.equal(bnAverage(a, b));
        });

        it("is correctly calculated with one even and one odd number", async function () {
            const a = new BN("57417");
            const b = new BN("84346");
            expect(BN.fromHex(await this.math.average(a.toFixed(), b.toFixed()).call())).to.be.bignumber.equal(bnAverage(a, b));
        });

        it("is correctly calculated with two max uint256 numbers", async function () {
            const a = MAX_UINT256;
            expect(BN.fromHex(await this.math.average(a.toFixed(), a.toFixed()).call())).to.be.bignumber.equal(bnAverage(a, a));
        });
    });

    describe("ceilDiv", function () {
        it("does not round up on exact division", async function () {
            const a = new BN("10");
            const b = new BN("5");
            expect(BN.fromHex(await this.math.ceilDiv(a.toFixed(), b.toFixed()).call())).to.be.bignumber.equal("2");
        });

        it("rounds up on division with remainders", async function () {
            const a = new BN("42");
            const b = new BN("13");
            expect(BN.fromHex(await this.math.ceilDiv(a.toFixed(), b.toFixed()).call())).to.be.bignumber.equal("4");
        });

        it("does not overflow", async function () {
            const b = new BN("2");
            const result = new BN("2").pow(255);
            expect(BN.fromHex(await this.math.ceilDiv(MAX_UINT256.toFixed(), b.toFixed()).call())).to.be.bignumber.equal(result);
        });

        it("correctly computes max uint256 divided by 1", async function () {
            const b = new BN("1");
            expect(BN.fromHex(await this.math.ceilDiv(MAX_UINT256.toFixed(), b.toFixed())
                .call()))
                .to.be.bignumber.equal(MAX_UINT256);
        });
    });
});
