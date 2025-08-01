

### Introduction

The Cycle Rental dApp is a decentralized application built on the Ethereum blockchain that enables peer-to-peer cycle rentals. The system eliminates intermediaries by using smart contracts to facilitate secure, transparent, and automated rental transactions between cycle owners and renters.


#### Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### Environment Setup

**hardhat.config.js**

```javascript
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

####  Start Local Blockchain

```bash
# Start Hardhat local network
npx hardhat node
```

####  Deploy Smart Contracts

```bash
# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

####  Start Frontend

```bash
# Start React development server
cd frontend
npm start
```


