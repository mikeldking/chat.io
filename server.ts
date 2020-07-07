import * as net from "net";
import * as chalk from "chalk";

interface IClient {
  socket: any;
  username?: string;
}
let clients: IClient[] = [];

/**
 * Handle data from a client
 * @param client
 * @param buff
 */
const handleData = (client: IClient, buff: Buffer) => {
  if (!client.username) {
    const username = buff.toString().trim();
    const isDuplicate = clients.find((c) => c.username === username);
    if (isDuplicate) {
      client.socket.write(
        chalk.red(
          `> Username ${username} is already taken. Please provide your username\n`
        )
      );
    } else {
      client.username = username;
      client.socket.write(chalk.green(`> Welcome ${username}!\n`));
      broadcast(client, `${username} has joined\n`, chalk.green(`➡ `));
    }
  } else {
    // Send message to all recipients
    broadcast(client, buff.toString(), chalk.bold(`${client.username}: `));
  }
};

/**
 * Send a message to all users (other than the sender)
 **/
const broadcast = (sender: IClient, msg: string, prefix?: string) => {
  clients
    .filter((c) => c.socket !== sender.socket)
    .forEach((c) => {
      c.socket.write(prefix + msg);
    });
};

const server = net
  .createServer((clientSocket) => {
    const client: IClient = { socket: clientSocket };
    clients.push(client);
    clientSocket.write("> Please provide your username\n");
    clientSocket.on("data", (buff) => {
      handleData(client, buff);
    });

    clientSocket.on("end", () => {
      clients = clients.filter((c) => c.socket !== client.socket);
      broadcast(
        client,
        `${client.username} has left the room`,
        chalk.red(`⬅ `)
      );
    });
  })
  .on("error", (err) => {
    // Handle errors here.
    throw err;
  });

// Grab an arbitrary unused port.
server.listen(8080, () => {
  console.log("opened server on", server.address());
});
