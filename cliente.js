import net from 'net';
import readline from 'readline';
import { HOST_CLIENTE as HOST_PADRAO, PORTA as PORTA_PADRAO } from './config.js';
import { criarLeitor } from './protocolo.js';

const HOST = process.argv[2] || HOST_PADRAO;
const PORTA = parseInt(process.argv[3]) || PORTA_PADRAO;

const socket = net.connect(PORTA, HOST);

socket.on('connect', () => {
  console.log(`[CLIENTE] Conectado a ${HOST}:${PORTA}`);
  console.log('[CLIENTE] Digite comandos, ex: CONECTAR Ana | TIRO 3 4');
});

socket.on('data', criarLeitor((linha) => {
  console.log(`[CLIENTE] << ${linha}`);
}));

socket.on('close', () => {
  console.log('[CLIENTE] Conexão encerrada');
  process.exit(0);
});

socket.on('error', (e) => console.log(`[CLIENTE] Erro: ${e.message}`));

const entrada = readline.createInterface({ input: process.stdin });
entrada.on('line', (linha) => socket.write(linha + '\n'));