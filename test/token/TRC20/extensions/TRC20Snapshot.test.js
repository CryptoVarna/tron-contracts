const { BN, expectEvent, expectRevert, createContract, account } = require("@cryptovarna/tron-test-helpers");
const TRC20SnapshotMock = artifacts.require("TRC20SnapshotMock");

const { expect } = require("chai");

contract("TRC20Snapshot", function (accounts) {
    const [initialHolder, recipient, other] = accounts;

    const initialSupply = new BN(100);

    const name = "My Token";
    const symbol = "MTKN";

    beforeEach(async function () {
        this.token = await createContract(TRC20SnapshotMock, name, symbol, initialHolder, initialSupply.toFixed());
    });

    describe("snapshot", function () {
        it("emits a snapshot event", async function () {
            const txId = await this.token.snapshot().send();
            await expectEvent.inTransaction(txId, this.token, "Snapshot");
        });

        it("creates increasing snapshots ids, starting from 1", async function () {
            for (const id of ["1", "2", "3", "4", "5"]) {
                const txId = await this.token.snapshot().send();
                await expectEvent.inTransaction(txId, this.token, "Snapshot", { id });
            }
        });
    });

    describe("totalSupplyAt", function () {
        it("reverts with a snapshot id of 0", async function () {
            await expectRevert(this.token.totalSupplyAtMock(0).send(), "TRC20Snapshot: id is 0");
        });

        it("reverts with a not-yet-created snapshot id", async function () {
            await expectRevert(this.token.totalSupplyAtMock(1).send(), "TRC20Snapshot: nonexistent id");
        });

        context("with initial snapshot", function () {
            beforeEach(async function () {
                this.initialSnapshotId = new BN("1");

                const txId = await this.token.snapshot().send();
                await expectEvent.inTransaction(txId, this.token, "Snapshot", { id: this.initialSnapshotId });
            });

            context("with no supply changes after the snapshot", function () {
                it("returns the current total supply", async function () {
                    expect(await this.token.totalSupplyAt(this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal(initialSupply);
                });
            });

            context("with supply changes after the snapshot", function () {
                beforeEach(async function () {
                    await this.token.mint(other, new BN("50").toFixed()).send();
                    await this.token.burn(initialHolder, new BN("20").toFixed()).send({ shouldPollResponse: true });
                });

                it("returns the total supply before the changes", async function () {
                    expect(await this.token.totalSupplyAt(this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal(initialSupply);
                });

                context("with a second snapshot after supply changes", function () {
                    beforeEach(async function () {
                        this.secondSnapshotId = new BN("2");

                        const txId = await this.token.snapshot().send();
                        await expectEvent.inTransaction(txId, this.token, "Snapshot", { id: this.secondSnapshotId });
                    });

                    it("snapshots return the supply before and after the changes", async function () {
                        expect(await this.token.totalSupplyAt(this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal(initialSupply);

                        expect(await this.token.totalSupplyAt(this.secondSnapshotId.toFixed()).call()).to.be.bignumber.equal(
                            BN(await this.token.totalSupply().call()),
                        );
                    });
                });

                context("with multiple snapshots after supply changes", function () {
                    beforeEach(async function () {
                        this.secondSnapshotIds = [new BN("2"), new BN("3"), new BN("4")];

                        for (const id of this.secondSnapshotIds) {
                            const txId = await this.token.snapshot().send();
                            await expectEvent.inTransaction(txId, this.token, "Snapshot", { id });
                        }
                    });

                    it("all posterior snapshots return the supply after the changes", async function () {
                        expect(await this.token.totalSupplyAt(this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal(initialSupply);

                        const currentSupply = BN(await this.token.totalSupply().call());

                        for (const id of this.secondSnapshotIds) {
                            expect(await this.token.totalSupplyAt(id.toFixed()).call()).to.be.bignumber.equal(currentSupply);
                        }
                    });
                });
            });
        });
    });

    describe("balanceOfAt", function () {
        it("reverts with a snapshot id of 0", async function () {
            await expectRevert(this.token.balanceOfAtMock(other, 0).send(), "TRC20Snapshot: id is 0");
        });

        it("reverts with a not-yet-created snapshot id", async function () {
            await expectRevert(this.token.balanceOfAtMock(other, 1).send(), "TRC20Snapshot: nonexistent id");
        });

        context("with initial snapshot", function () {
            beforeEach(async function () {
                this.initialSnapshotId = new BN("1");

                const txId = await this.token.snapshot().send();
                await expectEvent.inTransaction(txId, this.token, "Snapshot", { id: this.initialSnapshotId });
            });

            context("with no balance changes after the snapshot", function () {
                it("returns the current balance for all accounts", async function () {
                    expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId.toFixed()).call())
                        .to.be.bignumber.equal(initialSupply);
                    expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");
                    expect(await this.token.balanceOfAt(other, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");
                });
            });

            context("with balance changes after the snapshot", function () {
                beforeEach(async function () {
                    account.setDefault(initialHolder);
                    await this.token.transfer(recipient, new BN("10").toFixed()).send();
                    await this.token.mint(other, new BN("50").toFixed()).send();
                    await this.token.burn(initialHolder, new BN("20").toFixed()).send({ shouldPollResponse: true });
                });

                it("returns the balances before the changes", async function () {
                    expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId.toFixed()).call())
                        .to.be.bignumber.equal(initialSupply);
                    expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");
                    expect(await this.token.balanceOfAt(other, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");
                });

                context("with a second snapshot after supply changes", function () {
                    beforeEach(async function () {
                        this.secondSnapshotId = new BN("2");

                        const txId = await this.token.snapshot().send();
                        await expectEvent.inTransaction(txId, this.token, "Snapshot", { id: this.secondSnapshotId });
                    });

                    it("snapshots return the balances before and after the changes", async function () {
                        expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId.toFixed()).call())
                            .to.be.bignumber.equal(initialSupply);
                        expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");
                        expect(await this.token.balanceOfAt(other, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");

                        expect(await this.token.balanceOfAt(initialHolder, this.secondSnapshotId.toFixed()).call()).to.be.bignumber.equal(
                            BN(await this.token.balanceOf(initialHolder).call()),
                        );
                        expect(await this.token.balanceOfAt(recipient, this.secondSnapshotId.toFixed()).call()).to.be.bignumber.equal(
                            BN(await this.token.balanceOf(recipient).call()),
                        );
                        expect(await this.token.balanceOfAt(other, this.secondSnapshotId.toFixed()).call()).to.be.bignumber.equal(
                            BN(await this.token.balanceOf(other).call()),
                        );
                    });
                });

                context("with multiple snapshots after supply changes", function () {
                    beforeEach(async function () {
                        this.secondSnapshotIds = [new BN("2"), new BN("3"), new BN("4")];

                        for (const id of this.secondSnapshotIds) {
                            const txId = await this.token.snapshot().send();
                            await expectEvent.inTransaction(txId, this.token, "Snapshot", { id });
                        }
                    });

                    it("all posterior snapshots return the supply after the changes", async function () {
                        expect(await this.token.balanceOfAt(initialHolder, this.initialSnapshotId.toFixed()).call())
                            .to.be.bignumber.equal(initialSupply);
                        expect(await this.token.balanceOfAt(recipient, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");
                        expect(await this.token.balanceOfAt(other, this.initialSnapshotId.toFixed()).call()).to.be.bignumber.equal("0");

                        for (const id of this.secondSnapshotIds) {
                            expect(await this.token.balanceOfAt(initialHolder, id.toFixed()).call()).to.be.bignumber.equal(
                                BN(await this.token.balanceOf(initialHolder).call()),
                            );
                            expect(await this.token.balanceOfAt(recipient, id.toFixed()).call()).to.be.bignumber.equal(
                                BN(await this.token.balanceOf(recipient).call()),
                            );
                            expect(await this.token.balanceOfAt(other, id.toFixed()).call()).to.be.bignumber.equal(
                                BN(await this.token.balanceOf(other).call()),
                            );
                        }
                    });
                });
            });
        });
    });
});
