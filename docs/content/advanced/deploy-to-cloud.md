---
sidebar_position: 4
---

# Deploy to Cloud

:::note
This section is currently under development. Here are the key points to be discussed.
:::

## TODO: Discussion Points

- **Deployment Strategies:** How to deploy the fe platform (JIT server, source storage, and shell) to major cloud providers (AWS, GCP, Azure).
- **Enterprise Readiness:** 
    - High availability and scalability of the JIT bundler.
    - Security and access control for `SourceStorage`.
    - Content Security Policy (CSP) considerations for dynamic import maps.
- **Challenges and External Solutions:**
    - Managing large-scale `platform.json` files.
    - Distributed caching of JIT bundles.
    - Observability and monitoring for on-the-fly compilation.
- **Pros and Cons of Different Approaches:**
    - Self-hosting the JIT server vs. using serverless functions.
    - Persistent storage vs. ephemeral scratch space for the bundler.
    - Regional vs. global deployment of the source storage.

Stay tuned for updates as I document practical cloud deployment patterns.
