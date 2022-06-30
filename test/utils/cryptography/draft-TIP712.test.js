const { account, createContract } = require("@cryptovarna/tron-test-helpers");
const { hexToBytes } = require("../../helpers/bytes");
const ethSigUtil = require("eth-sig-util");

const { TIP712Domain, domainSeparator } = require("../../helpers/tip712");

const TIP712 = artifacts.require("TIP712External");

contract("TIP712", function (accounts) {
    const [mailTo] = accounts;

    const name = "A Name";
    const version = "1";

    beforeEach("deploying", async function () {
        this.tip712 = await createContract(TIP712, name, version);

        // We get the chain id from the contract because Ganache (used for coverage) does not return the same chain id
        // from within the EVM as from the JSON RPC interface.
        // See https://github.com/trufflesuite/ganache-core/issues/515
        this.chainId = (await this.tip712.getChainId().call()).toString();
    });

    it("domain separator", async function () {
        expect(
            await this.tip712.domainSeparator().call(),
        ).to.equal(
            await domainSeparator(name, version, this.chainId, account.toHexAddress(this.tip712.address, true)),
        );
    });

    it("digest", async function () {
        const chainId = this.chainId;
        const verifyingContract = account.toHexAddress(this.tip712.address, true);
        const message = {
            to: account.toHexAddress(mailTo, true),
            contents: "very interesting",
        };

        const data = {
            types: {
                TIP712Domain,
                Mail: [
                    { name: "to", type: "address" },
                    { name: "contents", type: "string" },
                ],
            },
            domain: { name, version, chainId, verifyingContract },
            primaryType: "Mail",
            message,
        };

        const pk = "0x" + account.getPrivateKey(mailTo);
        const signature = ethSigUtil.signTypedMessage(hexToBytes(pk), { data });
        const [a, b] = await this.tip712.verify(signature, mailTo, message.to, message.contents).call();
        console.log(a, b);
    });
});
