const express = require('express');
const app = express();
const path = require('path'); 
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8000;
const code = require('./pair'); 

require('events').EventEmitter.defaultMaxListeners = 500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/code', code);

// ✅ Serve `pair.html` when visiting `/`
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.use('/pair', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, () => {
    console.log(`
Don't Forget To Give Star 🌟
Server running on http://localhost:${PORT}`);
});

module.exports = app;
