// Controle do menu mobile fixo
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const expanded = nav.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', String(expanded));
  });
}

// Animação suave ao rolar página
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((element) => revealObserver.observe(element));

// Validação do formulário de contato (quando existir na página)
const contactForm = document.getElementById('contact-form');
const statusField = document.getElementById('form-status');

if (contactForm && statusField) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      statusField.textContent = 'Por favor, preencha todos os campos.';
      statusField.style.color = '#b91c1c';
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      statusField.textContent = 'Informe um e-mail válido.';
      statusField.style.color = '#b91c1c';
      return;
    }

    statusField.textContent = 'Mensagem enviada com sucesso! Em breve entraremos em contato.';
    statusField.style.color = '#166534';
    contactForm.reset();
  });
}
