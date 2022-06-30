const ethSigUtil = require("eth-sig-util");

const TIP712Domain = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
];

async function domainSeparator(name, version, chainId, verifyingContract) {
    return "0x" + ethSigUtil.TypedDataUtils.hashStruct(
        "TIP712Domain",
        { name, version, chainId, verifyingContract },
        { TIP712Domain },
    ).toString("hex");
}

module.exports = {
    TIP712Domain,
    domainSeparator,
};
