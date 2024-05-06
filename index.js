const net = require('net');
const { resolve } = require('path')
const { load, DataType, open } = require('ffi-rs')

const library = "libsocket"

function isMusl() {
  // For Node 10
  if (!process.report || typeof process.report.getReport !== 'function') {
    try {
      const lddPath = require('child_process').execSync('which ldd').toString().trim()
      return readFileSync(lddPath, 'utf8').includes('musl')
    } catch (e) {
      return true
    }
  } else {
    const { glibcVersionRuntime } = process.report.getReport().header
    return !glibcVersionRuntime
  }
}

const init = () => {
  const platform = process.platform;
  const arch = process.arch
  if (platform !== 'linux') {
    console.error(`load abstract-socket-rs error: unsupported platform ${platform}`)
    return
  }
  if (arch === "x64") {
    open({
      library,
      path: isMusl() ? resolve(__dirname, "./x86_64-unknown-linux-musl.so") : resolve(__dirname, "./x86_64-unknown-linux-gnu.so"),
    });
  }
  if (arch === "arm64") {
    open({
      library,
      path: isMusl() ? resolve(__dirname, "./aarch64-unknown-linux-musl.so") : resolve(__dirname, "./aarch64-unknown-linux-gnu.so"),
    });
  }
  console.error(`load abstract-socket-rs error: unsupported arch ${arch}`)
}
const socket = () => (
  load({
    library,
    funcName: "socket",
    retType: DataType.I32,
    paramsType: [],
    paramsValue: [],
  })
)
const bind = (...params) => (
  load({
    library,
    funcName: "bind",
    retType: DataType.I32,
    paramsType: [DataType.I32, DataType.String],
    paramsValue: params
  })
)
const connect = (...params) => (
  load({
    library,
    funcName: "connect",
    retType: DataType.I32,
    paramsType: [DataType.I32, DataType.String],
    paramsValue: params
  })
)
const close = (...params) => (
  load({
    library,
    funcName: "close",
    retType: DataType.I32,
    paramsType: [DataType.I32],
    paramsValue: params
  })
)

const errnoException = require('util')._errnoException;


class AbstractSocketServer extends net.Server {
  constructor(listener) {
    super(listener);
    init()
  }

  listen(name, listener) {
    let err = socket();
    if (err < 0) {
      this.emit(errnoException(err, 'socket'));
    }

    const handle = { fd: err };

    err = bind(err, name);
    if (err < 0) {
      close(handle.fd);
      this.emit(errnoException(err, 'bind'));
    }
    super.listen(handle, listener);
  }
}


exports.createServer = function(listener) {
  return new AbstractSocketServer(listener);
};


exports.connect = exports.createConnection = function(name, connectListener) {
  const defaultOptions = {
    readable: true,
    writable: true
  };

  let err = socket();
  if (err < 0) {
    const sock = new net.Socket(defaultOptions);
    setImmediate(() => sock.emit('error', errnoException(err, 'socket')));
    return sock;
  }

  const options = Object.assign({ fd: err }, defaultOptions);

  // yes, connect is synchronous, so sue me
  err = connect(err, name);
  if (err < 0) {
    close(options.fd);
    const sock = new net.Socket(defaultOptions);
    setImmediate(() => sock.emit('error', errnoException(err, 'connect')));
    return sock;
  }

  const sock = new net.Socket(options);
  if (typeof connectListener === 'function') {
    setImmediate(() => connectListener(sock));
  }
  return sock;
};
