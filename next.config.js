/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Abilita React Strict Mode per evidenziare potenziali problemi nell'app
  swcMinify: true,      // Abilita la minificazione SWC per build più veloci
  output: 'standalone', // Aggiunge l'output standalone per Docker

  // Aggiungi qui altre configurazioni di Next.js se necessario
  // Esempio:
  // images: {
  //   domains: ['example.com'],
  // },
};

module.exports = nextConfig; 