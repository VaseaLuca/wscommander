const https = require('https');
const WebSocket = require('ws');
const axios = require('axios');

const server = https.createServer();
const wss= new WebSocket.Server({ server });

let getInfoString = [];
let getDate = [];
let bitcoinPrice = [];
wss.on('connection', function connection(ws) {

    sendResp('', 'WebSocket Connected', '')
  ws.on('message', function incoming(message) {
    //Find the connection Id to identifie the second connection
    console.log('received: ', message);
    const [comand, params] = message.split(' ');
    switch (comand) {
      case "echo":
      const echoResp = `Hello World ${params ? params : ""}`;
      sendResp(comand, echoResp, message);
      break;
      case 'bitcoin':
      const getBitcoinPrice = async () => {
        const getPrice = await axios.get('https://api.coindesk.com/v1/bpi/currentprice.json');
        if (getPrice.data) {
          const data = getPrice.data;
          const lastUpdated = data.time.updated;
          bitcoinPrice = [`${lastUpdated}:`];
          const disclaimer = data.disclaimer;
          bitcoinPrice = [...bitcoinPrice, `${disclaimer.split("\n")}`];
          const usdPrice = data.bpi.USD;
          for (const [key, value] of Object.entries(usdPrice)) {
            bitcoinPrice.indexOf(`${key}:${value}`) === -1 && bitcoinPrice.push(`${key}:${value}`)
          }
          const gbpPrice = data.bpi.GBP;
          for (const [key, value] of Object.entries(gbpPrice)) {
            bitcoinPrice.indexOf(`${key}:${value}`) === -1 && bitcoinPrice.push(`${key}:${value}`)
          }
          const eurPrice = data.bpi.EUR;
          for (const [key, value] of Object.entries(eurPrice)) {
            bitcoinPrice.indexOf(`${key}:${value}`) === -1 && bitcoinPrice.push(`${key}:${value}`)
          }
          const lsResp = bitcoinPrice.join('\n');
          sendResp(comand, lsResp, message);
        }
      }
      getBitcoinPrice()
      break;
      case 'get':
      const getRates = async () => {
        const rates = await axios.get('https://api.vatcomply.com/rates');
        if (rates.data) {
          let date = rates.data.date;
          getDate = date;
          let data = rates.data.rates;
          for (const [key, value] of Object.entries(data)) {
            getInfoString.indexOf(`${key}:${value}`) === -1 && getInfoString.push(`${key}:${value}`);
          }
          const getRatesResp = `${getDate} : ${getInfoString.join("\n,- ")}`;
          sendResp(comand, getRatesResp, message);
        }
      }
      getRates();
      break;
      case "help":
      const helpResp = "'echo', 'bitcoin rates' - to get updated bitcoin's rate in USD, EUR, GBP, 'get EUR' - to get today's rates , 'clear', 'close'";
      sendResp(comand, helpResp, message);
      break;
      case "clear":
      const clearResp = "clear";
      sendResp(comand, clearResp, message);
      break;
      case "close":
      const closeResp = 'Commander is closed';
      sendResp(comand, closeResp, message)
      ws.close();
      break;
      default:
      const defaultResp = `Unknown command ${message}`;
      sendResp(comand, defaultResp, message);
      break;
      }
      });

//The response sender function
function sendResp(command, respond, message) {

  const parcedObj = JSON.stringify({
    command: command,
    value: respond,
    originalMessage: message,
  })
  ws.send(parcedObj);
}
  ws.on('close', () => {
    console.log(`Conection close ${ws.id}`)
  })
  // ws.send('ready');
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server online`);
});
