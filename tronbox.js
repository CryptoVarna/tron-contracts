const port = process.env.HOST_PORT || 9090;

module.exports = {
    networks: {
        mainnet: {
            // Don't put your private key here:
            privateKey: process.env.PRIVATE_KEY_MAINNET,
            userFeePercentage: 0,
            originEnergyLimit: 1e7,
            feeLimit: 1e8,
            fullHost: "https://api.trongrid.io",
            network_id: "1",
        },
        shasta: {
            privateKey: process.env.PRIVATE_KEY_SHASTA,
            userFeePercentage: 0,
            feeLimit: 1e8,
            originEnergyLimit: 1e7,
            fullHost: "https://api.shasta.trongrid.io",
            network_id: "2",
        },
        nile: {
            privateKey: process.env.PRIVATE_KEY_NILE,
            userFeePercentage: 50,
            feeLimit: 1e8,
            fullHost: "https://nile.trongrid.io/",
            network_id: "3",
        },
        development: {
            // For trontools/quickstart docker image
            privateKey: "ac2958cf53def179b2a40e7f729bfbbaaf18245b0bac610711c0612376645f5a",
            userFeePercentage: 0,
            feeLimit: 1e8,
            fullHost: "http://127.0.0.1:9090",
            network_id: "9",
        },
        compilers: {
            solc: {
                version: "0.8.0", // for compiler version
            },
        },
    },
    // solc compiler optimize
    solc: {
        optimizer: {
            enabled: true, // default: false, true: enable solc optimize
            runs: 200,
        },
        evmVersion: "istanbul",
    },
};
