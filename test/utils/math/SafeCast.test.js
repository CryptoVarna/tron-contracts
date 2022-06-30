const { BN, expectRevert, createContract } = require("@cryptovarna/tron-test-helpers");

const { expect } = require("chai");

const SafeCastMock = artifacts.require("SafeCastMock");

contract("SafeCast", async (accounts) => {
    beforeEach(async function () {
        this.safeCast = await createContract(SafeCastMock);
    });

    function testToUint(bits) {
        describe(`toUint${bits}`, () => {
            const maxValue = new BN("2").pow(new BN(bits)).minus(1);

            it("downcasts 0", async function () {
                expect(await this.safeCast[`toUint${bits}`](0).call()).to.be.bignumber.equal("0");
            });

            it("downcasts 1", async function () {
                expect(await this.safeCast[`toUint${bits}`](1).call()).to.be.bignumber.equal("1");
            });

            it(`downcasts 2^${bits} - 1 (${maxValue})`, async function () {
                expect(await this.safeCast[`toUint${bits}`](maxValue.toFixed()).call()).to.be.bignumber.equal(maxValue);
            });

            it(`reverts when downcasting 2^${bits} (${maxValue.plus(1)})`, async function () {
                await expectRevert(
                    this.safeCast[`toUint${bits}Fail`](maxValue.plus(1).toFixed()).send(),
                    `SafeCast: value doesn't fit in ${bits} bits`,
                );
            });

            it(`reverts when downcasting 2^${bits} + 1 (${maxValue.plus(2)})`, async function () {
                await expectRevert(
                    this.safeCast[`toUint${bits}Fail`](maxValue.plus(2).toFixed()).send(),
                    `SafeCast: value doesn't fit in ${bits} bits`,
                );
            });
        });
    }

    [8, 16, 32, 64, 96, 128, 224].forEach(bits => testToUint(bits));

    describe("toUint256", () => {
        const maxInt256 = new BN("2").pow(new BN(255)).minus(1);
        const minInt256 = new BN("2").pow(new BN(255)).negated();

        it("casts 0", async function () {
            expect(await this.safeCast.toUint256(0).call()).to.be.bignumber.equal("0");
        });

        it("casts 1", async function () {
            expect(await this.safeCast.toUint256(1).call()).to.be.bignumber.equal("1");
        });

        it(`casts INT256_MAX (${maxInt256})`, async function () {
            expect(await this.safeCast.toUint256(maxInt256.toFixed()).call()).to.be.bignumber.equal(maxInt256);
        });

        it("reverts when casting -1", async function () {
            await expectRevert(
                this.safeCast.toUint256Fail(-1).send(),
                "SafeCast: value must be positive",
            );
        });

        it(`reverts when casting INT256_MIN (${minInt256})`, async function () {
            await expectRevert(
                this.safeCast.toUint256Fail(minInt256.toFixed()).send(),
                "SafeCast: value must be positive",
            );
        });
    });

    function testToInt(bits) {
        describe(`toInt${bits}`, () => {
            const minValue = new BN("-2").pow(new BN(bits - 1));
            const maxValue = new BN("2").pow(new BN(bits - 1)).minus(1);

            it("downcasts 0", async function () {
                expect(await this.safeCast[`toInt${bits}`](0).call()).to.be.bignumber.equal("0");
            });

            it("downcasts 1", async function () {
                expect(await this.safeCast[`toInt${bits}`](1).call()).to.be.bignumber.equal("1");
            });

            it("downcasts -1", async function () {
                expect(await this.safeCast[`toInt${bits}`](-1).call()).to.be.bignumber.equal("-1");
            });

            it(`downcasts -2^${bits - 1} (${minValue})`, async function () {
                expect(await this.safeCast[`toInt${bits}`](minValue.toFixed()).call()).to.be.bignumber.equal(minValue);
            });

            it(`downcasts 2^${bits - 1} - 1 (${maxValue})`, async function () {
                expect(await this.safeCast[`toInt${bits}`](maxValue.toFixed()).call()).to.be.bignumber.equal(maxValue);
            });

            it(`reverts when downcasting -2^${bits - 1} - 1 (${minValue.minus(1)})`, async function () {
                await expectRevert(
                    this.safeCast[`toInt${bits}Fail`](minValue.minus(1).toFixed()).send(),
                    `SafeCast: value doesn't fit in ${bits} bits`,
                );
            });

            it(`reverts when downcasting -2^${bits - 1} - 2 (${minValue.minus(2)})`, async function () {
                await expectRevert(
                    this.safeCast[`toInt${bits}Fail`](minValue.minus(2).toFixed()).send(),
                    `SafeCast: value doesn't fit in ${bits} bits`,
                );
            });

            it(`reverts when downcasting 2^${bits - 1} (${maxValue.plus(1)})`, async function () {
                await expectRevert(
                    this.safeCast[`toInt${bits}Fail`](maxValue.plus(1).toFixed()).send(),
                    `SafeCast: value doesn't fit in ${bits} bits`,
                );
            });

            it(`reverts when downcasting 2^${bits - 1} + 1 (${maxValue.plus(2)})`, async function () {
                await expectRevert(
                    this.safeCast[`toInt${bits}Fail`](maxValue.plus(2).toFixed()).send(),
                    `SafeCast: value doesn't fit in ${bits} bits`,
                );
            });
        });
    }

    [8, 16, 32, 64, 128].forEach(bits => testToInt(bits));

    describe("toInt256", () => {
        const maxUint256 = new BN("2").pow(new BN(256)).minus(1);
        const maxInt256 = new BN("2").pow(new BN(255)).minus(1);

        it("casts 0", async function () {
            expect(await this.safeCast.toInt256(0).call()).to.be.bignumber.equal("0");
        });

        it("casts 1", async function () {
            expect(await this.safeCast.toInt256(1).call()).to.be.bignumber.equal("1");
        });

        it(`casts INT256_MAX (${maxInt256})`, async function () {
            expect(await this.safeCast.toInt256(maxInt256.toFixed()).call()).to.be.bignumber.equal(maxInt256);
        });

        it(`reverts when casting INT256_MAX + 1 (${maxInt256.plus(1)})`, async function () {
            await expectRevert(
                this.safeCast.toInt256Fail(maxInt256.plus(1).toFixed()).send(),
                "SafeCast: value doesn't fit in an int256",
            );
        });

        it(`reverts when casting UINT256_MAX (${maxUint256})`, async function () {
            await expectRevert(
                this.safeCast.toInt256Fail(maxUint256.toFixed()).send(),
                "SafeCast: value doesn't fit in an int256",
            );
        });
    });
});
