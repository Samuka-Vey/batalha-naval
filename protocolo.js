export const DELIMITADOR = '\n';

export const CMD = {
  ENTRAR: 'ENTRAR', LETRA: 'LETRA', SAIR: 'SAIR',
  OK: 'OK', ESTADO: 'ESTADO', VITORIA: 'VITORIA', DERROTA: 'DERROTA', ERRO: 'ERRO',
};

export const ERRO = {
  COMANDO_DESCONHECIDO: 100,
  ARGUMENTOS_INVALIDOS: 101,
  ACAO_NAO_PERMITIDA: 103,
  LETRA_REPETIDA: 104,
};

// Comandos que o CLIENTE pode enviar e quantos argumentos cada um exige
const COMANDOS_CLIENTE = { ENTRAR: 1, LETRA: 1, SAIR: 0 };

// montar('LETRA', 'a') → "LETRA a\n"
export function montar(comando, ...args) {
  return [comando, ...args].join(' ') + DELIMITADOR;
}

// "letra a" → { comando: 'LETRA', args: ['a'] } ou { erro: codigo }
export function interpretar(linha) {
  const partes = linha.trim().split(/\s+/);
  const comando = partes[0].toUpperCase();
  const args = partes.slice(1);

  if (!(comando in COMANDOS_CLIENTE)) return { erro: ERRO.COMANDO_DESCONHECIDO };
  if (args.length !== COMANDOS_CLIENTE[comando]) return { erro: ERRO.ARGUMENTOS_INVALIDOS };
  return { comando, args };
}

// TCP é fluxo de bytes: o buffer reconstrói as mensagens usando o '\n'
export function criarLeitor(aoReceberLinha) {
  let buffer = '';
  return (dados) => {
    buffer += dados.toString();
    let pos;
    while ((pos = buffer.indexOf(DELIMITADOR)) !== -1) {
      const linha = buffer.slice(0, pos);
      buffer = buffer.slice(pos + 1);
      if (linha.trim() !== '') aoReceberLinha(linha);
    }
  };
}