import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

function Home(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout description={siteConfig.tagline}>
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <h1 style={{fontSize: '3rem', marginBottom: '0.5rem'}}>⚯ fe</h1>
        <p style={{fontSize: '1.25rem', opacity: 0.8, maxWidth: '600px'}}>
          {siteConfig.tagline}
        </p>
        <p style={{opacity: 0.6, maxWidth: '700px', lineHeight: 1.6}}>
          A microfrontend platform built on native browser primitives — ES modules,
          import maps, and dynamic <code>import()</code>. MFEs deploy independently
          and compose at runtime.
        </p>
        <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
          <a
            href="/docs"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: 'var(--ifm-color-primary)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Get Started
          </a>
          <a
            href="https://github.com/AshGw/fe"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--ifm-color-emphasis-300)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            GitHub
          </a>
        </div>
      </main>
    </Layout>
  );
}

export default Home;
