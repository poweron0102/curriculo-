document.addEventListener('DOMContentLoaded', () => {
    const galleries = document.querySelectorAll('.project-gallery');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.getElementById('close-lightbox');
    const prevLightboxBtn = document.getElementById('prev-lightbox');
    const nextLightboxBtn = document.getElementById('next-lightbox');

    let currentLightboxImages = [];
    let currentLightboxIndex = 0;

    galleries.forEach(gallery => {
        const images = gallery.querySelectorAll('.gallery-image');
        if (images.length <= 1) {
            // Adiciona listener de clique mesmo para imagens únicas
            if (images.length === 1) {
                images[0].addEventListener('click', () => openLightbox([images[0]], 0));
            }
            if (images.length === 1) {
                images[0].classList.remove('opacity-0');
            }
            return; // Pula se não houver imagens ou apenas uma
        }
        
        let currentImageIndex = 0;
        let intervalId = null;
        let isPaused = false;

        // Garante que apenas a primeira imagem esteja visível no início
        images.forEach((img, index) => {
            img.classList.toggle('opacity-0', index !== 0);
        });

        const startCarousel = () => {
            if (intervalId) clearInterval(intervalId); // Limpa intervalo anterior
            intervalId = setInterval(() => {
                if (isPaused) return;
                
                // Esconde a imagem atual
                images[currentImageIndex].classList.add('opacity-0');

                // Calcula o próximo índice
                currentImageIndex = (currentImageIndex + 1) % images.length;

                // Mostra a próxima imagem
                images[currentImageIndex].classList.remove('opacity-0');
            }, 3500); // Muda a imagem a cada 3.5 segundos
        };

        gallery.addEventListener('mouseenter', () => isPaused = true);
        gallery.addEventListener('mouseleave', () => isPaused = false);

        startCarousel();

        // Adiciona listener de clique para abrir o lightbox
        images.forEach((img, index) => {
            img.addEventListener('click', () => {
                // Passa a lista de imagens da galeria atual e o índice clicado
                openLightbox(Array.from(images), index);
            });
        });
    });

    function updateLightboxImage() {
        if (currentLightboxImages.length > 0) {
            lightboxImg.src = currentLightboxImages[currentLightboxIndex].src;
        }
        // Mostra ou esconde os botões de navegação
        const showButtons = currentLightboxImages.length > 1;
        prevLightboxBtn.classList.toggle('hidden', !showButtons);
        nextLightboxBtn.classList.toggle('hidden', !showButtons);
    }

    function openLightbox(images, index) {
        currentLightboxImages = images;
        currentLightboxIndex = index;
        updateLightboxImage();
        lightbox.classList.remove('hidden');
    }

    const close = () => {
        lightbox.classList.add('hidden');
        currentLightboxImages = []; // Limpa a galeria atual
    };

    closeLightbox.addEventListener('click', close);

    prevLightboxBtn.addEventListener('click', () => {
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
        updateLightboxImage();
    });

    nextLightboxBtn.addEventListener('click', () => {
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
        updateLightboxImage();
    });

    lightbox.addEventListener('click', (e) => {
        // Fecha se clicar fora da imagem
        if (e.target === lightbox) {
            close();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            close();
        }
    });
});