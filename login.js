import fs from 'fs';
import { Wallet } from 'ethers';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { banner } from './banner.js';

// Read all private keys from privatekey.txt
const privateKeys = fs.readFileSync('privatekey.txt', 'utf8').trim().split('\n');

// Read proxies from proxy.txt
const proxies = fs.readFileSync('proxy.txt', 'utf8').trim().split('\n');

// Function to get the next proxy in rotation
let proxyIndex = 0;
function getNextProxy() {
  const proxy = proxies[proxyIndex % proxies.length];
  proxyIndex++;
  return proxy;
}

// Function to create an Axios agent based on the proxy type
function createProxyAgent(proxy) {
  if (proxy.startsWith('http')) {
    return new HttpsProxyAgent(proxy);
  } else if (proxy.startsWith('socks')) {
    return new SocksProxyAgent(proxy);
  }
  return null;
}

// Function to display a banner (simulation of banner run)
async function showBanner() {
  return new Promise((resolve) => {
    console.log(banner);
    setTimeout(() => {
      resolve();
    }, 3000);
  });
}

// Function to authenticate a single wallet with proxy rotation
async function signAndSend(privateKey) {
  try {
    const nonce = `timestamp_${Date.now()}`;
    const proxy = getNextProxy();
    const agent = createProxyAgent(proxy);

    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Host': 'api-kiteai.bonusblock.io',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
        'Origin': 'https://testnet.gokite.ai',
        'Referer': 'https://testnet.gokite.ai/'
      },
      httpsAgent: agent,
      httpAgent: agent
    };

    console.log(`Using Proxy: ${proxy}`);

    const authTicketResponse = await axios.post(
      'https://api-kiteai.bonusblock.io/api/auth/get-auth-ticket',
      { nonce: nonce },
      axiosConfig
    );

    console.log(`Auth Ticket Response for ${privateKey.slice(0, 6)}...:`, authTicketResponse.data);

    const wallet = new Wallet(privateKey);
    const signedMessage = await wallet.signMessage(nonce);

    const requestData = {
      blockchainName: "ethereum",
      signedMessage: signedMessage,
      nonce: nonce,
      referralId: "optionalReferral"
    };

    const authEthResponse = await axios.post(
      'https://api-kiteai.bonusblock.io/api/auth/eth',
      requestData,
      axiosConfig
    );

    console.log(`Login Successful for ${privateKey.slice(0, 6)}...`);
    
  } catch (error) {
    console.error(`Error with ${privateKey.slice(0, 6)}...:`, error.response ? error.response.data : error.message);
  }
}

// Function to process requests sequentially with a delay
// Function to process requests sequentially with a delay
async function processSequentially(keys) {
  for (let i = 0; i < keys.length; i++) {
    console.log(`Processing key ${i + 1}/${keys.length}...`);
    await signAndSend(keys[i]);
    
    if (i < keys.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before next request
    }
  }

  // After all requests, wait for 5 hours
  console.log("All keys processed. Waiting 5 hours before restarting...");
  await new Promise(resolve => setTimeout(resolve, 5 * 60 * 60 * 1000)); // 5 hours wait
}

// Run all private keys sequentially
(async () => {
  while (true) { // Run indefinitely with a 5-hour wait after each cycle
    await showBanner();
    await processSequentially(privateKeys);
  }
})();

