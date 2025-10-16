# Changelog

All notable changes to the DotStarter SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-16

### Added
- Initial release of DotStarter SDK
- Core blockchain connection management with WebSocket support
- Comprehensive wallet integration (Polkadot.js, Talisman, injected providers)
- Complete balance management with proper decimal formatting
- Full transfer functionality with transaction signing
- Comprehensive staking operations:
  - Bond/unbond tokens
  - Nominate validators
  - Withdraw unbonded tokens
  - Get staking information and validator details
- Governance and democracy support:
  - OpenGov (Gov2) referendum support
  - Legacy democracy module compatibility
  - Voting on referenda with conviction multipliers
  - Treasury proposal management
- Real-time blockchain event subscription
- Complete TypeScript type definitions
- Multi-network support (Polkadot, Kusama, Westend)
- ESM/CJS dual format build output
- Comprehensive error handling with detailed messages

### Technical Features
- Full TypeScript implementation with strict type checking
- Node.js 14.15.4+ compatibility
- Polkadot.js API integration with proper type handling
- Modular architecture with separate managers for different functionalities
- Extensive documentation and examples
- Complete test coverage setup with Vitest

### Developer Experience
- Simple, intuitive API design
- Comprehensive README with usage examples
- TypeScript IntelliSense support
- Proper package.json configuration for npm publishing
- ESLint configuration for code quality
- Automated build pipeline
