const { createContract, account } = require("@cryptovarna/tron-test-helpers");
const { toTronSignedMessageHash } = require("../../helpers/sign");

const { expect } = require("chai");

const SignatureCheckerMock = artifacts.require("SignatureCheckerMock");
const TRC1271WalletMock = artifacts.require("TRC1271WalletMock");

const TEST_MESSAGE = tronWeb.sha3("CryptoVarna");
const WRONG_MESSAGE = tronWeb.sha3("Nope");

contract("SignatureChecker (TRC1271)", function (accounts) {
    const [signer, other] = accounts;

    before("deploying", async function () {
        this.signaturechecker = await createContract(SignatureCheckerMock);
        this.wallet = await createContract(TRC1271WalletMock, signer);
        this.signature = await tronWeb.trx.sign(TEST_MESSAGE, account.getPrivateKey(signer));
    });

    context("EOA account", function () {
        it("with matching signer and signature", async function () {
            expect(await this.signaturechecker.isValidSignatureNow(
                signer,
                toTronSignedMessageHash(TEST_MESSAGE),
                this.signature,
            ).call()).to.equal(true);
        });

        it("with invalid signer", async function () {
            expect(await this.signaturechecker.isValidSignatureNow(
                other,
                toTronSignedMessageHash(TEST_MESSAGE),
                this.signature,
            ).call()).to.equal(false);
        });

        it("with invalid signature", async function () {
            expect(await this.signaturechecker.isValidSignatureNow(
                signer,
                toTronSignedMessageHash(WRONG_MESSAGE),
                this.signature,
            ).call()).to.equal(false);
        });
    });

    context("TRC1271 wallet", function () {
        it("with matching signer and signature", async function () {
            expect(await this.signaturechecker.isValidSignatureNow(
                this.wallet.address,
                toTronSignedMessageHash(TEST_MESSAGE),
                this.signature,
            ).call()).to.equal(true);
        });

        it("with invalid signer", async function () {
            expect(await this.signaturechecker.isValidSignatureNow(
                this.signaturechecker.address,
                toTronSignedMessageHash(TEST_MESSAGE),
                this.signature,
            ).call()).to.equal(false);
        });

        it("with invalid signature", async function () {
            expect(await this.signaturechecker.isValidSignatureNow(
                this.wallet.address,
                toTronSignedMessageHash(WRONG_MESSAGE),
                this.signature,
            ).call()).to.equal(false);
        });
    });
});
