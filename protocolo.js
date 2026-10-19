export const CMD = {
  CONECTAR: "CONECTAR",
  PRONTO: "PRONTO",
  TIRO: "TIRO",
  ACERTO: "ACERTO",
  AGUA: "AGUA",
  FIM: "FIM",
  OK: "OK",
  ERRO: "ERRO",
};

export const ERRO = {
  COMANDO_DESCONHECIDO: 100,
  ARGUMENTOS_INVALIDOS: 101,
  NAO_E_SUA_VEZ: 102,
  ACAO_NAO_PERMITIDA: 103,
};

export const DELIMITADOR = "\n";

const ARGS_ESPERADOS = {
  [CMD.CONECTAR]: 1,
  [CMD.PRONTO]: 0,
  [CMD.TIRO]: 2,
  [CMD.ACERTO]: 2,
  [CMD.AGUA]: 2,
  [CMD.FIM]: 1,
  [CMD.OK]: 0,
  [CMD.ERRO]: 0,
};

export function montar(comando, ...args) {
  return [comando, ...args].join(' ') + DELIMITADOR;
}

// Interpreta uma linha: "TIRO 3 4" → { comando: 'TIRO', args: ['3','4'] }
// Retorna { erro: codigo } se for inválida.
export function interpretar(linha) {
  const partes = linha.trim().split(/\s+/);
  const comando = partes[0].toUpperCase();
  const args = partes.slice(1);

  if (!(comando in ARGS_ESPERADOS)) {
    return { erro: ERRO.COMANDO_DESCONHECIDO, comando, args };
  }

  // OK e ERRO aceitam texto livre; os demais exigem a quantidade exata
  const livre = comando === CMD.OK || comando === CMD.ERRO;
  if (!livre && args.length !== ARGS_ESPERADOS[comando]) {
    return { erro: ERRO.ARGUMENTOS_INVALIDOS, comando, args };
  }

  return { comando, args };
}

export function criarLeitor(aoReceberMensagem) {
  let buffer = '';

  return (dados) => {
    buffer += dados.toString();

    let posicao;
    while ((posicao = buffer.indexOf(DELIMITADOR)) !== -1) {
      const linha = buffer.slice(0, posicao); 
      buffer = buffer.slice(posicao + 1);
      if (linha.trim() !== '') {
        aoReceberMensagem(linha);
      }
    }
  };
}
