// desempenho por disciplina

const canvas = document.getElementById("graficoDesempenho");

if (canvas) {

    const disciplinas = estatisticas.map(item => item.disciplina);

    const certas = estatisticas.map(item => Number(item.certas));

    const erradas = estatisticas.map(item => Number(item.erradas));

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

            scales: {
                y: {
                    beginAtZero: true,

                    ticks: {
                        precision: 0
                    }
                }
            },

            plugins: {
                legend: {
                    position: "top"
                }
            }
        }

    });

}