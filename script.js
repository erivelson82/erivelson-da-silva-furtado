function confirmarPresenca() {

    const mensagem =
        "Olá! Quero confirmar minha presença no aniversário de 4 anos do Bernardo! 🎉🦸";

    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(mensagem);

    window.open(url, "_blank");
}


// CONTAGEM REGRESSIVA

const dataFesta =
    new Date("December 12, 2026 12:00:00").getTime();

const contador =
    setInterval(function () {

        const agora = new Date().getTime();

        const distancia =
            dataFesta - agora;

        const dias =
            Math.floor(
                distancia / (1000 * 60 * 60 * 24)
            );

        const horas =
            Math.floor(
                (distancia % (1000 * 60 * 60 * 24))
                / (1000 * 60 * 60)
            );

        const minutos =
            Math.floor(
                (distancia % (1000 * 60 * 60))
                / (1000 * 60)
            );

        document.getElementById("countdown")
            .innerHTML =
            `${dias} dias • ${horas}h • ${minutos}min`;

    }, 1000);