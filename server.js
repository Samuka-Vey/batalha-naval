import net from 'net';
import { HOST_SERVIDOR, PORTA, TRANSPORTE } from './config.js';
import { CMD, ERRO, montar, interpretar, criarLeitor } from './protocolo.js';

const PALAVRAS = [
  'REDE',
  'SOCKET',
  'SERVIDOR',
  'PROTOCOLO',
  'CLIENTE',
  'PACOTE',
  'ROTEADOR',
  'PORTA',
  'VAZAMENTO',
  'CONEXAO',
  'TCP',
  'UDP',
  'PARNAIBA'
];

const MAX_ERROS = 6;
const sortearPalavra = () =>
  PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];

let contador = 0;

const servidor = net.createServer((socket) => {
  const id = ++contador;

  // Estado deste jogador (cada conexão tem o seu)
  const jogador = {
    nome: null,
    palavra: null,
    tentadas: new Set(),
    erros: 0,
  };

  const enviar = (...partes) => socket.write(montar(...partes));

  // A palavra mascarada: letras descobertas aparecem,
  // o restante vira "_"
  const mascara = () =>
    [...jogador.palavra]
      .map((letra) => (jogador.tentadas.has(letra) ? letra : '_'))
      .join('');

  const enviarEstado = () =>
    enviar(CMD.ESTADO, mascara(), jogador.erros, MAX_ERROS);

  const novaRodada = () => {
    jogador.palavra = sortearPalavra();
    jogador.tentadas = new Set();
    jogador.erros = 0;

    console.log(`[SERVIDOR] #${id} nova palavra: ${jogador.palavra}`);

    enviarEstado();
  };

  console.log(
    `[SERVIDOR] #${id} conectou (${socket.remoteAddress}:${socket.remotePort})`
  );

  enviar(CMD.OK, 'Conectado. Envie: ENTRAR <nome>');

  // VISUALIZAÇÃO DOS BYTES ORIGINAIS RECEBIDOS PELO SOCKET
  socket.on('data', (dados) => {
    console.log('\n========== BYTES RECEBIDOS ==========');

    // Exibe o Buffer original
    console.log('[BUFFER]', dados);

    // Exibe cada byte em decimal
    console.log('[DECIMAL]', [...dados]);

    // Exibe os bytes em hexadecimal
    console.log('[HEX]', dados.toString('hex'));

    console.log('=====================================\n');
  });

  // LEITURA E PROCESSAMENTO DAS MENSAGENS DO PROTOCOLO
  socket.on(
    'data',
    criarLeitor((linha) => {
      console.log(`[SERVIDOR] #${id} >> ${linha}`);

      const msg = interpretar(linha);

      if (msg.erro) {
        const texto =
          msg.erro === ERRO.COMANDO_DESCONHECIDO
            ? 'Comando desconhecido'
            : 'Argumentos invalidos';

        return enviar(CMD.ERRO, msg.erro, texto);
      }

      switch (msg.comando) {
        case CMD.ENTRAR:
          jogador.nome = msg.args[0];

          enviar(CMD.OK, `Ola, ${jogador.nome}! Descubra a palavra`);

          novaRodada();
          break;

        case CMD.LETRA: {
          if (!jogador.nome) {
            return enviar(
              CMD.ERRO,
              ERRO.ACAO_NAO_PERMITIDA,
              'Envie ENTRAR primeiro'
            );
          }

          const letra = msg.args[0].toUpperCase();

          if (!/^[A-Z]$/.test(letra)) {
            return enviar(
              CMD.ERRO,
              ERRO.ARGUMENTOS_INVALIDOS,
              'Envie uma unica letra de A a Z'
            );
          }

          if (jogador.tentadas.has(letra)) {
            return enviar(
              CMD.ERRO,
              ERRO.LETRA_REPETIDA,
              'Letra ja tentada'
            );
          }

          jogador.tentadas.add(letra);

          if (!jogador.palavra.includes(letra)) {
            jogador.erros++;
          }

          if (!mascara().includes('_')) {
            enviar(CMD.VITORIA, jogador.palavra);
            novaRodada();
          } else if (jogador.erros >= MAX_ERROS) {
            enviar(CMD.DERROTA, jogador.palavra);
            novaRodada();
          } else {
            enviarEstado();
          }

          break;
        }

        case CMD.SAIR:
          enviar(CMD.OK, 'Ate logo');
          socket.end();
          break;
      }
    })
  );

  socket.on('close', () => {
    console.log(`[SERVIDOR] #${id} desconectou`);
  });

  socket.on('error', (e) => {
    console.log(`[SERVIDOR] Erro no #${id}: ${e.message}`);
  });
});

servidor.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`[SERVIDOR] Porta ${PORTA} ja esta em uso`);
  } else {
    console.log(`[SERVIDOR] Erro: ${e.message}`);
  }

  process.exit(1);
});

servidor.listen(PORTA, HOST_SERVIDOR, () => {
  console.log(
    `[SERVIDOR] Escutando em ${HOST_SERVIDOR}:${PORTA} (${TRANSPORTE})`
  );
});