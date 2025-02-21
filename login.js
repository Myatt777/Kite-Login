import fs from 'fs';
import { Wallet } from 'ethers';
import axios from 'axios';
import { banner } from './banner.js';

// Read all private keys from privatekey.txt (each key should be on a new line)
const privateKeys = fs.readFileSync('privatekey.txt', 'utf8').trim().split('\n');

// Function to display a banner (simulation of banner run)
async function showBanner() {
  return new Promise((resolve) => {
    console.log(banner);
    setTimeout(() => {
      resolve();
    }, 3000); // Simulating a 3-second banner
  });
}

// Function to authenticate a single wallet
async function signAndSend(privateKey) {
  try {
    const nonce = `timestamp_${Date.now()}`;
    
    const authTicketResponse = await axios.post(
      'https://api-kiteai.bonusblock.io/api/auth/get-auth-ticket',
      { nonce: nonce },
      {
        headers: {
          'Content-Type': 'application/json',
          'Host': 'api-kiteai.bonusblock.io',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          'Origin': 'https://testnet.gokite.ai',
          'Referer': 'https://testnet.gokite.ai/'
        }
      }
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
      {
        headers: {
          'Content-Type': 'application/json',
          'Host': 'api-kiteai.bonusblock.io',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          'Origin': 'https://testnet.gokite.ai',
          'Referer': 'https://testnet.gokite.ai/'
        }
      }
    );

 

    console.log(`Login Successful for ${privateKey.slice(0, 6)}...`);
    
  } catch (error) {
    console.error(`Error with ${privateKey.slice(0, 6)}...:`, error.response ? error.response.data : error.message);
  }
}

// Function to process requests sequentially with 1-second delay
async function processSequentially(keys) {
  for (let i = 0; i < keys.length; i++) {
    console.log(`Processing key ${i + 1}/${keys.length}...`);
    await signAndSend(keys[i]);
    
    if (i < keys.length - 1) {
      
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 1 second before next request
    }
  }
}

// Run all private keys sequentially
(async () => {
  await showBanner();
  await processSequentially(privateKeys); // Process sequentially with 1s delay
})();
