// const abs = require('abstract-socket');
const abs = require('./index');

var client = abs.connect('\0foo', function() { //'connect' listener
  console.log('client connected');
});

client.on('data', function(data) {
  console.log(data.toString());
});

process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  const chunk = process.stdin.read();
  if (chunk !== null)
    client.write(chunk);
});
