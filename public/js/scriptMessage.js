
document.addEventListener("DOMContentLoaded", function () {

    const alertas = document.querySelectorAll(
        "#alerta-sucesso, #alerta-danger, #alerta-warning"
    );

    alertas.forEach(function (alerta) {

        setTimeout(function () {

            alerta.style.transition = "opacity 0.5s ease";
            alerta.style.opacity = "0";

            setTimeout(function () {
                alerta.remove();
            }, 500);

        }, 3000);

    });

});
