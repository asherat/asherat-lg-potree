/*
* Copyright 2012 Google Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

#include <sys/types.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <netinet/in.h>
#include <fcntl.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <libgen.h>
#include <unistd.h>
#include <linux/limits.h>
#include <linux/input.h>
#include <signal.h>

#define PORT_MIN 0
#define PORT_MAX 65535
#define MC_LOOPBACK 1
#define MC_TTL 1


const char* DEVICE_ID="spacenavigator";

void error(char *msg) {
  fputs(msg, stderr);
  fputc('\n', stderr);
  exit(EXIT_FAILURE);
}

void main(int argc, char **argv) {
  int device_fd, sock_fd, run_fd;
  struct sockaddr_in sock_addr;
  struct stat sb;

  if (argc != 4) {
    fprintf(stderr, "Usage: %s <event-device-file> <ip-addr> <ip-port>\n", basename(argv[0]));
    exit(EXIT_FAILURE);
  }

  memset(&sock_addr, 0, sizeof(sock_addr));
  sock_addr.sin_family = AF_INET;

  if (inet_pton(AF_INET, argv[2], &sock_addr.sin_addr) <= 0)
    error("invalid address");

  unsigned int sock_port = (unsigned int) strtoul(argv[3], NULL, 10);
  if (sock_port < PORT_MIN || sock_port > PORT_MAX)
    error("invalid port");

  sock_addr.sin_port = htons(sock_port);

  if ((device_fd = open(argv[1], O_RDONLY)) < 0) {
    perror("opening the file you specified");
    exit(EXIT_FAILURE);
  }

  sock_fd = socket(AF_INET, SOCK_DGRAM, 0);
  if (sock_fd < 0) {
    perror("opening the socket");
    exit(EXIT_FAILURE);
  }

  u_char multicast_loop = MC_LOOPBACK;
  u_char multicast_ttl = MC_TTL;
  setsockopt(sock_fd, IPPROTO_IP, IP_MULTICAST_LOOP, &multicast_loop, sizeof(multicast_loop));
  setsockopt(sock_fd, IPPROTO_IP, IP_MULTICAST_TTL, &multicast_ttl, sizeof(multicast_ttl));

  #ifdef DEBUG
    fprintf(stderr, "sending events from %s to %s:%u\n", DEVICE_ID, argv[2], sock_port);
  #endif

  /* initialize the input buffer */

  struct input_event ev;
  struct input_event *event_data = &ev;

  memset(event_data, 0, sizeof(ev));

  /* initialize the output buffer */

  size_t sock_buffer_size = strlen(DEVICE_ID) + sizeof(ev);
  char sock_buffer[sock_buffer_size];

  memset(sock_buffer, 0, sock_buffer_size);

  strncpy(
    sock_buffer + sizeof(ev),
    DEVICE_ID,
    sock_buffer_size - sizeof(ev)
  );

  /* begin relaying from the device to the socket */

  while(1) {
    int num_read = read(device_fd, event_data, sizeof(ev));

    if (sizeof(ev) != num_read) {
      fputs("read failed\n", stderr);
      exit(EXIT_FAILURE);
    }

    if (event_data->type == EV_SYN || event_data->type == EV_MSC)
      continue; // ignore EV_MSC and EV_SYN events

    memcpy(sock_buffer, event_data, sizeof(ev));

    int num_sent = sendto(
      sock_fd,
      sock_buffer,
      sock_buffer_size,
      0,
      (struct sockaddr *) &sock_addr,
      sizeof(sock_addr)
    );

    if (num_sent < 0) {
      perror("sending to socket");
    }

    #ifdef DEBUG
      fprintf(
        stderr,
        "sent %d bytes from %s. type: %d code: %d value: %d\n",
        num_sent, DEVICE_ID, event_data->type, event_data->code, event_data->value
     );
    #endif
  }
}
