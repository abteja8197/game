let port = 3434,
    folder = 'public',
    endpoint = "dev",
    ssl = false,
    sslPort = 443,
    host = '127.0.0.1';
if (process.argv) {
    process.argv.forEach((p) => {
        if (p.indexOf('--port=') >= 0) {
            port = parseInt(p.split('=')[1]);
        }
    });
    process.argv.forEach((p) => {
        if (p.indexOf('--ssl-port=') >= 0) {
            sslPort = parseInt(p.split('=')[1]);
        }
    });
    process.argv.forEach((p) => {
        if (p.indexOf('--folder=') >= 0) {
            folder = p.split('=')[1];
        }
    });
    process.argv.forEach((p) => {
        if (p.indexOf('--endpoint=') >= 0) {
            endpoint = p.split('=')[1];
        }
    });
    process.argv.forEach((p) => {
        if (p.indexOf('--host=') >= 0) {
            host = p.split('=')[1];
        }
    });
    process.argv.forEach((p) => {
        if (p.indexOf('--ssl=') >= 0) {
            if (p.split('=')[1] && p.split('=')[1] === 'false') {
                ssl = false;
            } else {
                ssl = true;
            }
        }
    });
}
require('./fe-server')({ fePort: port, folder, endpoint: endpoint, host: host, ssl: ssl, sslPort: sslPort });
