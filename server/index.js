const express = require("express");
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const {toHex, utf8ToBytes} = require("ethereum-cryptography/utils")

const app = express();
const cors = require("cors");

const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0463258082285f3731d69751b10241e21f437809d9dc6d1ac2638180a9065a43022a69bb489e41c95c38abf8aacd120fdf4cd21afb7078e2053d6e66da6c0ad82a": 100,
  "04acb9861923960e964f7ea978c20f5a6ca2cdb16316ee219a2b3a1fa6a436b4b717455c87c8d60578f89f097d49688b2f7b729ec99e129cab83c29fbd0d26d2f4": 50,
  "045705c1f75cd66847f8f7012df433c7c1484a77abcc22b85cfde53fe2cc3058188fb1c3d2f5eb105f559a498df1377d64ef6b1b3f08a2998d2546a8681d906f22": 75,
};


app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, signature, recovery } = req.body;

  if(!signature) res.status(404).send({ message: "signature was not provide" });
  if(!recovery) res.status(400).send({ message: "recovery was not provide" });

  try {
    
    const bytes = utf8ToBytes(JSON.stringify({ sender, recipient, amount }));
    const hash = keccak256(bytes);

    const sig = new Uint8Array(signature);

    const publicKey = await secp.recoverPublicKey(hash, sig, recovery);

    if(toHex(publicKey) !== sender){
      res.status(400).send({ message: "signature no is valid" });
    }

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    }
  } catch (error) {
    console.log(error.message)
  }
  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}