"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const message_1 = __importDefault(require("./message"));
const torrents_1 = require("./torrents");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.get('/health', (_, res) => {
    res.send('I am working');
});
app.get('/torrent/:hash', torrents_1.streamTorrentHandler);
const server = app.listen(port, () => console.log(`WSS listening on port: ${port}`));
(0, message_1.default)(server);
