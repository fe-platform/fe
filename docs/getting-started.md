# Getting Started

This guide will walk you through setting up your first fe microfrontend.

## Prerequisites

- [Bun](https://bun.sh) installed on your system

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AshGw/fe.git
   cd fe
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

## Running the Dev Server

```bash
bun run fe dev
```

This starts the development server with HMR support.

## Building for Production

```bash
bun run fe build <target>
```

## What's Next?

- Read the [Architecture Overview](architecture/overview.md) to understand the design
- Explore the [MFE Interface](architecture/mfe-interface.md) contract
- Check out the [CLI commands](packages/cli.md)