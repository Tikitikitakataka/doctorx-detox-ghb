function showScreen(id) {
    const secciones = document.querySelectorAll('.pantalla');
    secciones.forEach(sec => sec.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

// Mostrar la pantalla inicial por defecto
document.addEventListener('DOMContentLoaded', () => {
    showScreen('intro');
});
