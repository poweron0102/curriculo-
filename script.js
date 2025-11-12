document.addEventListener('DOMContentLoaded', () => {
            const galleries = document.querySelectorAll('.project-gallery');

            galleries.forEach(gallery => {
                const images = gallery.querySelectorAll('.gallery-image');
                if (images.length === 0) return; // Pula se não houver imagens
                
                let currentImageIndex = 0;

                // Garante que apenas a primeira imagem esteja visível no início
                images.forEach((img, index) => {
                    if (index === 0) {
                        img.classList.remove('opacity-0');
                    } else {
                        img.classList.add('opacity-0');
                    }
                });

                setInterval(() => {
                    if (images.length === 0) return;
                    
                    // Esconde a imagem atual
                    images[currentImageIndex].classList.add('opacity-0');

                    // Calcula o próximo índice
                    currentImageIndex = (currentImageIndex + 1) % images.length;

                    // Mostra a próxima imagem
                    images[currentImageIndex].classList.remove('opacity-0');
                }, 3500); // Muda a imagem a cada 3.5 segundos
            });
        });