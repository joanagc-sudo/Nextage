const btnCadastrar = document.getElementById("btnCadastrar");
const fileInput = document.getElementById("fileInput");
const listaMateriais = document.getElementById("listaMateriais");


// Quando clicar no botão +
btnCadastrar.addEventListener("click", function () {
    fileInput.click();
});


// Quando escolher um arquivo
fileInput.addEventListener("change", function () {

    if (fileInput.files.length === 0) {
        return;
    }

    const arquivo = fileInput.files[0];

    // Cria um endereço temporário para o arquivo
    const url = URL.createObjectURL(arquivo);

    // Cria uma nova linha
    const linha = document.createElement("tr");

    // Nome do arquivo
    const colunaNome = document.createElement("td");
    colunaNome.textContent = arquivo.name;

    // Coluna do botão
    const colunaBotao = document.createElement("td");

    // Botão baixar
    const botaoBaixar = document.createElement("a");

    botaoBaixar.textContent = "Baixar";
    botaoBaixar.href = url;
    botaoBaixar.download = arquivo.name;
    botaoBaixar.classList.add("botaoBaixar");

    // Coloca o botão dentro da coluna
    colunaBotao.appendChild(botaoBaixar);

    // Coloca as colunas na linha
    linha.appendChild(colunaNome);
    linha.appendChild(colunaBotao);

    // Coloca a linha na tabela
    listaMateriais.appendChild(linha);

    // Limpa o input para permitir escolher novamente o mesmo arquivo
    fileInput.value = "";

});