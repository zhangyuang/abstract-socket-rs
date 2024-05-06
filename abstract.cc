#include <cstddef> // For offsetof
#include <cstdint>
#include <cstring>
#include <errno.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

extern "C" {
int Socket() {
  int fd;
  int type = SOCK_STREAM;
  type |= SOCK_NONBLOCK | SOCK_CLOEXEC;

  fd = socket(AF_UNIX, type, 0);
  if (fd == -1) {
    fd = -errno;
  }

  return fd;
}

int Bind(int fd, const char *path) {
  sockaddr_un s;
  socklen_t namelen;
  int err;
  unsigned int len = std::strlen(path);

  if (path[0] != '\0') {
    return -EINVAL;
  }

  if (len > sizeof(s.sun_path)) {
    return -EINVAL;
  }

  std::memset(&s, 0, sizeof(s));
  std::memcpy(s.sun_path, path, len);
  s.sun_family = AF_UNIX;
  namelen = offsetof(struct sockaddr_un, sun_path) + len;

  if (bind(fd, reinterpret_cast<struct sockaddr *>(&s), namelen)) {
    err = -errno;
  } else {
    err = 0;
  }

  return err;
}

int Connect(int fd, const char *path) {
  sockaddr_un s;
  socklen_t namelen;
  int err;
  unsigned int len = std::strlen(path);

  if (path[0] != '\0') {
    return -EINVAL;
  }

  if (len > sizeof(s.sun_path)) {
    return -EINVAL;
  }

  std::memset(&s, 0, sizeof(s));
  std::memcpy(s.sun_path, path, len);
  s.sun_family = AF_UNIX;
  namelen = offsetof(struct sockaddr_un, sun_path) + len;

  if (connect(fd, reinterpret_cast<struct sockaddr *>(&s), namelen)) {
    err = -errno;
  } else {
    err = 0;
  }

  return err;
}

int Close(int fd) {
  if (close(fd)) {
    return -errno;
  }
  return 0;
}
}
