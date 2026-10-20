import net from 'net';
import readline from 'readline';
import { HOST_CLIENTE as HOST_PADRAO, PORTA as PORTA_PADRAO } from './config.js';
import { criarLeitor } from './protocolo.js';

// uso: node cliente.js [ip] [porta]
const HOST = process.argv[2] || HOST_PADRAO;
const PORTA = parseInt(process.argv[3]) || PORTA_PADRAO;

const socket = net.connect(PORTA, HOST);

socket.on('connect', () => {
  console.log(`[CLIENTE] Conectado a ${HOST}:${PORTA}`);
  console.log('Comandos: ENTRAR <nome> | LETRA <x> | SAIR');
  console.log('Atalho: depois de entrar, digite so a letra (ex: a)');
});

socket.on('data', criarLeitor((linha) => {
  const [cmd, ...args] = linha.split(' ');
  if (cmd === 'ESTADO') {
    const [mascara, erros, max] = args;
    console.log(`\n   Palavra: ${mascara.split('').join(' ')}`);
    console.log(`   Erros: ${erros}/${max}\n`);
  } else if (cmd === 'VITORIA') {
    console.log(`\n*** VOCE VENCEU! A palavra era ${args[0]} ***  (nova rodada)`);
  } else if (cmd === 'DERROTA') {
    console.log(`\n*** VOCE PERDEU! A palavra era ${args[0]} ***  (nova rodada)`);
  } else {
    console.log(`[CLIENTE] << ${linha}`);
  }
}));

socket.on('close', () => {
  console.log('[CLIENTE] Conexao encerrada');
  process.exit(0);
});

// Erros de rede com mensagem clara
socket.on('error', (e) => {
  if (e.code === 'ECONNREFUSED') console.log(`[CLIENTE] Servidor offline ou porta errada (${HOST}:${PORTA})`);
  else if (e.code === 'ECONNRESET') console.log('[CLIENTE] O servidor derrubou a conexao');
  else if (e.code === 'ETIMEDOUT') console.log('[CLIENTE] Tempo esgotado: servidor inalcancavel');
  else console.log(`[CLIENTE] Erro: ${e.message}`);
});

readline.createInterface({ input: process.stdin }).on('line', (linha) => {
  const texto = linha.trim();
  // Atalho: uma letra sozinha vira "LETRA x"
  if (/^[a-zA-Z]$/.test(texto)) return socket.write(`LETRA ${texto}\n`);
  socket.write(texto + '\n');
});