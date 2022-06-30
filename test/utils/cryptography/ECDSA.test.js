const { createContract, account, expectRevert } = require("@cryptovarna/tron-test-helpers");
const { toTronSignedMessageHash } = require("../../helpers/sign");
const { hexToBytes, bytesToHex } = require("../../helpers/bytes");

const { expect } = require("chai");

const ECDSAMock = artifacts.require("ECDSAMock");

const TEST_MESSAGE = tronWeb.sha3("CryptoVarna");
const WRONG_MESSAGE = tronWeb.sha3("Nope");

function to2098Format(signature) {
    const long = hexToBytes(signature);
    expect(long.length).to.be.equal(65);
    const short = long.slice(0, 64);
    short[32] |= (long[64] % 27) << 7; // set the first bit of the 32nd byte to the v parity bit
    return bytesToHex(short);
}

function from2098Format(signature) {
    const short = hexToBytes(signature);
    expect(short.length).to.be.equal(64);
    short.push((short[32] >> 7) + 27);
    short[32] &= (1 << 7) - 1; // zero out the first bit of 1 the 32nd byte
    return bytesToHex(short);
}

contract("ECDSA", function (accounts) {
    const [other] = accounts;

    beforeEach(async function () {
        this.ecdsa = await createContract(ECDSAMock);
    });

    context("recover with invalid signature", function () {
        it("with short signature", async function () {
            await expectRevert(this.ecdsa.recover(TEST_MESSAGE, "0x1234").send(), "ECDSA: invalid signature length");
        });

        it("with long signature", async function () {
            await expectRevert(
                // eslint-disable-next-line max-len
                this.ecdsa.recover(TEST_MESSAGE, "0x01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789")
                    .send(),
                "ECDSA: invalid signature length",
            );
        });
    });

    context("recover with valid signature", function () {
        context("using tronWeb.trx.sign", function () {
            it("returns signer address with correct signature", async function () {
                // Create the signature
                const signature = await tronWeb.trx.sign(TEST_MESSAGE, account.getPrivateKey(other));

                // Recover the signer address from the generated message and signature.
                expect(await this.ecdsa.recover(
                    toTronSignedMessageHash(TEST_MESSAGE),
                    signature,
                )
                    .send({ shouldPollResponse: true }))
                    .to.equal(account.toHexAddress(other));
            });

            it("returns a different address", async function () {
                const signature = await tronWeb.trx.sign(TEST_MESSAGE, account.getPrivateKey(other));
                expect(await this.ecdsa.recover(WRONG_MESSAGE, signature)
                    .send({ shouldPollResponse: true }))
                    .to.not.equal(account.toHexAddress(other));
            });

            it("reverts with invalid signature", async function () {
                // eslint-disable-next-line max-len
                const signature = "0x332ce75a821c982f9127538858900d87d3ec1f9f737338ad67cad133fa48feff48e6fa0c18abc62e42820f05943e47af3e9fbe306ce74d64094bdf1691ee53e01c";
                await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature).send(), "ECDSA: invalid signature");
            });
        });

        context("with v0 signature", function () {
            // Signature generated with the following code:
            // const ethers = tronWeb.utils.ethersUtils;
            // let signingKey = new ethers.SigningKey(tronWeb.defaultPrivateKey);
            // let message = "CryptoVarna";
            // let messageBytes = ethers.toUtf8Bytes(message);
            // let messageDigest = ethers.keccak256(messageBytes);
            // let signature = signingKey.signDigest(messageDigest);

            // eslint-disable-next-line max-len
            const signatureWithoutVersion = "0xc96f4a444e6bf1edda3182f174148008cc25e453c161aa86739f91578194c07801d547ab51df0b26e190d710d2f76393eca9b7b7a226426b12d9157dbea97574";
            const signer = "417b11ba9caf5f2651ef9cba628b206fd1275aa5b5";

            it("reverts with 00 as version value", async function () {
                const version = "00";
                const signature = signatureWithoutVersion + version;
                await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature).send(),
                    "ECDSA: invalid signature 'v' value");
            });

            it("works with 27 as version value", async function () {
                const version = "1b"; // 27 = 1b.
                const signature = signatureWithoutVersion + version;
                expect(await this.ecdsa.recover(TEST_MESSAGE, signature)
                    .send({ shouldPollResponse: true }))
                    .to.equal(signer);
            });

            it("reverts with wrong version", async function () {
                // The last two hex digits are the signature version.
                // The only valid values are 0, 1, 27 and 28.
                const version = "02";
                const signature = signatureWithoutVersion + version;
                await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature).send(),
                    "ECDSA: invalid signature 'v' value");
            });

            it("works with short EIP2098 format", async function () {
                const version = "1b"; // 27 = 1b.
                const signature = signatureWithoutVersion + version;
                expect(await this.ecdsa.recover(TEST_MESSAGE, to2098Format(signature))
                    .send({ shouldPollResponse: true }))
                    .to.equal(signer);
                expect(await this.ecdsa.recover(TEST_MESSAGE, from2098Format(to2098Format(signature)))
                    .send({ shouldPollResponse: true }))
                    .to.equal(signer);
            });
        });

        context("with v1 signature", function () {
            // eslint-disable-next-line max-len
            const signatureWithoutVersion = "0xc96f4a444e6bf1edda3182f174148008cc25e453c161aa86739f91578194c07801d547ab51df0b26e190d710d2f76393eca9b7b7a226426b12d9157dbea97574";
            const signer = "417c5ace08f3b32b0db899cbfe37e1ce7aca7d1857";

            it("reverts with 01 as version value", async function () {
                const version = "01";
                const signature = signatureWithoutVersion + version;
                await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature).send(),
                    "ECDSA: invalid signature 'v' value");
            });

            it("works with 28 as version value", async function () {
                const version = "1c"; // 28 = 1c.
                const signature = signatureWithoutVersion + version;
                expect(await this.ecdsa.recover(TEST_MESSAGE, signature)
                    .send({ shouldPollResponse: true }))
                    .to.equal(signer);
            });

            it("reverts with wrong version", async function () {
                // The last two hex digits are the signature version.
                // The only valid values are 0, 1, 27 and 28.
                const version = "02";
                const signature = signatureWithoutVersion + version;
                await expectRevert(this.ecdsa.recover(TEST_MESSAGE, signature).send(),
                    "ECDSA: invalid signature 'v' value");
            });

            it("works with short EIP2098 format", async function () {
                const version = "1c"; // 27 = 1b.
                const signature = signatureWithoutVersion + version;
                expect(await this.ecdsa.recover(TEST_MESSAGE, to2098Format(signature))
                    .send({ shouldPollResponse: true }))
                    .to.equal(signer);
                expect(await this.ecdsa.recover(TEST_MESSAGE, from2098Format(to2098Format(signature)))
                    .send({ shouldPollResponse: true }))
                    .to.equal(signer);
            });
        });

        it("reverts with high-s value signature", async function () {
            const message = "0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
            // eslint-disable-next-line max-len
            const highSSignature = "0xe742ff452d41413616a5bf43fe15dd88294e983d3d36206c2712f39083d638bde0a0fc89be718fbc1033e1d30d78be1c68081562ed2e97af876f286f3453231d1b";

            await expectRevert(this.ecdsa.recover(message, highSSignature).send(),
                "ECDSA: invalid signature 's' value");
        });
    });

    context("toTronSignedMessageHash", function () {
        it("prefixes hashes correctly", async function () {
            expect(await this.ecdsa.toTronSignedMessageHash(TEST_MESSAGE)
                .send({ shouldPollResponse: true }))
                .to.equal(toTronSignedMessageHash(TEST_MESSAGE));
        });
    });
});
