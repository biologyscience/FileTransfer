const express = require('express');

const { networkInterfaces } = require('os');

const { Server } = require('socket.io');

const fs = require('fs');
const path = require('path');

const port = 3000;

const ip = networkInterfaces()['Wi-Fi'].filter(x => x.family === 'IPv4')[0].address;

const app = express();

app.set('view engine', 'ejs');

app.set('views', `${__dirname}\\client\\views\\`);
app.use('/socket.io-client', express.static(`${__dirname}\\node_modules\\socket.io\\client-dist\\`));
app.use('/js', express.static(`${__dirname}\\client\\js\\`));

app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));

app.get('/', (request, response) => response.render('main'));

app.post('/upload', (request, response) =>
{
    const uploadsDir = `${__dirname}\\uploads\\`;

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    else
    {
        const originalFileName = request.headers['x-filename'];
        const startByte = parseInt(request.headers['x-start-byte'] || '0', 10);

        if (!originalFileName) return response.status(400).send('Missing file name');

        const filePath = path.join(uploadsDir, originalFileName);
        const fileStream = fs.createWriteStream(filePath, {flags: 'a', start: startByte});

        request.pipe(fileStream);

        fileStream.on('finish', () => response.sendStatus(200));

        fileStream.on('error', (err) =>
        {
            console.error('Error writing file:', err);
            response.status(500).send('Error during file upload');
        });
    }
});

app.once('ready', () =>
{
    console.log(`Serving at: http://${ip}:${port}`);
});

const server = app.listen(port, ip, () => app.emit('ready'));

const io = new Server(server);

io.on('connect', (socket) =>
{
    socket.on('progress', (percent) => console.log(`Upload progress: ${percent.toFixed(2)}%`));

    socket.on('console', console.log);
});