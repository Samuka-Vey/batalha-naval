import net from 'net';
import { HOST_SERVIDOR, PORTA, TRANSPORTE } from './config.js';
import {CMD, ERRO,montar, interpretar, criarLeitor} from "./protocolo.js";

let contadorClientes = 0;

// Esta função roda quando um cliente CONECTA (cria um socket de conexão)
const servidor = net.createServer((socket) => {
  const id = ++contadorClientes;
  console.log(`[SERVIDOR] Cliente #${id} conectou (${socket.remoteAddress}:${socket.remotePort})`);

  // Cada socket tem seu próprio leitor (e seu próprio buffer)
  const ler = criarLeitor((linha) => {
    console.log(`[SERVIDOR] Cliente #${id} >> ${linha}`);
    const msg = interpretar(linha);

    // Mensagem inválida: responde ERRO e segue
    if (msg.erro) {
      const texto = msg.erro === ERRO.COMANDO_DESCONHECIDO
        ? 'Comando desconhecido'
        : 'Argumentos invalidos';
      socket.write(montar(CMD.ERRO, msg.erro, texto));
      return;
    }

    switch (msg.comando) {
      case CMD.CONECTAR:
        socket.write(montar(CMD.OK, `Bem-vindo, ${msg.args[0]}!`));
        break;
      default:
        socket.write(montar(CMD.OK, `Recebi ${msg.comando}`));
    }
  });

  socket.on('data', ler);
  socket.on('end', () => console.log(`[SERVIDOR] Cliente #${id} sinalizou o fim`));
  socket.on('close', () => console.log(`[SERVIDOR] Cliente #${id} desconectou`));
  socket.on('error', (e) => console.log(`[SERVIDOR] Erro no cliente #${id}: ${e.message}`));
});

servidor.listen(PORTA, HOST_SERVIDOR, () => {
  console.log(`[SERVIDOR] Escutando em ${HOST_SERVIDOR}:${PORTA} (${TRANSPORTE})`);
});

