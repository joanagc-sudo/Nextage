// graico de desempenho por disciplina

// elemento canvas
const canvas = document.getElementById("graficoDesempenho");

if (canvas) {

    // nomes das disciplinas
    const disciplinas = estatisticas.map(item => item.disciplina);

    // quantidade de acertos
    const certas = estatisticas.map(item => Number(item.certas));

    // quantidade de erros
    const erradas = estatisticas.map(item => Number(item.erradas));

    // gráfico de barras
    new Chart(canvas, {

        type: "bar",

        data: {
            labels: disciplinas,

            datasets: [
                {
                    label: "Acertos",
                    data: certas
                },
                {
                    label: "Erros",
                    data: erradas
                }
            ]
        },

        options: {
            responsive: true,

            // configura o eixo vertical
            scales: {
                y: {
                    beginAtZero: true,

                    // apenas números inteiros
                    ticks: {
                        precision: 0
                    }
                }
            },

            // configura a legenda
            plugins: {
                legend: {
                    position: "top"
                }
            }
        }

    });

}