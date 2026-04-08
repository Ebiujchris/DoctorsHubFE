import '../styles/globals.css'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  return (
    <>
      {/* Apply dark class before first paint to avoid flash */}
      <Script id="theme-init" strategy="beforeInteractive">{`
        (function() {
          try {
            var stored = localStorage.getItem('dh_theme');
            var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (stored === 'dark' || (!stored && prefersDark)) {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        })();
      `}</Script>
      <Component {...pageProps} />
    </>
  )
}
