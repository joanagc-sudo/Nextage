const fileInput = document.getElementById('fileInput');
const arquivoSelecionado = document.getElementById('arquivoSelecionado');
const arquivoSelecionadoTexto = document.getElementById('arquivoSelecionadoTexto');
const arquivoSelecionadoLink = document.getElementById('arquivoSelecionadoLink');

fileInput.addEventListener('change', function () {

    // Verifica se algum arquivo foi selecionado
    if (fileInput.files.length === 0) {
        return;
    }

    // Pega o arquivo escolhido pelo usuário
    const arquivo = fileInput.files[0];

    // Mostra o nome do arquivo
    arquivoSelecionadoTexto.innerText = arquivo.name;

    // Cria um link temporário para o arquivo selecionado
    const url = URL.createObjectURL(arquivo);

    arquivoSelecionadoLink.href = url;
    arquivoSelecionadoLink.download = arquivo.name;

    // Mostra o arquivo selecionado
    arquivoSelecionado.removeAttribute('hidden');
});