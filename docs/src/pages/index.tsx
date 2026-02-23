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
        <img 
          src="img/logo.svg" 
          alt="fe logo" 
          style={{ 
            width: '140px', 
            height: '140px', 
            marginBottom: '1.5rem',
          }} 
        />
        <h1 style={{fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'lowercase'}}>{siteConfig.title}</h1>
        <p style={{fontSize: '1.25rem', opacity: 0.9, maxWidth: '600px', marginBottom: '1.25rem', fontWeight: 600}}>
          {siteConfig.tagline}
        </p>
        <p style={{fontSize: '1rem', maxWidth: '750px', lineHeight: 1.6, marginBottom: '2rem'}}>
          A microfrontend platform built on native browser primitives — ES modules,
          import maps, and dynamic <code>import()</code>. MFEs deploy independently
          and compose at runtime.
        </p>
        <div style={{display: 'flex', gap: '1rem'}}>
          <a
            href="/docs"
            className="button button--primary"
            style={{
              padding: '0.8rem 2rem',
              fontSize: '1rem',
            }}
          >
            Get Started
          </a>
          <a
            href="https://github.com/AshGw/fe"
            className="button"
            style={{
              padding: '0.8rem 2rem',
              fontSize: '1rem',
              background: 'transparent',
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
