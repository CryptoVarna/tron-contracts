const { expectRevert, singletons } = require("@cryptovarna/tron-test-helpers");
const { bufferToHex, keccakFromString } = require("ethereumjs-util");

const { expect } = require("chai");

const TRC1820ImplementerMock = artifacts.require("TRC1820ImplementerMock");

contract("TRC1820Implementer", function (accounts) {
    const [registryFunder, implementee, other] = accounts;

    const TRC1820_ACCEPT_MAGIC = bufferToHex(keccakFromString("TRC1820_ACCEPT_MAGIC"));

    beforeEach(async function () {
        this.implementer = await TRC1820ImplementerMock.new();
        this.registry = await singletons.TRC1820Registry(registryFunder);

        this.interfaceA = bufferToHex(keccakFromString("interfaceA"));
        this.interfaceB = bufferToHex(keccakFromString("interfaceB"));
    });

    context("with no registered interfaces", function () {
        it("returns false when interface implementation is queried", async function () {
            expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceA, implementee))
                .to.not.equal(TRC1820_ACCEPT_MAGIC);
        });

        it("reverts when attempting to set as implementer in the registry", async function () {
            await expectRevert(
                this.registry.setInterfaceImplementer(
                    implementee, this.interfaceA, this.implementer.address, { from: implementee },
                ),
                "Does not implement the interface",
            );
        });
    });

    context("with registered interfaces", function () {
        beforeEach(async function () {
            await this.implementer.registerInterfaceForAddress(this.interfaceA, implementee);
        });

        it("returns true when interface implementation is queried", async function () {
            expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceA, implementee))
                .to.equal(TRC1820_ACCEPT_MAGIC);
        });

        it("returns false when interface implementation for non-supported interfaces is queried", async function () {
            expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceB, implementee))
                .to.not.equal(TRC1820_ACCEPT_MAGIC);
        });

        it("returns false when interface implementation for non-supported addresses is queried", async function () {
            expect(await this.implementer.canImplementInterfaceForAddress(this.interfaceA, other))
                .to.not.equal(TRC1820_ACCEPT_MAGIC);
        });

        it("can be set as an implementer for supported interfaces in the registry", async function () {
            await this.registry.setInterfaceImplementer(
                implementee, this.interfaceA, this.implementer.address, { from: implementee },
            );

            expect(await this.registry.getInterfaceImplementer(implementee, this.interfaceA))
                .to.equal(this.implementer.address);
        });
    });
});
