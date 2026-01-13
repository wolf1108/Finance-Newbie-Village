const http = require('http');

http.get('http://localhost:3000/api/portfolio?userId=507f1f77bcf86cd799439011', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("FINAL_BALANCE:" + json.userBalance);
        } catch (e) {
            console.log("RAW_DATA:" + data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
