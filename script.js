// ==========================================
// CONFIRMAÇÃO DE PRESENÇA
// ==========================================

function confirmarPresenca() {

    const mensagem =
        "Olá! Quero confirmar minha presença no aniversário de 4 anos do Bernardo! 🎉🦸";

    const url =
        "https://wa.me/?text=" +
        encodeURIComponent(mensagem);

    window.open(url, "_blank");
}


// ==========================================
// CONTAGEM REGRESSIVA
// ==========================================

// ATENÇÃO:
// Altere esta data quando tivermos a data definitiva da festa.

const dataFesta = new Date(
    "December 12, 2026 12:00:00"
).getTime();


function atualizarContagem() {

    const agora = new Date().getTime();

    const distancia = dataFesta - agora;


    // Quando chegar o momento da festa
    if (distancia <= 0) {

        document.getElementById("countdown").innerHTML =
            "🎉 A MISSÃO COMEÇOU! 🎉";

        return;
    }


    const dias = Math.floor(
        distancia / (1000 * 60 * 60 * 24)
    );


    const horas = Math.floor(
        (distancia % (1000 * 60 * 60 * 24))
        / (1000 * 60 * 60)
    );


    const minutos = Math.floor(
        (distancia % (1000 * 60 * 60))
        / (1000 * 60)
    );


    const segundos = Math.floor(
        (distancia % (1000 * 60))
        / 1000
    );


    document.getElementById("countdown").innerHTML = `
        <div class="tempo">
            <div>
                <strong>${dias}</strong>
                <span>DIAS</span>
            </div>

            <div>
                <strong>${horas}</strong>
                <span>HORAS</span>
            </div>

            <div>
                <strong>${minutos}</strong>
                <span>MIN</span>
            </div>

            <div>
                <strong>${segundos}</strong>
                <span>SEG</span>
            </div>
        </div>
    `;
}


atualizarContagem();

setInterval(atualizarContagem, 1000);