function toggleMode() {
    const body = document.body;
    const navbar = document.querySelector('.navbar');
    const isDark = body.classList.contains('dark');
  
    if (isDark) {
      body.classList.remove('dark');
      navbar.style.backgroundColor = 'black';
      body.style.backgroundColor = '#fff';  // lighter background
    } else {
      body.classList.add('dark');
      navbar.style.backgroundColor = 'white';
      body.style.backgroundColor = '#333';  // darker background
    }
  }
  