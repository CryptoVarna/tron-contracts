const { BN, constants, expectRevert, createContract } = require("@cryptovarna/tron-test-helpers");
const { MAX_UINT256 } = constants;

const { expect } = require("chai");

const SafeMathMock = artifacts.require("SafeMathMock");

function expectStruct(value, expected) {
    for (const key in expected) {
        if (value[key].constructor.name === "BigNumber") {
            expect(value[key]).to.be.bignumber.equal(expected[key].toFixed());
        } else {
            expect(value[key]).to.be.equal(expected[key]);
        }
    }
}

contract("SafeMath", function (accounts) {
    beforeEach(async function () {
        this.safeMath = await createContract(SafeMathMock);
    });

    async function testCommutative(fn, lhs, rhs, expected, ...extra) {
        expect(await fn(lhs.toFixed(), rhs.toFixed(), ...extra).call()).to.be.bignumber.equal(expected.toFixed());
        expect(await fn(rhs.toFixed(), lhs.toFixed(), ...extra).call()).to.be.bignumber.equal(expected.toFixed());
    }

    async function testFailsCommutative(fn, lhs, rhs) {
        await expectRevert.assertion(fn(lhs.toFixed(), rhs.toFixed()).send());
        await expectRevert.assertion(fn(rhs.toFixed(), lhs.toFixed()).send());
    }

    async function testCommutativeIterable(fn, lhs, rhs, expected, ...extra) {
        expectStruct(await fn(lhs.toFixed(), rhs.toFixed(), ...extra).call(), expected);
        expectStruct(await fn(rhs.toFixed(), lhs.toFixed(), ...extra).call(), expected);
    }

    describe("with flag", function () {
        describe("add", function () {
            it("adds correctly", async function () {
                const a = new BN("5678");
                const b = new BN("1234");

                await testCommutativeIterable(this.safeMath.tryAdd, a, b, { flag: true, value: a.plus(b) });
            });

            it("reverts on addition overflow", async function () {
                const a = MAX_UINT256;
                const b = new BN("1");

                testCommutativeIterable(this.safeMath.tryAdd, a, b, { flag: false, value: new BN("0") });
            });
        });

        describe("sub", function () {
            it("subtracts correctly", async function () {
                const a = new BN("5678");
                const b = new BN("1234");

                expectStruct(await this.safeMath.trySub(a.toFixed(), b.toFixed()).call(),
                    { flag: true, value: a.minus(b) });
            });

            it("reverts if subtraction result would be negative", async function () {
                const a = new BN("1234");
                const b = new BN("5678");

                expectStruct(await this.safeMath.trySub(a.toFixed(), b.toFixed()).call(),
                    { flag: false, value: new BN("0") });
            });
        });

        describe("mul", function () {
            it("multiplies correctly", async function () {
                const a = new BN("1234");
                const b = new BN("5678");

                testCommutativeIterable(this.safeMath.tryMul, a, b, { flag: true, value: a.times(b) });
            });

            it("multiplies by zero correctly", async function () {
                const a = new BN("0");
                const b = new BN("5678");

                testCommutativeIterable(this.safeMath.tryMul, a, b, { flag: true, value: a.times(b) });
            });

            it("reverts on multiplication overflow", async function () {
                const a = MAX_UINT256;
                const b = new BN("2");

                testCommutativeIterable(this.safeMath.tryMul, a, b, { flag: false, value: new BN("0") });
            });
        });

        describe("div", function () {
            it("divides correctly", async function () {
                const a = new BN("5678");
                const b = new BN("5678");

                expectStruct(await this.safeMath.tryDiv(a.toFixed(), b.toFixed()).call(),
                    { flag: true, value: a.idiv(b) });
            });

            it("divides zero correctly", async function () {
                const a = new BN("0");
                const b = new BN("5678");

                expectStruct(await this.safeMath.tryDiv(a.toFixed(), b.toFixed()).call(),
                    { flag: true, value: a.idiv(b) });
            });

            it("returns complete number result on non-even division", async function () {
                const a = new BN("7000");
                const b = new BN("5678");

                expectStruct(await this.safeMath.tryDiv(a.toFixed(), b.toFixed()).call(),
                    { flag: true, value: a.idiv(b) });
            });

            it("reverts on division by zero", async function () {
                const a = new BN("5678");
                const b = new BN("0");

                expectStruct(await this.safeMath.tryDiv(a.toFixed(), b.toFixed()).call(),
                    { flag: false, value: new BN("0") });
            });
        });

        describe("mod", function () {
            describe("modulos correctly", async function () {
                it("when the dividend is smaller than the divisor", async function () {
                    const a = new BN("284");
                    const b = new BN("5678");

                    expectStruct(await this.safeMath.tryMod(a.toFixed(), b.toFixed()).call(),
                        { flag: true, value: a.mod(b) });
                });

                it("when the dividend is equal to the divisor", async function () {
                    const a = new BN("5678");
                    const b = new BN("5678");

                    expectStruct(await this.safeMath.tryMod(a.toFixed(), b.toFixed()).call(),
                        { flag: true, value: a.mod(b) });
                });

                it("when the dividend is larger than the divisor", async function () {
                    const a = new BN("7000");
                    const b = new BN("5678");

                    expectStruct(await this.safeMath.tryMod(a.toFixed(), b.toFixed()).call(),
                        { flag: true, value: a.mod(b) });
                });

                it("when the dividend is a multiple of the divisor", async function () {
                    const a = new BN("17034"); // 17034 == 5678 * 3
                    const b = new BN("5678");

                    expectStruct(await this.safeMath.tryMod(a.toFixed(), b.toFixed()).call(),
                        { flag: true, value: a.mod(b) });
                });
            });

            it("reverts with a 0 divisor", async function () {
                const a = new BN("5678");
                const b = new BN("0");

                expectStruct(await this.safeMath.tryMod(a.toFixed(), b.toFixed()).call(),
                    { flag: false, value: new BN("0") });
            });
        });
    });

    describe("with default revert message", function () {
        describe("add", function () {
            it("adds correctly", async function () {
                const a = new BN("5678");
                const b = new BN("1234");

                await testCommutative(this.safeMath.doAdd, a, b, a.plus(b));
            });

            it("reverts on addition overflow", async function () {
                const a = MAX_UINT256;
                const b = new BN("1");

                await testFailsCommutative(this.safeMath.doAddFail, a, b);
            });
        });

        describe("sub", function () {
            it("subtracts correctly", async function () {
                const a = new BN("5678");
                const b = new BN("1234");

                expect(await this.safeMath.doSub(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal(a.minus(b));
            });

            it("reverts if subtraction result would be negative", async function () {
                const a = new BN("1234");
                const b = new BN("5678");

                await expectRevert.assertion(this.safeMath.doSubFail(a.toFixed(), b.toFixed()).send());
            });
        });

        describe("mul", function () {
            it("multiplies correctly", async function () {
                const a = new BN("1234");
                const b = new BN("5678");

                await testCommutative(this.safeMath.doMul, a, b, a.times(b));
            });

            it("multiplies by zero correctly", async function () {
                const a = new BN("0");
                const b = new BN("5678");

                await testCommutative(this.safeMath.doMul, a, b, new BN("0"));
            });

            it("reverts on multiplication overflow", async function () {
                const a = MAX_UINT256;
                const b = new BN("2");

                await testFailsCommutative(this.safeMath.doMulFail, a, b);
            });
        });

        describe("div", function () {
            it("divides correctly", async function () {
                const a = new BN("5678");
                const b = new BN("5678");

                expect(await this.safeMath.doDiv(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal(a.div(b));
            });

            it("divides zero correctly", async function () {
                const a = new BN("0");
                const b = new BN("5678");

                expect(await this.safeMath.doDiv(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal("0");
            });

            it("returns complete number result on non-even division", async function () {
                const a = new BN("7000");
                const b = new BN("5678");

                expect(await this.safeMath.doDiv(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal("1");
            });

            it("reverts on division by zero", async function () {
                const a = new BN("5678");
                const b = new BN("0");

                await expectRevert.assertion(this.safeMath.doDivFail(a.toFixed(), b.toFixed()).send());
            });
        });

        describe("mod", function () {
            describe("modulos correctly", async function () {
                it("when the dividend is smaller than the divisor", async function () {
                    const a = new BN("284");
                    const b = new BN("5678");

                    expect(await this.safeMath.doMod(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal(a.mod(b));
                });

                it("when the dividend is equal to the divisor", async function () {
                    const a = new BN("5678");
                    const b = new BN("5678");

                    expect(await this.safeMath.doMod(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal(a.mod(b));
                });

                it("when the dividend is larger than the divisor", async function () {
                    const a = new BN("7000");
                    const b = new BN("5678");

                    expect(await this.safeMath.doMod(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal(a.mod(b));
                });

                it("when the dividend is a multiple of the divisor", async function () {
                    const a = new BN("17034"); // 17034 == 5678 * 3
                    const b = new BN("5678");

                    expect(await this.safeMath.doMod(a.toFixed(), b.toFixed()).call()).to.be.bignumber.equal(a.mod(b));
                });
            });

            it("reverts with a 0 divisor", async function () {
                const a = new BN("5678");
                const b = new BN("0");

                await expectRevert.assertion(this.safeMath.doModFail(a.toFixed(), b.toFixed()).send());
            });
        });
    });

    describe("with custom revert message", function () {
        describe("sub", function () {
            it("subtracts correctly", async function () {
                const a = new BN("5678");
                const b = new BN("1234");

                expect(await this.safeMath.subWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send({ shouldPollResponse: true }))
                    .to.be.bignumber.equal(a.minus(b));
            });

            it("reverts if subtraction result would be negative", async function () {
                const a = new BN("1234");
                const b = new BN("5678");

                await expectRevert(this.safeMath.subWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send(), "MyErrorMessage");
            });
        });

        describe("div", function () {
            it("divides correctly", async function () {
                const a = new BN("5678");
                const b = new BN("5678");

                expect(await this.safeMath.divWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send({ shouldPollResponse: true }))
                    .to.be.bignumber.equal(a.div(b));
            });

            it("divides zero correctly", async function () {
                const a = new BN("0");
                const b = new BN("5678");

                expect(await this.safeMath.divWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send({ shouldPollResponse: true }))
                    .to.be.bignumber.equal("0");
            });

            it("returns complete number result on non-even division", async function () {
                const a = new BN("7000");
                const b = new BN("5678");

                expect(await this.safeMath.divWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send({ shouldPollResponse: true }))
                    .to.be.bignumber.equal("1");
            });

            it("reverts on division by zero", async function () {
                const a = new BN("5678");
                const b = new BN("0");

                await expectRevert(this.safeMath.divWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send(), "MyErrorMessage");
            });
        });

        describe("mod", function () {
            describe("modulos correctly", async function () {
                it("when the dividend is smaller than the divisor", async function () {
                    const a = new BN("284");
                    const b = new BN("5678");

                    expect(await this.safeMath.modWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                        .send({ shouldPollResponse: true }))
                        .to.be.bignumber.equal(a.mod(b));
                });

                it("when the dividend is equal to the divisor", async function () {
                    const a = new BN("5678");
                    const b = new BN("5678");

                    expect(await this.safeMath.modWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                        .send({ shouldPollResponse: true }))
                        .to.be.bignumber.equal(a.mod(b));
                });

                it("when the dividend is larger than the divisor", async function () {
                    const a = new BN("7000");
                    const b = new BN("5678");

                    expect(await this.safeMath.modWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                        .send({ shouldPollResponse: true }))
                        .to.be.bignumber.equal(a.mod(b));
                });

                it("when the dividend is a multiple of the divisor", async function () {
                    const a = new BN("17034"); // 17034 == 5678 * 3
                    const b = new BN("5678");

                    expect(await this.safeMath.modWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                        .send({ shouldPollResponse: true }))
                        .to.be.bignumber.equal(a.mod(b));
                });
            });

            it("reverts with a 0 divisor", async function () {
                const a = new BN("5678");
                const b = new BN("0");

                await expectRevert(this.safeMath.modWithMessage(a.toFixed(), b.toFixed(), "MyErrorMessage")
                    .send(), "MyErrorMessage");
            });
        });
    });

    describe("memory leakage", function () {
        it("add", async function () {
            expect((await this.safeMath.addMemoryCheck().call()).mem).to.be.bignumber.equal("0");
        });

        it("sub", async function () {
            expect((await this.safeMath.subMemoryCheck().call()).mem).to.be.bignumber.equal("0");
        });

        it("mul", async function () {
            expect((await this.safeMath.mulMemoryCheck().call()).mem).to.be.bignumber.equal("0");
        });

        it("div", async function () {
            expect((await this.safeMath.divMemoryCheck().call()).mem).to.be.bignumber.equal("0");
        });

        it("mod", async function () {
            expect((await this.safeMath.modMemoryCheck().call()).mem).to.be.bignumber.equal("0");
        });
    });
});
