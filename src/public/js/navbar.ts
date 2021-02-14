function logout() {

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/logout';
  
    document.body.appendChild(form);
    form.submit();
}
