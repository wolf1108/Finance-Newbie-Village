const http = require('http');

http.get('http://localhost:3000/api/portfolio?userId=507f1f77bcf86cd799439011', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        console.log(data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
