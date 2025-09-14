# 🌍 Blockchain-Based Supply Chain Transparency for Sustainable Agriculture

Welcome to a decentralized solution for transparent and sustainable agricultural supply chains! This project uses the Stacks blockchain and Clarity smart contracts to track the journey of agricultural products from farm to table, ensuring ethical sourcing, sustainability, and consumer trust.

## ✨ Features
- 🌱 **Traceable Product Journey**: Record every step of a product's supply chain, from planting to delivery.
- 🏷 **Certification Verification**: Verify organic, fair trade, or other certifications on-chain.
- 🌍 **Environmental Impact Tracking**: Log carbon footprint and sustainable practices.
- 🔐 **Immutable Records**: Ensure tamper-proof data with blockchain timestamps.
- 🛒 **Consumer Transparency**: Allow consumers to scan a QR code to view a product’s supply chain history.
- 🤝 **Stakeholder Collaboration**: Enable farmers, distributors, and retailers to update supply chain data securely.
- 🚫 **Fraud Prevention**: Prevent duplicate or false entries with unique product IDs.

## 🛠 How It Works

### For Farmers
1. Register a product batch with a unique ID, origin details, and certifications.
2. Record farming practices (e.g., organic methods, water usage) using `register-product`.
3. Update the batch status (e.g., harvested, shipped) via `update-batch-status`.

### For Distributors/Retailers
1. Add logistics data (e.g., transport method, storage conditions) using `add-logistics`.
2. Verify certifications with `verify-certification`.
3. Ensure batch authenticity with `check-batch-authenticity`.

### For Consumers
1. Scan a product’s QR code to retrieve its supply chain history via `get-product-details`.
2. Verify sustainability claims and certifications instantly.

### For Certifiers
1. Issue or revoke certifications using `issue-certification` and `revoke-certification`.
2. Ensure only authorized certifiers can update certification status.

## 📜 Smart Contracts

This project uses 8 Clarity smart contracts to manage the supply chain ecosystem:

1. **ProductRegistry.clar**
   - Registers new product batches with unique IDs, farm details, and timestamps.
   - Prevents duplicate registrations using unique batch hashes.

2. **BatchStatus.clar**
   - Tracks the status of product batches (e.g., planted, harvested, shipped, delivered).
   - Ensures only authorized stakeholders can update statuses.

3. **CertificationManager.clar**
   - Manages organic, fair trade, or other certifications.
   - Allows authorized certifiers to issue or revoke certifications.

4. **LogisticsTracker.clar**
   - Records logistics data (e.g., transport mode, storage conditions, timestamps).
   - Links logistics updates to specific product batches.

5. **CarbonFootprint.clar**
   - Logs environmental impact data (e.g., carbon emissions, water usage).
   - Provides transparency for sustainability claims.

6. **StakeholderAuth.clar**
   - Manages permissions for farmers, distributors, retailers, and certifiers.
   - Ensures only authorized parties can interact with specific functions.

7. **ConsumerQuery.clar**
   - Provides read-only access for consumers to view product details and supply chain history.
   - Supports QR code-based lookups.

8. **FraudPrevention.clar**
   - Verifies batch authenticity and prevents fraudulent entries.
   - Uses cryptographic hashes to ensure data integrity.

## 🚀 Getting Started

### Prerequisites
- [Stacks Blockchain](https://www.stacks.co/) with a local or testnet node.
- [Clarity SDK](https://docs.stacks.co/clarity) for contract development.
- [Hiro Wallet](https://www.hiro.so/wallet) for interacting with the blockchain.

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/supply-chain-transparency.git
   ```
2. Deploy the Clarity smart contracts using the Stacks CLI:
   ```bash
   stacks deploy ProductRegistry.clar --testnet
   ```
3. Configure stakeholder permissions in `StakeholderAuth.clar`.
4. Test the system using the provided sample scripts in the `tests/` folder.

### Usage
- **Farmers**: Call `register-product` with batch details (e.g., `{batch-id: u123, origin: "Farm A", cert-id: u456}`).
- **Distributors**: Update logistics with `add-logistics` (e.g., `{batch-id: u123, transport: "truck", timestamp: u1697059200}`).
- **Consumers**: Query product details with `get-product-details` using the batch ID from a QR code.
- **Certifiers**: Issue certifications via `issue-certification` (e.g., `{batch-id: u123, cert-type: "organic"}`).

## 📊 Impact
- **Transparency**: Consumers can trust product origins and sustainability claims.
- **Sustainability**: Farmers and distributors are incentivized to adopt eco-friendly practices.
- **Fraud Reduction**: Immutable records prevent counterfeit products and false claims.
- **Fair Trade**: Ensures fair compensation for farmers through verified supply chains.

## 🌟 Why This Matters
This project empowers consumers to make informed choices, supports sustainable farming, and builds trust in global supply chains. By leveraging blockchain, we ensure that every tomato, coffee bean, or avocado tells its authentic story.
