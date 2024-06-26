# abstract-socket-rs

The ffi implemention of [abstract-socket](https://github.com/saghul/node-abstractsocket) based on [ffi-rs](https://github.com/zhangyuang/node-ffi-rs)


## Features

- No need to use node-gyp 😊
- Pure javascript project ✨
- Pre build all platform output 🤯

## Support platforms

- linux-x64-gnu
- linux-x64-musl
- linux-arm64-gnu
- linux-arm64-musl


## How to use

The api interface is the same as [abstract-socket](https://github.com/saghul/node-abstractsocket).

## Examples

Server:

```js
// abstract echo server
const abs = require('abstract-socket-rs');

const server = abs.createServer(function(c) { //'connection' listener
  console.log('client connected');
  c.on('end', function() {
    console.log('client disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.listen('\0foo');

```

Client:

```js
const abs = require('abstract-socket-rs');

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

```


## API

### abs.createServer(connectionListener)

Returns a new `AbstractSocketServer` object. `listen` can be called on
it passing the name of the abstract socket to bind to and listen, it follows
the API used for normal Unix domain sockets. NOTE: you must prepend the path with
the NULL byte ('\0') to indicate it's an abstract socket.

Emits an error if the `socket(2)` system call fails.

### AbstractSocketServer.listen(name, [callback]

Binds the server to the specified abstract socket name.

Emits an error if the `bind(2)` system call fails, or the given `name`
is invalid.

This function is asynchronous. When the server has been bound, 'listening' event
will be emitted. the last parameter callback will be added as an listener for the
'listening' event.

### abs.connect(name, connectListener)

Creates a connection to the given `path` in the abstract domain. NOTE: you must
prepend the path with the NULL byte ('\0') to indicate it's an abstract
socket.

Returns a new net.Socket object.

Emits an error if the `socket(2)` or `connect(2)` system calls fail,
or the given `name` is invalid.
